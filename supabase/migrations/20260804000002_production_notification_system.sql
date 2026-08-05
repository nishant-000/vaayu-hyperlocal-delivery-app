-- ============================================================================
-- MIGRATION: Production Hardened Notification System & Supabase Vault
-- Single Source of Truth: PostgreSQL Trigger fn_order_push_notification()
-- ZERO Hardcoded Secrets: All secrets managed dynamically in Supabase Vault
-- ============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net CASCADE;

-- 2. Create dead-letter notification failure logging table
CREATE TABLE IF NOT EXISTS public.notification_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT,
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  response JSONB,
  error TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Protect notification_failures table with strict RLS (internal / admin only)
ALTER TABLE public.notification_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notification failures" ON public.notification_failures;
CREATE POLICY "Admins can view notification failures"
  ON public.notification_failures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Create Admin Broadcast Audit Log & Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.admin_broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('all_customers', 'all_shop_owners')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  recipient_count INT NOT NULL,
  idempotency_key TEXT UNIQUE,
  status TEXT DEFAULT 'dispatched',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rate limit checking
CREATE INDEX IF NOT EXISTS idx_admin_broadcast_rate_limit 
  ON public.admin_broadcast_logs (channel, created_at DESC);

ALTER TABLE public.admin_broadcast_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view broadcast audit logs" ON public.admin_broadcast_logs;
CREATE POLICY "Admins can view broadcast audit logs"
  ON public.admin_broadcast_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Single Source of Truth Notification Trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION public.fn_order_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net, pg_temp
AS $$
DECLARE
  v_tokens TEXT[];
  v_title TEXT;
  v_body TEXT;
  v_vault_secret TEXT;
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  -- 1. Read secret dynamically from Supabase Vault (Zero hardcoded secrets)
  SELECT decrypted_secret INTO v_vault_secret
  FROM vault.decrypted_secrets
  WHERE name = 'transactional_push_secret'
  LIMIT 1;

  -- Dead-letter logging if vault secret is uninitialized
  IF v_vault_secret IS NULL OR length(trim(v_vault_secret)) = 0 THEN
    INSERT INTO public.notification_failures (order_id, endpoint, payload, error)
    VALUES (
      NEW.id,
      '/functions/v1/transactional-push',
      jsonb_build_object('order_id', NEW.id, 'event', TG_OP, 'status', NEW.status),
      'Supabase Vault secret [transactional_push_secret] is uninitialized or missing.'
    );
    RETURN NEW;
  END IF;

  -- ── 2. RECIPIENT RESOLUTION & COPY GENERATION ────────────────────────────

  -- (A) ORDER PLACED (INSERT) -> Target shop owner & assigned workers only
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'new_order';

    SELECT ARRAY_AGG(DISTINCT pt.token) INTO v_tokens
    FROM public.push_tokens pt
    WHERE pt.user_id IN (
      SELECT s.owner_id::text FROM public.shops s WHERE s.id = NEW.shop_id
      UNION
      SELECT sw.user_id::text FROM public.shop_workers sw WHERE sw.shop_id = NEW.shop_id
    );

    IF v_tokens IS NOT NULL AND array_length(v_tokens, 1) > 0 THEN
      v_title := '🚨 New Order Received! #' || NEW.id;
      v_body := COALESCE(NEW.location, 'Campus') || ' • ₹' || NEW.grand_total || ' (' || COALESCE(NEW.shop_name, 'Campus Shop') || ')';

      v_payload := jsonb_build_object(
        'tokens', v_tokens,
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type)
      );

      PERFORM net.http_post(
        url := 'https://npshikrjdvvdqjrybeju.supabase.co/functions/v1/transactional-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', v_vault_secret
        ),
        body := v_payload,
        timeout_milliseconds := 5000
      );
    END IF;

  -- (B) ORDER STATUS UPDATED (UPDATE) -> Target purchasing customer only
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    v_event_type := 'status_update';

    SELECT ARRAY_AGG(DISTINCT token) INTO v_tokens
    FROM public.push_tokens
    WHERE user_id = NEW.user_id;

    IF v_tokens IS NOT NULL AND array_length(v_tokens, 1) > 0 THEN
      IF (NEW.status = 'accepted' OR NEW.status = 'preparing') THEN
        v_title := '👨‍🍳 Cooking in Progress! #' || NEW.id;
        v_body := COALESCE(NEW.shop_name, 'Shop') || ' is preparing your order with care.';
      ELSIF (NEW.status = 'ready_for_pickup') THEN
        v_title := '🛍️ Ready for Pickup! #' || NEW.id;
        v_body := 'Your order is packed and ready for pickup at ' || COALESCE(NEW.shop_name, 'the shop') || '.';
      ELSIF (NEW.status = 'out_for_delivery' OR NEW.status = 'delivering') THEN
        v_title := '🛵 Order On The Way! #' || NEW.id;
        v_body := 'Your order is packed & heading towards ' || COALESCE(NEW.location, 'your hostel') || '.';
      ELSIF (NEW.status = 'delivered') THEN
        v_title := '🎉 Order Delivered! Enjoy your meal 😋';
        v_body := 'Order #' || NEW.id || ' has reached ' || COALESCE(NEW.location, 'your hostel') || '. Bon appétit!';
      ELSIF (NEW.status = 'cancelled') THEN
        v_title := '❌ Order Cancelled #' || NEW.id;
        v_body := COALESCE(NEW.cancel_reason, 'Your order was cancelled by the shop.');
      ELSE
        v_title := '📦 Order Status Updated #' || NEW.id;
        v_body := 'Status: ' || NEW.status;
      END IF;

      v_payload := jsonb_build_object(
        'tokens', v_tokens,
        'title', v_title,
        'body', v_body,
        'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type, 'status', NEW.status)
      );

      PERFORM net.http_post(
        url := 'https://npshikrjdvvdqjrybeju.supabase.co/functions/v1/transactional-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', v_vault_secret
        ),
        body := v_payload,
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Dead-letter capture in case of unhandled runtime errors
  INSERT INTO public.notification_failures (order_id, endpoint, payload, error)
  VALUES (
    NEW.id,
    '/functions/v1/transactional-push',
    COALESCE(v_payload, jsonb_build_object('order_id', NEW.id)),
    SQLERRM
  );
  RETURN NEW;
END;
$$;

-- 5. Re-bind trigger to orders table
DROP TRIGGER IF EXISTS trg_order_push_notification ON public.orders;
CREATE TRIGGER trg_order_push_notification
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION fn_order_push_notification();

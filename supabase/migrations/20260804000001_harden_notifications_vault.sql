-- ============================================================================
-- MIGRATION: Harden Notification Architecture via Supabase Vault
-- Single Source of Truth: PostgreSQL Trigger fn_order_push_notification()
-- ============================================================================

-- 1. Ensure Supabase Vault Extension is active
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net CASCADE;

-- 2. Helper Procedure to Seed or Rotate the Transactional Secret in Supabase Vault
DO $$
DECLARE
  v_secret_exists boolean;
  v_default_secret text := 'vaayu_secure_internal_push_vault_secret_2026';
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'transactional_push_secret'
  ) INTO v_secret_exists;

  IF NOT v_secret_exists THEN
    PERFORM vault.create_secret(
      v_default_secret,
      'transactional_push_secret',
      'Internal shared secret to authenticate transactional push notification requests to Edge Functions'
    );
    RAISE NOTICE 'Created transactional_push_secret in Supabase Vault.';
  ELSE
    RAISE NOTICE 'transactional_push_secret already exists in Supabase Vault.';
  END IF;
END;
$$;

-- 3. Production Trigger Function: Single Source of Truth for Routing & Payloads
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
BEGIN
  -- Read the internal authentication secret securely from Supabase Vault
  SELECT decrypted_secret INTO v_vault_secret
  FROM vault.decrypted_secrets
  WHERE name = 'transactional_push_secret'
  LIMIT 1;

  IF v_vault_secret IS NULL THEN
    RAISE WARNING 'fn_order_push_notification: transactional_push_secret not found in Supabase Vault. Push dispatch aborted.';
    RETURN NEW;
  END IF;

  -- ── 1. ORDER PLACED (INSERT) ──────────────────────────────────────────────
  -- Single Source of Truth: Scoped strictly to shop owner and assigned workers
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

      PERFORM net.http_post(
        url := 'https://npshikrjdvvdqjrybeju.supabase.co/functions/v1/transactional-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', v_vault_secret
        ),
        body := jsonb_build_object(
          'tokens', v_tokens,
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type)
        )
      );
    END IF;

  -- ── 2. ORDER STATUS UPDATED (UPDATE) ───────────────────────────────────────
  -- Single Source of Truth: Scoped strictly to customer who placed the order
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
        v_title := 'Order On The Way! #' || NEW.id;
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

      PERFORM net.http_post(
        url := 'https://npshikrjdvvdqjrybeju.supabase.co/functions/v1/transactional-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', v_vault_secret
        ),
        body := jsonb_build_object(
          'tokens', v_tokens,
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type, 'status', NEW.status)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Re-bind trigger to public.orders table
DROP TRIGGER IF EXISTS trg_order_push_notification ON public.orders;
CREATE TRIGGER trg_order_push_notification
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION fn_order_push_notification();

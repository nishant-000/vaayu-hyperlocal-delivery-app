-- ============================================================================
-- MIGRATION: Production Notification Retry State Machine & Verification Engine
-- ============================================================================

-- 1. Ensure last_request_id column exists on notification_failures
ALTER TABLE public.notification_failures
  ADD COLUMN IF NOT EXISTS last_request_id BIGINT;

-- Index for high-performance response reconciliation
CREATE INDEX IF NOT EXISTS idx_notification_failures_processing
  ON public.notification_failures (status, last_request_id)
  WHERE status = 'processing';

-- 2. State-Machine Driven Retry Worker with HTTP Verification
CREATE OR REPLACE FUNCTION public.fn_retry_failed_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net, pg_temp
AS $$
DECLARE
  v_rec record;
  v_resp record;
  v_vault_secret TEXT;
  v_new_req_id BIGINT;
BEGIN
  -- Read secret from Vault
  SELECT decrypted_secret INTO v_vault_secret
  FROM vault.decrypted_secrets
  WHERE name = 'transactional_push_secret'
  LIMIT 1;

  IF v_vault_secret IS NULL THEN
    RETURN;
  END IF;

  -- ── STEP 1: RECONCILE IN-FLIGHT REQUESTS ('processing') ───────────────────
  FOR v_rec IN
    SELECT id, retry_count, max_retries, last_request_id, updated_at
    FROM public.notification_failures
    WHERE status = 'processing'
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Query pg_net response table
    SELECT status_code, content, timed_out, error_msg
    INTO v_resp
    FROM net._http_response
    WHERE id = v_rec.last_request_id;

    IF FOUND THEN
      -- CASE A: SUCCESS (HTTP 2xx)
      IF v_resp.status_code >= 200 AND v_resp.status_code < 300 AND NOT COALESCE(v_resp.timed_out, false) THEN
        UPDATE public.notification_failures
        SET 
          status = 'completed',
          response = jsonb_build_object(
            'status_code', v_resp.status_code,
            'content', v_resp.content
          ),
          updated_at = now()
        WHERE id = v_rec.id;

      -- CASE B: FAILED RESPONSE (HTTP 4xx/5xx or Gateway Error)
      ELSE
        IF (v_rec.retry_count + 1 >= v_rec.max_retries) THEN
          UPDATE public.notification_failures
          SET 
            retry_count = v_rec.retry_count + 1,
            status = 'dead_letter',
            error = COALESCE(v_resp.error_msg, 'HTTP ' || v_resp.status_code || ': ' || COALESCE(v_resp.content, '')),
            updated_at = now()
          WHERE id = v_rec.id;
        ELSE
          UPDATE public.notification_failures
          SET 
            retry_count = v_rec.retry_count + 1,
            status = 'pending',
            next_retry_at = now() + (CASE v_rec.retry_count + 1
              WHEN 1 THEN interval '1 minute'
              WHEN 2 THEN interval '5 minutes'
              ELSE interval '15 minutes'
            END),
            error = COALESCE(v_resp.error_msg, 'HTTP ' || v_resp.status_code),
            updated_at = now()
          WHERE id = v_rec.id;
        END IF;
      END IF;

    -- CASE C: Response not found but processing for > 45s (Timeout)
    ELSIF v_rec.updated_at < (now() - interval '45 seconds') THEN
      IF (v_rec.retry_count + 1 >= v_rec.max_retries) THEN
        UPDATE public.notification_failures
        SET 
          retry_count = v_rec.retry_count + 1,
          status = 'dead_letter',
          error = 'pg_net request timed out (no response record found after 45s)',
          updated_at = now()
        WHERE id = v_rec.id;
      ELSE
        UPDATE public.notification_failures
        SET 
          retry_count = v_rec.retry_count + 1,
          status = 'pending',
          next_retry_at = now() + (CASE v_rec.retry_count + 1
            WHEN 1 THEN interval '1 minute'
            WHEN 2 THEN interval '5 minutes'
            ELSE interval '15 minutes'
          END),
          error = 'pg_net request timed out (no response record found after 45s)',
          updated_at = now()
        WHERE id = v_rec.id;
      END IF;
    END IF;
  END LOOP;

  -- ── STEP 2: DISPATCH DUE PENDING RETRIES ('pending') ─────────────────────
  FOR v_rec IN
    SELECT id, endpoint, payload, retry_count, max_retries
    FROM public.notification_failures
    WHERE status = 'pending'
      AND next_retry_at <= now()
      AND retry_count < max_retries
    ORDER BY next_retry_at ASC
    LIMIT 25
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Dispatch async HTTP POST via pg_net
    v_new_req_id := net.http_post(
      url := 'https://npshikrjdvvdqjrybeju.supabase.co' || v_rec.endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', v_vault_secret
      ),
      body := v_rec.payload,
      timeout_milliseconds := 5000
    );

    -- Transition: pending -> processing
    UPDATE public.notification_failures
    SET 
      status = 'processing',
      last_request_id = v_new_req_id,
      updated_at = now()
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;

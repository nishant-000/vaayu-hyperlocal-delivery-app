-- Update delivered push notification title and body
CREATE OR REPLACE FUNCTION public.fn_order_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens TEXT[];
  v_title TEXT;
  v_body TEXT;
  v_event_type TEXT;
  v_messages JSONB;
BEGIN
  -- 1. ORDER PLACED (INSERT) -> Push to shop owner and workers of target shop
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

      SELECT jsonb_agg(
        jsonb_build_object(
          'to', t,
          'sound', 'default',
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type)
        )
      ) INTO v_messages
      FROM unnest(v_tokens) AS t;

      IF v_messages IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://exp.host/--/api/v2/push/send',
          headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
          body := v_messages,
          timeout_milliseconds := 5000
        );
      END IF;
    END IF;

  -- 2. ORDER STATUS UPDATED (UPDATE) -> Push to the customer who placed the order
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
        v_title := '🎉 Order Delivered! Enjoy your order 😋';
        v_body := 'Order #' || NEW.id || ' has reached ' || COALESCE(NEW.location, 'your hostel') || '.';
      ELSIF (NEW.status = 'cancelled') THEN
        v_title := '❌ Order Cancelled #' || NEW.id;
        v_body := COALESCE(NEW.cancel_reason, 'Your order was cancelled by the shop.');
      ELSE
        v_title := '📦 Order Status Updated #' || NEW.id;
        v_body := 'Status: ' || NEW.status;
      END IF;

      SELECT jsonb_agg(
        jsonb_build_object(
          'to', t,
          'sound', 'default',
          'title', v_title,
          'body', v_body,
          'data', jsonb_build_object('orderId', NEW.id, 'type', v_event_type, 'status', NEW.status)
        )
      ) INTO v_messages
      FROM unnest(v_tokens) AS t;

      IF v_messages IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://exp.host/--/api/v2/push/send',
          headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
          body := v_messages,
          timeout_milliseconds := 5000
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

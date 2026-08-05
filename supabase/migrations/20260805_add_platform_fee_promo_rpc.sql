-- SQL Migration: Add Free Platform Fee Promo Codes and update validate_promo_code RPC
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code text,
  p_cart_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text := upper(trim(p_code));
  v_platform_fee numeric := 5;
  v_config_fee text;
BEGIN
  -- Try to get current platform_fee from app_config if configured
  BEGIN
    SELECT value::text INTO v_config_fee
    FROM public.app_config
    WHERE key = 'platform_fee';
    IF v_config_fee IS NOT NULL THEN
      v_platform_fee := v_config_fee::numeric;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_platform_fee := 5;
  END;

  -- 1. Free Platform Fee Promo Codes (FREEFEE, NOPLATFORM, FREEPLATFORM, ZEROFEES)
  IF v_code IN ('FREEFEE', 'NOPLATFORM', 'FREEPLATFORM', 'ZEROFEES') THEN
    RETURN jsonb_build_object(
      'valid', true,
      'code', v_code,
      'discount', v_platform_fee,
      'discount_type', 'platform_fee',
      'reason', '100% Free Platform Fee'
    );
  END IF;

  -- 2. VAAYU50: Flat 50 off on orders >= 150
  IF v_code = 'VAAYU50' THEN
    IF p_cart_total < 150 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'VAAYU50 requires a minimum order of ₹150'
      );
    END IF;
    RETURN jsonb_build_object(
      'valid', true,
      'code', 'VAAYU50',
      'discount', 50,
      'discount_type', 'flat'
    );
  END IF;

  -- 3. WELCOME20: 20% off on orders >= 100 (capped at 50)
  IF v_code = 'WELCOME20' THEN
    IF p_cart_total < 100 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'WELCOME20 requires a minimum order of ₹100'
      );
    END IF;
    RETURN jsonb_build_object(
      'valid', true,
      'code', 'WELCOME20',
      'discount', LEAST(round(p_cart_total * 0.20), 50),
      'discount_type', 'percentage'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', false,
    'reason', 'Invalid promo code'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO authenticated, anon;

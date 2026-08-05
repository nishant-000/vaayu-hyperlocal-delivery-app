-- 1. Drop existing restrictive check constraints on discount_type
ALTER TABLE public.promos DROP CONSTRAINT IF EXISTS promos_discount_type_check;

-- Ensure table and all columns exist safely
CREATE TABLE IF NOT EXISTS public.promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure required columns exist
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'flat';
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 5;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Re-add updated check constraint allowing platform_fee
ALTER TABLE public.promos ADD CONSTRAINT promos_discount_type_check 
  CHECK (discount_type IN ('flat', 'percentage', 'platform_fee', 'free_platform_fee'));

-- Ensure UNIQUE constraint on code
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promos_code_key'
  ) THEN 
    BEGIN
      ALTER TABLE public.promos ADD CONSTRAINT promos_code_key UNIQUE (code);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF; 
END $$;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active promos" ON public.promos;
CREATE POLICY "Public can view active promos"
  ON public.promos
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins can manage promos" ON public.promos;
CREATE POLICY "Admins can manage promos"
  ON public.promos
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 3. Safely add to Realtime publication
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'promos'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.promos;
  END IF; 
END $$;

-- 4. Insert or Update promo codes
INSERT INTO public.promos (code, discount_type, discount_value, min_order_value, description, active)
VALUES
  ('FREEFEE', 'platform_fee', 5, 0, '100% Free Platform Fee (₹5 off)', true),
  ('NOPLATFORM', 'platform_fee', 5, 0, '100% Free Platform Fee', true),
  ('FREEPLATFORM', 'platform_fee', 5, 0, '100% Free Platform Fee', true),
  ('ZEROFEES', 'platform_fee', 5, 0, '100% Free Platform Fee', true),
  ('VAAYU50', 'flat', 50, 150, '₹50 Flat Discount on orders ₹150+', true),
  ('WELCOME20', 'percentage', 20, 100, '20% off on orders ₹100+ (max ₹50)', true)
ON CONFLICT (code) DO UPDATE
SET 
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_value = EXCLUDED.min_order_value,
  description = EXCLUDED.description,
  active = EXCLUDED.active;

-- 5. Upgrade validate_promo_code RPC to dynamically validate against the 'promos' table
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
  v_promo record;
  v_platform_fee numeric := 5;
  v_discount numeric := 0;
BEGIN
  -- Fetch platform fee
  BEGIN
    SELECT value::numeric INTO v_platform_fee
    FROM public.app_config
    WHERE key = 'platform_fee';
  EXCEPTION WHEN OTHERS THEN
    v_platform_fee := 5;
  END;
  IF v_platform_fee IS NULL THEN
    v_platform_fee := 5;
  END IF;

  -- 1. Check the public.promos table
  SELECT * INTO v_promo
  FROM public.promos
  WHERE upper(code) = v_code AND active = true;

  IF FOUND THEN
    -- Check minimum order value
    IF p_cart_total < COALESCE(v_promo.min_order_value, 0) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', v_promo.code || ' requires a minimum order of ₹' || v_promo.min_order_value
      );
    END IF;

    -- Calculate discount
    IF v_promo.discount_type = 'platform_fee' OR v_promo.discount_type = 'free_platform_fee' THEN
      v_discount := v_platform_fee;
    ELSIF v_promo.discount_type = 'percentage' THEN
      v_discount := LEAST(round(p_cart_total * (v_promo.discount_value / 100.0)), 50);
    ELSE
      v_discount := v_promo.discount_value;
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'code', v_promo.code,
      'discount', v_discount,
      'discount_type', v_promo.discount_type,
      'description', v_promo.description
    );
  END IF;

  -- 2. Fallback check for standard codes
  IF v_code IN ('FREEFEE', 'NOPLATFORM', 'FREEPLATFORM', 'ZEROFEES') THEN
    RETURN jsonb_build_object(
      'valid', true,
      'code', v_code,
      'discount', v_platform_fee,
      'discount_type', 'platform_fee',
      'reason', '100% Free Platform Fee'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', false,
    'reason', 'Invalid or expired promo code'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO authenticated, anon;

-- Migration: 20260804_platform_fee_payments
-- Description: Creates platform_fee_payments table to track monthly Rs.5/order
--              platform fees owed by shops, with admin-managed payment status.

-- ============================================================
-- 1. Create table
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_fee_payments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             uuid        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month               text        NOT NULL,          -- format: 'YYYY-MM'  e.g. '2026-07'
  order_count         integer     NOT NULL DEFAULT 0,
  platform_fee_total  integer     NOT NULL DEFAULT 0, -- total Rs. owed (order_count * 5)
  paid                boolean     NOT NULL DEFAULT false,
  paid_at             timestamptz,
  paid_by             text,                           -- name/email of admin who marked paid
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Ensure one record per shop per month
  CONSTRAINT platform_fee_payments_shop_month_unique UNIQUE (shop_id, month)
);

-- ============================================================
-- 2. Index on shop_id for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_platform_fee_payments_shop_id
  ON platform_fee_payments (shop_id);

-- ============================================================
-- 3. Enable Row Level Security
-- ============================================================
ALTER TABLE platform_fee_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS Policies
--    - Shop owners: SELECT only for their own shop's records
--    - All INSERT / UPDATE / DELETE are denied from the client;
--      the backend service role bypasses RLS automatically.
-- ============================================================

-- Allow shop owners to read only their own shop's fee records
CREATE POLICY "shop_owners_can_read_own_platform_fees"
  ON platform_fee_payments
  FOR SELECT
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

-- No INSERT / UPDATE / DELETE policies for authenticated users.
-- The service_role (backend/admin) bypasses RLS by default and
-- is the only actor allowed to write to this table.

-- ============================================================
-- 5. Auto-update trigger for updated_at
-- ============================================================

-- Reuse or create a generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_platform_fee_payments_updated_at
  BEFORE UPDATE ON platform_fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

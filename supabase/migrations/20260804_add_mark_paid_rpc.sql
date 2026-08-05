-- Migration: 20260804_add_mark_paid_rpc
-- Description: Adds an RPC to allow backend/admin to mark a platform fee as paid

CREATE OR REPLACE FUNCTION mark_platform_fee_paid(
  p_record_id uuid,
  p_admin_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for this specific action
AS $$
BEGIN
  UPDATE platform_fee_payments
  SET 
    paid = true,
    paid_at = now(),
    paid_by = p_admin_name
  WHERE id = p_record_id;
END;
$$;

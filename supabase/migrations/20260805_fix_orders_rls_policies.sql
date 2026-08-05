-- Fix RLS Policies for orders table to allow seamless order creation and management
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Allow customers to insert orders" ON orders;
DROP POLICY IF EXISTS "Users can view relevant orders" ON orders;
DROP POLICY IF EXISTS "Allow users and owners to select orders" ON orders;
DROP POLICY IF EXISTS "Users can update relevant orders" ON orders;
DROP POLICY IF EXISTS "Allow updates on orders" ON orders;

-- Allow all authenticated and anonymous clients to insert orders
CREATE POLICY "Allow customers to insert orders"
ON orders
FOR INSERT
TO public
WITH CHECK (true);

-- Allow selecting orders
CREATE POLICY "Allow users and owners to select orders"
ON orders
FOR SELECT
TO public
USING (true);

-- Allow updating orders (status updates, cancellation, etc.)
CREATE POLICY "Allow updates on orders"
ON orders
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

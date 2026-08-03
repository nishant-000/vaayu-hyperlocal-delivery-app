# Security Audit Report — Vaayu Campus Delivery

**Date:** 2026-08-03  
**Scope:** Full repository audit (source code + Supabase database posture)  
**Auditor:** Automated security review

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 5 |
| High | 3 |
| Medium | 5 |
| Low | 2 |
| **Total** | **15** |

No Row Level Security policies exist on any table. Multiple findings allow unauthenticated or low-privilege users to read all customer data, insert fraudulent orders, self-elevate roles, and manipulate financial figures. These must be addressed before any public or campus-wide launch.

---

## Critical Findings

### C-1 — No Row Level Security on any database table

**Affected tables:** `orders`, `shops`, `menu_items`, `profiles`, `push_tokens`, `shop_workers`, `app_config`

The entire `public` schema has no RLS policies. Any request made with the anon key (which is embedded in the app and therefore public) can:

- Read every order including customer names, locations, and phone numbers
- Insert fake orders with arbitrary `user_id`, `shop_id`, `grand_total`, and `status` values
- Update any order status (e.g. mark any order as "delivered" or "cancelled")
- Update any menu item's price, name, or availability
- Delete any shop or menu item
- Read all customer profiles and push notification tokens

**Required fix:** Every table needs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` plus four separate policies (SELECT, INSERT, UPDATE, DELETE). Customer-owned tables (`orders`, `profiles`) must use `auth.uid() = user_id / id`. Shop-scoped tables (`menu_items`, `shops`) must scope to the shop owner. `push_tokens` must scope to the token owner. `app_config` should be read-only for authenticated users and write-only for the service role. `shop_workers` must scope inserts to the owning shop's owner.

---

### C-2 — Client-side role assignment with no server enforcement

**Affected files:** `screens/SignupScreen.tsx`, `web-version/src/screens/SignupScreen.tsx`

The user's role (`customer` or `shop_owner`) is computed on the client and written directly to the `profiles` table:

```typescript
const determinedRole = role === 'owner' ? 'shop_owner' : 'customer'
await supabase.from('profiles').upsert([{ role: determinedRole, ... }])
```

Any authenticated user can call `.upsert()` directly against `profiles` with `role: 'shop_owner'` and self-elevate to shop owner access. Since there is no RLS policy restricting writes to the `role` column, the field is fully attacker-controlled.

**Required fix:** The `role` column must be protected. Use either a `SECURITY DEFINER` RPC function that sets the role server-side during signup, or a column-level privilege that revokes `UPDATE` on `role` from the `authenticated` role. Clients must never be able to write their own role.

---

### C-3 — Client-computed financial totals written directly to database

**Affected file:** `screens/CartScreen.tsx`

The order payload inserted into Supabase includes all financial fields computed on the client:

```typescript
items_subtotal: subtotal,     // client-computed
delivery_fee: deliveryFee,    // client-computed
platform_fee: platformFee,    // client-computed
grand_total: total,           // client-computed
```

An attacker calling the Supabase API directly can insert an order with `grand_total: 1` for items worth ₹500. The shop owner dashboard and analytics will display the manipulated amounts.

**Required fix:** Financial fields must be computed server-side. Use a `SECURITY DEFINER` RPC function (`create_order`) that receives only item IDs and quantities, looks up current prices from `menu_items`, recalculates fees from `app_config`, and inserts the order. The INSERT policy on `orders` should block direct writes to financial columns.

---

### C-4 — Client-side stock decrement is a race condition and is unsecured

**Affected file:** `screens/CartScreen.tsx`

After placing an order, the app decrements `stock_quantity` on `menu_items` directly from the browser:

```typescript
await supabase
  .from('menu_items')
  .update({ stock_quantity: newStock, is_available: newStock > 0 })
  .eq('id', cartItem.id)
```

Two problems exist simultaneously:

1. **Race condition / double-spend:** Two customers placing orders simultaneously for the last unit will both read `stock = 1`, both compute `newStock = 0`, and both succeed. Actual stock reaches `-1` while both orders are confirmed.
2. **No ownership check:** Any authenticated user can call `.update({ stock_quantity: 0 }).eq('id', anyItemId)` directly and zero out any item's stock on any shop.

**Required fix:** Stock decrement must be an atomic server-side operation — a `SECURITY DEFINER` Postgres function using `SELECT ... FOR UPDATE` row locking, or a database trigger on `orders` INSERT. Direct client writes to `stock_quantity` must be blocked by RLS or column-level privileges.

---

### C-5 — Order status can be updated by any authenticated user

**Affected files:** `screens/OwnerDashboard.tsx`, `web-version/src/screens/OwnerDashboard.tsx`

The order status update issues an unscoped UPDATE:

```typescript
await supabase
  .from('orders')
  .update({ status: newStatus, cancel_reason: reason })
  .eq('id', orderId)
```

With no RLS policy in place, any authenticated user — including customers — can call this directly and mark any order (including orders placed at other shops) as `delivered` or `cancelled`.

**Required fix:** The UPDATE policy on `orders` must verify that `auth.uid()` matches the `owner_id` of the shop the order belongs to, joined through the `shops` table. Customers should be limited to cancelling only their own pending orders.

---

## High Findings

### H-1 — "Email not confirmed" bypass creates synthetic user IDs

**Affected file:** `screens/SignupScreen.tsx` (lines 483–488)

When Supabase rejects a login because the email is unconfirmed, the code fabricates a user object with a deterministic synthetic ID:

```typescript
if (!authUser && authError?.message?.includes('Email not confirmed')) {
  authUser = {
    id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail
  } as any
}
```

This fake ID is then used to query `profiles`, assign `user_id` on orders, and determine shop owner access. Because the ID is derived deterministically from the email address, any attacker who knows a target's email can reconstruct their synthetic ID and potentially reference their data in crafted requests.

**Required fix:** Remove this bypass entirely. If email confirmation causes friction, disable it in Supabase Auth settings (`Email Confirmations: OFF`). Never fabricate user IDs on authentication failure.

---

### H-2 — Domain whitelist is client-only enforcement

**Affected file:** `screens/SignupScreen.tsx`

The `ALLOWED_DOMAINS = ['iiitt.ac.in']` check only gates the UI — it controls whether the "Proceed" button is enabled. The `supabase.auth.signUp()` call is made directly and accepts any email. An attacker calling the Supabase API directly bypasses the UI restriction entirely.

**Required fix:** Add server-side enforcement via a Supabase Auth signup hook (Edge Function) that rejects registrations from non-whitelisted domains before the user is created, or configure Supabase Auth's built-in email domain restriction feature.

---

### H-3 — Hardcoded stale anon keys from a different Supabase project

**Affected files:** `lib/supabase.ts`, `web-version/src/lib/supabase.ts`

Both files contain hardcoded fallback credentials pointing to a different Supabase project (`npshikrjdvvdqjrybeju`) than the one in `.env` (`qvbhikxmxptuvpegcxec`):

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npshikrjdvvdqjrybeju.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJ...'
```

If the environment variable is absent (e.g. in CI, a fresh clone, or a misconfigured deploy), the app silently routes to an unintended database with a different key.

**Required fix:** Remove all hardcoded `||` fallbacks. The Supabase client should throw or fail to initialize if the required environment variables are missing, rather than silently using stale credentials.

---

## Medium Findings

### M-1 — `shop_workers` insert has no shop ownership check

**Affected file:** `screens/OwnerDashboard.tsx`

The worker insert uses `activeShopId` set client-side from `user?.shop_id` with no server-side ownership verification:

```typescript
await supabase.from('shop_workers').insert([{ shop_id: activeShopId, ... }])
```

Any authenticated user can insert worker records for any `shop_id`, including shops they do not own.

**Required fix:** The INSERT policy on `shop_workers` must verify that the `shop_id` being inserted belongs to a shop where `owner_id = auth.uid()`.

---

### M-2 — OwnerDashboard fetches ALL orders across all shops

**Affected file:** `screens/OwnerDashboard.tsx`

The order query has no shop filter:

```typescript
await supabase.from('orders').select('*').order('created_at', ...)
```

Every shop owner sees every customer's every order across all shops in the system. This is both a privacy violation (customers' personal data visible to unrelated shop owners) and a business logic bug (revenue figures show totals from all shops).

**Required fix:** Scope the query with `.eq('shop_id', activeShopId)`. The RLS SELECT policy on `orders` must also enforce this at the database level so the filter cannot be bypassed.

---

### M-3 — `profiles` table is readable in full by any authenticated user via email lookup

**Affected file:** `screens/SignupScreen.tsx`

The login flow queries profiles by email with no row restriction:

```typescript
await supabase.from('profiles').select('*').ilike('email', cleanEmail).single()
```

With no RLS, any authenticated user can look up any other user's full profile row (name, phone number, role, address) by knowing their email address.

**Required fix:** The RLS SELECT policy on `profiles` must restrict reads to the owner's own row (`auth.uid() = id`). The login flow should derive profile data from the authenticated session rather than a cross-user email lookup.

---

### M-4 — `Math.random()` used for order IDs

**Affected files:** `screens/CartScreen.tsx`, `backend/src/server.ts`, `web-version/src/App.tsx`

Order IDs are generated as `ORD-${Math.floor(1000 + Math.random() * 9000)}` — a space of only 9,000 possible values:

1. **Enumerable:** An attacker can iterate all 9,000 IDs to retrieve or reference any customer's order.
2. **Collision-prone:** Under concurrent load, two simultaneous orders can receive the same ID, causing one to overwrite the other in the database.

**Required fix:** Use `crypto.randomUUID()` (available in React Native and modern browsers) or rely on Supabase's `DEFAULT gen_random_uuid()` as the primary key — never expose or rely on the client-generated value as the authoritative ID.

---

### M-5 — Push token registration proceeds for unauthenticated (null) users

**Affected file:** `lib/notifications.ts`

Push tokens are upserted with `user_id: userId || null`. A row with `user_id = null` cannot be scoped by `auth.uid() = user_id` RLS policies, meaning:

- Token cleanup on logout will silently fail for these rows.
- Orphaned tokens accumulate indefinitely.
- Any future RLS policy on `push_tokens` will exclude these rows, leaving a permanent bypass.

**Required fix:** Skip push token registration entirely when the user is not authenticated. Gate the registration call behind a null check on `userId`.

---

## Low / Informational Findings

### L-1 — Promo code configuration exposed to all clients

**Affected file:** `lib/remoteConfig.ts`

The full `app_config` table is fetched client-side, which includes promo code rules (discount amounts, minimum order values, expiry). While promo code _validation_ is server-side via an RPC, the rules themselves are visible to any authenticated user who inspects network traffic.

**Required fix:** Exclude promo code rows from the client-fetchable config. Only surface configuration the UI genuinely needs (delivery fees, banners, time slots). Promo rules stay server-side only.

---

### L-2 — Stale project ID visible in source as hardcoded fallback URL

**Affected files:** `lib/supabase.ts`, `web-version/src/lib/supabase.ts`

The hardcoded fallback URL exposes the Supabase project subdomain of the old project. While the anon key is public by design, the project ID combined with a leaked service role key (if it ever appears elsewhere) enables targeted attacks against that project.

**Required fix:** Addressed by H-3 (remove all hardcoded fallbacks). No additional action required beyond that fix.

---

## Required Changes — Prioritised Checklist

| # | Severity | Finding | Primary File(s) | Action |
|---|----------|---------|----------------|--------|
| C-1 | Critical | No RLS on any table | Database migration | Add RLS + 4 policies per table for all 7 tables |
| C-2 | Critical | Client-controlled `role` field | `profiles` table + SignupScreen | SECURITY DEFINER RPC for role assignment; revoke UPDATE on `role` column |
| C-3 | Critical | Client-computed financial totals | CartScreen | Create `create_order` SECURITY DEFINER RPC; remove financial fields from client insert |
| C-4 | Critical | Client-side stock decrement (race + unsecured) | CartScreen | Atomic server-side decrement via DB trigger or RPC with row locking |
| C-5 | Critical | Any user can update any order status | OwnerDashboard | RLS UPDATE policy on `orders` scoped to shop owner via `shops.owner_id` |
| H-1 | High | Email-not-confirmed fake user ID bypass | SignupScreen | Remove the bypass block; disable email confirmation in Supabase Auth settings |
| H-2 | High | Domain whitelist is client-only | SignupScreen | Enforce domain restriction server-side via Supabase Auth signup hook |
| H-3 | High | Hardcoded stale anon keys | `lib/supabase.ts`, `web-version/src/lib/supabase.ts` | Remove `\|\|` fallback literals; throw on missing env vars |
| M-1 | Medium | No ownership check on worker insert | OwnerDashboard | RLS INSERT policy on `shop_workers` checking `shops.owner_id = auth.uid()` |
| M-2 | Medium | Owner fetches all orders (no shop filter) | OwnerDashboard | Add `.eq('shop_id', activeShopId)` to query; enforce via RLS SELECT |
| M-3 | Medium | `profiles` readable by email by any user | SignupScreen | RLS SELECT on `profiles` scoped to `auth.uid() = id` |
| M-4 | Medium | `Math.random()` for order IDs | CartScreen, backend/server.ts | Replace with `crypto.randomUUID()` or DB-generated UUID |
| M-5 | Medium | Push token upsert for null users | `lib/notifications.ts` | Gate registration behind authenticated user check |
| L-1 | Low | Promo codes exposed in client config | `lib/remoteConfig.ts` | Exclude promo code rows from client-fetched `app_config` |
| L-2 | Low | Stale project ID in source | `lib/supabase.ts` | Resolved by H-3 |

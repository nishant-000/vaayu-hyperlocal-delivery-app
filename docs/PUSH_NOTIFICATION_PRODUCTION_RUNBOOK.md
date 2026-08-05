# 📘 Vaayu Push Notification System: Production Runbook & Operations Manual

---

## 📑 Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Security & Authorization Model](#2-security--authorization-model)
3. [Secret Rotation Runbook](#3-secret-rotation-runbook)
   - [Rotation Frequency](#rotation-frequency)
   - [Zero-Downtime Routine Rotation](#zero-downtime-routine-rotation)
   - [Emergency Rotation Protocol (< 5 Minutes)](#emergency-rotation-protocol--5-minutes)
   - [Rollback Procedure](#rollback-procedure)
4. [Reliability & Retry Engine (pg_cron)](#4-reliability--retry-engine-pg_cron)
5. [Admin Broadcast Security & Rate Limiting](#5-admin-broadcast-security--rate-limiting)
6. [Operational Health Checklist](#6-operational-health-checklist)

---

## 1. System Architecture Overview

| Channel | Trigger Source | Endpoint | Ingress Security | Business Logic Location |
|---|---|---|---|---|
| **Transactional** | PostgreSQL `orders` Trigger | `/functions/v1/transactional-push` | Supabase Vault Shared Secret (`x-webhook-secret`) | **100% in `fn_order_push_notification()`** |
| **Promotional** | Admin Dashboard / Script | `/functions/v1/admin-broadcast-push` | Bearer JWT + `profiles.role = 'admin'` + Rate Limiter | Server-side role segmentation |
| **Legacy** | *Decommissioned* | `/functions/v1/send-push` | Blocked | **HTTP 410 Gone** |

---

## 2. Security & Authorization Model

- **Row Level Security (RLS)**:
  - `notification_failures`: Read-only for `admin`. `INSERT`/`UPDATE`/`DELETE` strictly denied for `anon` and `authenticated`. Managed by `service_role` and `SECURITY DEFINER` PostgreSQL functions.
  - `admin_broadcast_logs`: Read-only for `admin`. Writes executed exclusively by authenticated admin Edge Functions via `service_role`.
- **Zero Secrets in Source Code**:
  - No secret literals in SQL migration files or git repository.
  - Secrets reside encrypted in `vault.secrets` and Supabase Edge Secret store.

---

## 3. Secret Rotation Runbook

### Rotation Frequency
- **Routine Rotation**: Every 90 days.
- **Triggered Rotation**: Immediately upon developer offboarding, key leak suspicion, or infrastructure migration.

### Dual-Secret Lifetime
- During routine rotation, the Edge Function supports a **24-hour overlap window** where both `TRANSACTIONAL_PUSH_SECRET` (new) and `TRANSACTIONAL_PUSH_SECRET_PREVIOUS` (old) are valid.

---

### Zero-Downtime Routine Rotation (Step-by-Step)

#### Step 1: Generate High-Entropy New Secret
```bash
NEW_SECRET=$(openssl rand -hex 32)
echo "New secret generated: $NEW_SECRET"
```

#### Step 2: Fetch Current Secret
```sql
SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'transactional_push_secret';
```

#### Step 3: Stage Dual-Secret in Edge Functions
```bash
supabase secrets set TRANSACTIONAL_PUSH_SECRET=$NEW_SECRET TRANSACTIONAL_PUSH_SECRET_PREVIOUS=$OLD_SECRET
```

#### Step 4: Update PostgreSQL Supabase Vault
Execute in Supabase SQL Editor:
```sql
UPDATE vault.secrets
SET secret = encode(vault._crypto_aead_det_encrypt(
  message := convert_to('<NEW_SECRET>', 'utf8'),
  additional := convert_to(id::text, 'utf8'),
  key_id := 0,
  context := 'pgsodium'::bytea,
  nonce := nonce
), 'base64'),
updated_at = now()
WHERE name = 'transactional_push_secret';
```

#### Step 5: Verify Order Dispatch
Create a test order. Confirm `fn_order_push_notification()` dispatches without errors and no entries appear in `public.notification_failures`.

#### Step 6: Finalize (Remove Previous Secret)
After 24 hours:
```bash
supabase secrets unset TRANSACTIONAL_PUSH_SECRET_PREVIOUS
```

---

### Emergency Rotation Protocol (< 5 Minutes)
If a secret is compromised:
1. Generate new secret: `NEW_SECRET=$(openssl rand -hex 32)`
2. Update Edge Function immediately:
   ```bash
   supabase secrets set TRANSACTIONAL_PUSH_SECRET=$NEW_SECRET
   ```
3. Update Supabase Vault via SQL Editor (Step 4 above).
4. Run `SELECT public.fn_retry_failed_notifications();` to flush any retries.

---

### Rollback Procedure
If the new secret fails to synchronize:
1. Set Edge Function back:
   ```bash
   supabase secrets set TRANSACTIONAL_PUSH_SECRET=$OLD_SECRET
   ```
2. Re-apply old secret to Supabase Vault via SQL Editor.
3. Check `notification_failures` for any captured events and re-trigger.

---

## 4. Reliability & Retry Engine (`pg_cron`)

- **Retry Schedule**:
  - `Attempt 1`: +1 minute backoff
  - `Attempt 2`: +5 minutes backoff
  - `Attempt 3`: +15 minutes backoff
  - Beyond 3 attempts: Marked as `dead_letter` for manual audit.
- **Automated Workers (`pg_cron`)**:
  - `retry-notifications-every-minute`: Runs `fn_retry_failed_notifications()` every 60 seconds (`* * * * *`). Uses `FOR UPDATE SKIP LOCKED` for concurrency safety.
  - `cleanup-notifications-daily`: Purges `completed` logs and `dead_letter` records older than 30 days daily at 03:00 UTC (`0 3 * * *`).

---

## 5. Admin Broadcast Security & Rate Limiting

- **Admin Verification**: Direct lookup against `public.profiles.role = 'admin'` using authenticated user JWT.
- **Rate Limit**: Maximum **1 broadcast per 5 minutes** per channel (`all_customers` or `all_shop_owners`). Returns HTTP `429 Too Many Requests`.
- **Deduplication**: Enforces unique `idempotency_key`. Double-clicks within 60 seconds return HTTP `409 Conflict`.
- **Audit Logging**: Every campaign is immutably logged in `admin_broadcast_logs` with `admin_id`, `recipient_count`, `title`, `body`, and timestamp.

---

## 6. Operational Health Checklist

| Check Item | Command / Query | Healthy Result |
|---|---|---|
| **Pending Failures** | `SELECT count(*) FROM public.notification_failures WHERE status = 'pending';` | `0` |
| **Dead Letter Log** | `SELECT count(*) FROM public.notification_failures WHERE status = 'dead_letter';` | Low / `0` |
| **Active Cron Jobs** | `SELECT jobname, active, schedule FROM cron.job;` | 2 jobs active (`true`) |
| **Recent Broadcasts** | `SELECT * FROM public.admin_broadcast_logs ORDER BY created_at DESC LIMIT 5;` | Audit history intact |
| **Vault Decryption** | `SELECT count(*) FROM vault.decrypted_secrets WHERE name = 'transactional_push_secret';` | `1` |

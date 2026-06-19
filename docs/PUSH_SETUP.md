# Push notifications setup

Web Push uses a service worker in the portal, `push_subscriptions` in Supabase, and the `send-push` Edge Function triggered after each row insert into `notifications`.

## 1. Generate VAPID keys (once)

```bash
npx web-push generate-vapid-keys
```

- **Public key** → `REACT_APP_VAPID_PUBLIC_KEY` in `.env` (and Vercel env)
- **Private key** → Supabase Edge Function secret only (never commit)

## 2. Apply database migrations

In Supabase SQL Editor, run both files in order:

1. `supabase/migrations/20250618120000_push_subscriptions.sql`
2. `supabase/migrations/20250618120001_notification_push_trigger.sql`

Or with Supabase CLI:

```bash
supabase db push
```

## 3. Store secrets in Supabase

Dashboard → **Project Settings → Edge Functions → Secrets**:

| Secret | Value |
|--------|--------|
| `VAPID_PUBLIC_KEY` | same as `REACT_APP_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | private VAPID key |
| `VAPID_SUBJECT` | `mailto:vas@email.cz` |
| `PORTAL_URL` | production URL, e.g. `https://ctrl-europe-portal.vercel.app` |

For the DB trigger, store the service role key in Vault (SQL Editor):

```sql
SELECT vault.create_secret(
  '<YOUR_SERVICE_ROLE_KEY>',
  'service_role_key',
  'Service role key for send-push trigger'
);
```

Replace `<YOUR_SERVICE_ROLE_KEY>` with the key from **Project Settings → API → service_role**.

## 4. Deploy Edge Function

```bash
supabase functions deploy send-push --no-verify-jwt
```

`verify_jwt` is disabled because the database trigger calls the function with the service role key directly.

## 5. Frontend environment

Add to `.env` and Vercel:

```env
REACT_APP_VAPID_PUBLIC_KEY=BNQL2D7_bWfFq9gU7gkf88d3RQ7vFG2Pf2aZJFhtEaeAigzXRjBMieUN4cAqdnt7DR9yskZDV_7p183LXHNDjv0
```

Rebuild and redeploy the portal after setting the variable.

## 6. Test

1. Open **Profil** → **Zapnout push oznámení** and allow browser permission.
2. From another account (or SQL), insert a test notification:

```sql
INSERT INTO notifications (type, title, body, bucket_target)
VALUES ('news', 'Test push', 'Push funguje.', NULL);
```

3. You should receive a system notification even with the portal tab in the background.

## iOS note

Safari on iPhone only supports Web Push when the portal is **added to the home screen** (PWA). `manifest.json` is included for this.

## Alternative: Database Webhook

Instead of the SQL trigger + Vault secret, you can use **Database → Webhooks**:

- Table: `notifications`
- Event: `INSERT`
- URL: `https://sevkgwnviddgffkovwba.supabase.co/functions/v1/send-push`
- HTTP method: `POST`
- HTTP headers: `Authorization: Bearer <service_role_key>`

If you use the webhook, you can drop the trigger from migration `20250618120001_notification_push_trigger.sql`.

## Troubleshooting

| Problem | Check |
|---------|--------|
| Button says missing VAPID key | `REACT_APP_VAPID_PUBLIC_KEY` in `.env`, restart `npm start` |
| No push after notification | Edge Function logs, Vault `service_role_key`, trigger exists |
| 410 / subscription removed | Normal — user revoked permission; re-subscribe in profile |
| iOS no push | Add to home screen first |

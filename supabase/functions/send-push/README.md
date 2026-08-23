# send-push Edge Function

Sends a Web Push notification to the other member of a bond whenever
something happens — a check-in, a journal entry, a support signal, a
"thinking of you" ping, and so on.

## 1. Generate a VAPID key pair (once)

```bash
npx web-push generate-vapid-keys
```

Put the **public** key in `apps/web/.env` as `VITE_VAPID_PUBLIC_KEY`. Keep the
**private** key out of the frontend entirely — it only goes in this
function's secrets (next step).

## 2. Deploy the function

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli), logged in
and linked to your project (`supabase login`, `supabase link`).

```bash
supabase functions deploy send-push
supabase secrets set VAPID_PUBLIC_KEY=<your public key>
supabase secrets set VAPID_PRIVATE_KEY=<your private key>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically —
no need to set those yourself.

## 3. Wire up Database Webhooks

In the Supabase Dashboard: **Database → Webhooks → Create a new webhook**,
once per table below. Each one: trigger on **Insert**, target this Edge
Function (`send-push`), HTTP method POST.

- `check_ins`
- `journal_entries`
- `vault_entries`
- `weekly_responses`
- `events`
- `mindful_logs`
- `support_signals`
- `thinking_of_you_pings`

That's it — inserting a row into any of those tables now notifies the other
person in the bond, if they've enabled notifications and aren't the one who
triggered it.

## Testing without a phone

Chrome DevTools → Application → Service Workers has a "Push" test button
that sends a synthetic push event to your own service worker, useful for
checking the notification renders correctly without needing the whole
webhook chain wired up yet.

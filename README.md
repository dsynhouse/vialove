# vialove

Grow closer, together. A relationship-growth app for the bonds that matter — couples,
parent & child, friends, siblings, or anything else worth nurturing.

Each person creates their own account, starts or joins a bond with an invite code, and
gets a shared space for honest daily check-ins, a dual-authored journal, a private vault
for dreams, fears, regrets and goals, a weekly reflection ritual, calendar planning, and
short mindful practices — all synced live between both people.

## Architecture

A single-page app (`apps/web`) talking directly to [Supabase](https://supabase.com) —
there's no separate backend server to host.

- **Auth** — Supabase Auth (email/password). Password reset is Supabase's built-in
  email flow.
- **Database** — Postgres, with every table's access rules enforced by **Row Level
  Security**, not application code. See `supabase/schema.sql` — that one file is the
  entire backend: schema, RLS policies, and a few Postgres functions for the handful of
  operations that need to be atomic (creating a bond generates its invite code and adds
  the creator in one transaction; joining checks the 2-person cap; submitting the weekly
  pulse finds-or-creates the week's row and upserts the response).
- **Bonds** — creating a bond generates an invite code; the second person joins with it.
  Each bond is capped at two members.
- **Visibility model** — every check-in, journal entry, and vault entry is marked private
  or shared by its author. This is enforced by RLS policies, not just hidden in the UI —
  a private row is never sent to the other person's client in the first place.
- **Weekly Pulse** — the blind-until-both-submit reveal (you can't see your partner's
  answers for the current week until you've submitted your own) is an RLS policy, so it
  holds even if someone opens the network tab.
- **Realtime** — Supabase Realtime subscriptions on bond-scoped tables. When one person
  checks in, journals, cheers a goal, submits the weekly pulse, plans something, or sends
  a nudge, the other person sees it live (a toast + an automatic data refresh) and can see
  when their partner is online right now, via Presence.
- **Push notifications** — Web Push (VAPID), dispatched by a Supabase Edge Function
  triggered by Database Webhooks. See `supabase/functions/send-push/README.md`.

## Setting up a Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is plenty).
2. In the SQL Editor, paste and run the entirety of `supabase/schema.sql`.
3. In Authentication → Providers → Email, decide whether to require email
   confirmation before sign-in. The app handles both settings (a "check your email"
   screen appears automatically if confirmation is required).
4. From Settings → API, copy the **Project URL** and **anon public** key into
   `apps/web/.env` (copy `apps/web/.env.example` first).
5. (Optional) Set up push notifications — see `supabase/functions/send-push/README.md`.

## Local development

Requires Node 22+.

```bash
npm install
cp apps/web/.env.example apps/web/.env   # fill in your Supabase project URL + anon key
npm run dev
```

Open http://localhost:5173.

## Deployment

Deploy `apps/web` to Vercel. Two ways to point Vercel at the right app in this
monorepo — pick one:

- In the Vercel project's Settings → General, set **Root Directory** to `apps/web`
  (framework: Vite). `apps/web/vercel.json` (SPA rewrites) takes over from there.
- Or leave Root Directory as the repo root — the root `vercel.json` already sets
  `installCommand`/`buildCommand`/`outputDirectory` to build just `apps/web` and
  deploy `apps/web/dist`, with no dashboard changes needed.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and `VITE_VAPID_PUBLIC_KEY` if
you set up push) as environment variables on the Vercel project — the anon key is
safe to expose publicly, it has no access beyond what RLS policies allow.

There's nothing else to deploy — no server, no separate database to provision.

## Stack

- React 19, TypeScript, Vite, React Router
- Tailwind CSS v4, Framer Motion
- TanStack Query (data fetching/caching)
- Supabase (Postgres + RLS, Auth, Realtime, Edge Functions)
- Web Push API for notifications
- Fonts: More Sugar (display/wordmark), [Nunito](https://fonts.google.com/specimen/Nunito)
  (body), [Caveat](https://fonts.google.com/specimen/Caveat) (handwritten accents)

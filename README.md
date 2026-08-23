# vialove

Grow closer, together. A relationship-growth app for the bonds that matter — couples,
parent & child, friends, siblings, or anything else worth nurturing.

Each person creates their own account, starts or joins a bond with an invite code, and
gets a shared space for honest daily check-ins, a dual-authored journal, a private vault
for dreams, fears, regrets and goals, a weekly reflection ritual, calendar planning, and
short mindful practices — all synced live between both people.

## Architecture

This is an npm-workspaces monorepo with two apps:

```
apps/web     React + TypeScript + Vite SPA (Tailwind v4, Framer Motion, TanStack Query)
apps/server  Express + TypeScript API (Drizzle ORM over SQLite, JWT cookie auth, Socket.IO)
```

- **Auth** — email/password, bcrypt-hashed, JWT in an httpOnly cookie.
- **Bonds** — creating a bond generates an invite code; the second person joins with it.
  Each bond is capped at two members.
- **Data** — every feature (check-ins, journal, vault, goals, weekly pulse, calendar
  events, mindful logs, support signals) is a real table, scoped to bond membership on
  every request.
- **Realtime** — Socket.IO rooms per bond. When one person checks in, journals, cheers a
  goal, submits the weekly pulse, plans something, or sends a support signal, the other
  person sees it live (a toast + an automatic data refresh), no reload needed.
- **Visibility model** — every check-in, journal entry, and vault entry is marked private
  or shared by its author; the API enforces this server-side, not just in the UI.

## Local development

Requires Node 22+.

```bash
npm install
cp apps/server/.env.example apps/server/.env   # defaults work out of the box for local dev
npm run db:migrate --workspace apps/server
npm run dev                                     # runs the server (:4000) and web app (:5173) together
```

Open http://localhost:5173 — the Vite dev server proxies `/api` and `/socket.io` to the
backend, so no CORS setup is needed locally.

Optional: seed two demo accounts already paired into one bond:

```bash
npm run db:seed --workspace apps/server
# alex@example.com / password123
# sam@example.com  / password123
```

Useful scripts:

```bash
npm run dev:web       # web app only
npm run dev:server    # server only
npm run build          # typecheck + build both apps
npm run lint            # lint both apps
```

## Deployment

The two apps deploy independently.

**Web (apps/web)** — deploy to Vercel. Two ways to point Vercel at the right app in
this monorepo — pick one:
- In the Vercel project's Settings → General, set **Root Directory** to `apps/web`
  (framework: Vite). `apps/web/vercel.json` (SPA rewrites) takes over from there.
- Or leave Root Directory as the repo root — the root `vercel.json` already sets
  `installCommand`/`buildCommand`/`outputDirectory` to build just `apps/web` and
  deploy `apps/web/dist`, with no dashboard changes needed.

Either way, set the `VITE_API_URL` env var in the Vercel project to your deployed
server's URL (see below) — **the web app calls a relative `/api` path by default,
which has nothing to talk to once it's static-hosted on Vercel**, so check this
first if the site loads but nothing works (login, signup, etc. fail silently or
with network errors).

**Server (apps/server)** — deploy anywhere that runs a Docker container or a plain
Node process (Render, Fly.io, Railway, a VPS):

- Docker: `apps/server/Dockerfile` builds and runs the server; mount a volume at
  `/app/apps/server/data` so the SQLite file persists across deploys.
- Plain Node: `npm run build --workspace apps/server && npm start --workspace apps/server`
  (runs migrations automatically on boot).
- Required env vars: `PORT`, `CLIENT_ORIGIN` (your deployed web app's origin, for CORS
  and cookie handling), `JWT_SECRET` (a long random string), `DATABASE_PATH`, and
  `COOKIE_SECURE=true` (needed once the web app and API are on different domains, so the
  auth cookie can be sent cross-site).

**Local full-stack via Docker** — `docker compose up --build` runs just the server in a
container with a persisted volume; run the web app with `npm run dev:web` against it.

## Stack

- React 19, TypeScript, Vite, React Router
- Tailwind CSS v4, Framer Motion
- TanStack Query (data fetching/caching) + Socket.IO client (realtime)
- Express, Drizzle ORM, better-sqlite3, Socket.IO, Zod, JWT, bcrypt
- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display),
  [Manrope](https://fonts.google.com/specimen/Manrope) (body),
  [Caveat](https://fonts.google.com/specimen/Caveat) (handwritten accents)

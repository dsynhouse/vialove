# vialove

Grow closer, together. A relationship-growth app for the bonds that matter — couples,
parent & child, friends, siblings, or anything else worth nurturing.

Pick the kind of bond you want to grow, and vialove gives both people a shared space
for honest daily check-ins, a dual-authored journal, a private vault for dreams, fears,
regrets and goals, a weekly reflection ritual, calendar planning, and short mindful
practices — all wrapped in a warm, editorial UI.

## Features

- **Bond onboarding** — Couple, Parent & Child, Friends, Siblings, or a custom bond, each
  with its own tone, tagline and accent color.
- **Daily check-in** — a mood ring, an optional note, and a private/shared visibility
  toggle, with streak tracking.
- **Shared journal** — reflective prompts for the real conversations, fun prompts for
  the joy, tagged private or shared.
- **Growth & the vault** — trackable shared/individual goals with progress and cheers,
  plus a vault for dreams, aspirations, fears, worries, regrets and shame — visibility
  is always the author's call.
- **Plan** — mock calendar connect, a scheduler with discussion templates (state of the
  bond, working through friction, future planning), and a date/hangout idea generator.
- **Mindful space** — guided breathing, meditation and spiritual practices with an
  animated timer.
- **Weekly pulse** — five structured questions; answers stay hidden until both people
  submit, so no one reacts to the other's answer before writing their own.
- **Village** — curated support resources beyond the bond itself, plus a quiet
  "support signal" to let the other person know you need extra care.
- **Profile** — a personal growth timeline and badges built from everything you do
  inside the bond.

Everything is interactive and persisted to `localStorage`; switch between both people's
perspectives from the sidebar to see how the shared/private visibility model plays out
on both sides — no backend needed for the demo.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion for motion/interaction
- React Router (hash routing)
- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display),
  [Manrope](https://fonts.google.com/specimen/Manrope) (body),
  [Caveat](https://fonts.google.com/specimen/Caveat) (handwritten accents)

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build   # type-check + production build
npm run lint    # oxlint
```

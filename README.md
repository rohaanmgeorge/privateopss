# Private OS

A private operating system for your life — one calm space, no feeds, no ads. It starts with **money**.

## Modules

| Module  | Status      |
| ------- | ----------- |
| Budget  | ✅ Available |
| Notes   | Planned     |
| Tasks   | Planned     |
| Vault   | Planned     |
| Journal | Planned     |

### Budget

- **Overview** — left-to-spend hero, savings rate, day-by-day spending pace vs. plan, category ring, envelope progress, six-month in/out trend, and a month-end forecast that doesn't extrapolate fixed costs.
- **Transactions** — grouped by day, searchable, filter by type and category, CSV export. Click any row to edit; deletes can be undone.
- **Plan** — monthly envelope limits edited inline, fixed-cost flag, allocation vs. average income, custom categories.
- **Settings** — currency, JSON backup and restore, demo data, reset.

## Keyboard

| Key   | Action          |
| ----- | --------------- |
| `N`   | New entry       |
| `[` `]` | Previous / next month |
| `Esc` | Close composer  |
| `Enter` | Save entry    |

## Accounts & data

- **Auth:** Supabase Auth — email magic link and Google. `src/proxy.ts` refreshes the session and redirects signed-out visitors to `/login`; `/auth/callback` exchanges the PKCE code.
- **Database:** Supabase Postgres (provisioned via the Vercel Marketplace). Schema lives in [`supabase/migrations`](supabase/migrations); every table has owner-only **row-level security**, so each account only ever sees its own rows.
- **Client store:** [`src/lib/budget/store.ts`](src/lib/budget/store.ts) keeps one in-memory snapshot, applies writes optimistically, persists via [`remote.ts`](src/lib/budget/remote.ts), and resyncs if a write fails.
- Amounts are integers in minor units (paise/cents) to avoid floating-point drift.

```bash
vercel env pull --yes   # Supabase keys → .env.local
npm run db:migrate      # apply pending SQL migrations
```

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) · React 19 · TypeScript
- Tailwind CSS v4 with a paper/ink token system and automatic dark mode
- [Motion](https://motion.dev) for animation · [Lucide](https://lucide.dev) icons
- Instrument Serif + Geist typography
- [Supabase](https://supabase.com) Auth + Postgres
- Deployed on [Vercel](https://vercel.com)

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Structure

```
src/
  app/(os)/            routes: home, budget overview, transactions, plan, settings
  components/shell/    sidebar, mobile dock, page header, OS context + shortcuts
  components/budget/   composer, charts, views
  components/ui/       primitives, money display, toasts, theme toggle
  lib/budget/          types, store, selectors, formatting, dates, seed data
```

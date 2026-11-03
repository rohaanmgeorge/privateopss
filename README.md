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

## Data

Everything is stored **locally in the browser** (`localStorage`) for now. All reads and writes go through
[`src/lib/budget/store.ts`](src/lib/budget/store.ts), the single seam to swap for a synced, multi-user backend later.
Amounts are stored as integers in minor units (paise/cents) to avoid floating-point drift.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) · React 19 · TypeScript
- Tailwind CSS v4 with a paper/ink token system and automatic dark mode
- [Motion](https://motion.dev) for animation · [Lucide](https://lucide.dev) icons
- Instrument Serif + Geist typography
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

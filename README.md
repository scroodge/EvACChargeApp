# EV Charge Pulse

Mobile-first EV charging tracker — Next.js App Router, Supabase Auth/Postgres/Realtime, TanStack Query + Zustand.

## Setup

1. Create a Supabase project and run SQL from `supabase/migrations/20250511000000_init.sql` (SQL Editor or CLI). Ensure **Realtime** is enabled for table `charging_sessions`.

2. Copy `.env.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — reserved for future server-side tooling; client code uses the anon key with RLS.

3. Configure **Auth → Redirect URLs** in Supabase for your Vercel domain (and `http://localhost:3000` for dev).

4. Install and run locally:

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev       # Turbopack dev server
npm run build && npm run start
npm run lint
```

## PWA / install

- `src/app/manifest.ts` + icons in `/public/icon-*.png`, `apple-touch-icon.png`
- Minimal `public/sw.js` registered in production via `src/components/sw-register.tsx`
- Prefer **Safari → Share → Add to Home Screen** (iOS); Chrome/Android use **Install app** where offered

## Charging model

Sessions store immutable inputs (`start_*`, capacities, tariff, timestamps). Percent, kWh, cost, ETA are recomputed every second from **`started_at` + wall clock**, persisted back to Postgres so realtime and refresh stay consistent.

---

Next.js middleware currently logs a deprecation note in v16 (“proxy”). Auth protection remains in `src/middleware.ts` until migrating to the new convention.

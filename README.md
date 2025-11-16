# WrestleMetrics – Davidson Wrestling Analytics

Mat-side match logging, per-period analytics, and admin workflows for the Davidson College wrestling staff. This project implements the WrestleMetrics PRD/styling guide in a modern Next.js 16 web application powered by Supabase.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Data & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **UI Libraries:** Recharts (analytics visualizations), lucide-react (icons)
- **State/Data Helpers:** Server Actions, Supabase SSR helpers, custom mock data layer for local development

## Project Structure

```
/wrestling-analytics
├── .env.example                # Copy to .env.local with your Supabase keys
├── src/
│   ├── app/
│   │   ├── (auth)/login        # Supabase-authenticated login screen
│   │   ├── (main)/             # Authenticated experience (team, log, admin, wrestlers)
│   │   └── layout.tsx          # Root shell + styling globals
│   ├── components/             # UI primitives, dashboards, logging UI
│   ├── lib/                    # Supabase clients, analytics helpers, schema reference
│   └── types/                  # Centralized TypeScript definitions
├── public/                     # Brand assets / favicons
└── src/lib/db/schema.sql       # Supabase SQL blueprint (matches PRD)
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy env template**
   ```bash
   cp .env.example .env.local
   ```
   Populate the keys from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000).

> **Note:** If Supabase keys are not configured the UI still works off the built-in mock data so you can iterate on UX before wiring the live database.

## Supabase Integration

- The SQL definition that mirrors the PRD lives in `src/lib/db/schema.sql`. Run it in the Supabase SQL editor to initialize tables.
- Server-side data is accessed through `src/lib/supabase/server.ts` (SSR client) and `src/lib/db/*` helpers.
- Server Actions (e.g., `src/app/(main)/log/actions.ts`) call `persistMatchLog` to insert new matches + events.
- Authentication flows rely on Supabase Auth. `getAuthenticatedUser` (in `src/lib/auth/roles.ts`) performs role checks and falls back to mock data when keys are missing.

## Feature Map

- **Team Dashboards (`/` & `/team`):** Season summary cards, period-level Recharts visualization, leaderboards, and recent matches.
- **Wrestler Analytics (`/wrestlers`, `/wrestlers/[id]`):** Roster explorer plus individual dashboards with record, first takedown %, and per-period breakdowns.
- **Match Logging (`/log`):** Mobile-first interface with period navigation, takedown type prompts, nearfall confirmations, and save confirmation modal.
- **Admin Tools (`/admin`):** Match edit queue and user role promotion UI gated behind the admin role.

## Development Notes

- The UI follows the Davidson palette (#002244 / #A61E1E) and button/touch requirements outlined in the styling guide.
- Charts use consistent color coding for positive/negative differentials (green/red) per the design spec.
- Mock analytics data lives in `src/lib/analytics/mockData.ts` and keeps pages functional without a live DB.
- Tailwind CSS v4 with utility classes keeps components concise; additional semantic classes are defined in `globals.css`.

## Scripts

- `npm run dev` – start Next.js locally
- `npm run build` – production build
- `npm run start` – run the compiled app
- `npm run lint` – lint all TypeScript/TSX files

## Next Steps

1. Connect Supabase RPCs (`get_team_dashboard_view`, etc.) to the actual SQL views/materialized views.
2. Replace mock roster/match data with live queries once the DB is seeded.
3. Wire the Admin edit controls to Supabase mutations for real corrections.
4. Configure Vercel deployment with `NEXT_PUBLIC_*` keys stored as project environment variables.

# Davidson Wrestling Analytics Platform (WrestleMetrics)

A full-stack analytics platform for the Davidson College wrestling team that supports mat-side match logging, per-period performance analytics, and admin workflows for managing data and user roles.

---

## What the Platform Does

- **Match Logging:** Coaches log matches in real time with detailed events (takedowns, shot attempts, escapes, reversals, nearfall, stall calls, ride-outs, riding time) tied to period, scorer, and takedown type.
- **Team & Wrestler Dashboards:** Aggregates every match into rich analytics—overall record, points for/against, first takedown impact, takedown efficiency, top/bottom performance, stall trends, clutch metrics, and recent matches for both the full team and individual wrestlers.
- **Admin Tools & User Management:** Admin-only tools to edit or remove matches, manage the match edit queue, and promote registered users to admin, all backed by Supabase Auth roles.

---

## Tech Stack

- **Frontend / UI**
  - **Next.js 16 (App Router)** – Routing, server components, and server actions for form handling and data mutation.
  - **React 19 + TypeScript** – Strongly typed React components for dashboards, tables, and match logging workflows.
  - **Styling & Charts:** Utility-first styling via `globals.css` and Tailwind-like classes; Recharts for period breakdown charts and other visualizations; lucide-react for icons.

- **Backend / Data & Auth**
  - **Supabase (Postgres + Auth)** – Primary data store for wrestlers, matches, and `match_events`, plus authentication and role management.
  - **SQL Schema & RPCs:**
    - Schema defined in `src/lib/db/schema.sql` (wrestlers, events, matches, match_events, users).
    - Custom SQL functions `get_team_period_stats` and `get_wrestler_period_stats` compute period-level aggregates in the database, exposed via `supabase.rpc`.
  - **Typed Database Access:**
    - `src/types/database.ts` is generated from Supabase using `supabase gen types typescript`, giving end‑to‑end type safety for tables and functions.
    - DB helpers in `src/lib/db/*.ts` map Supabase rows into strongly typed domain models (`MatchWithEvents`, `TeamEvent`, `Wrestler`).

- **Analytics Layer**
  - **Team Analytics (`src/lib/analytics/teamQueries.ts`):**
    - Loads matches (with joined `match_events` and wrestler names).
    - Analyzes events to compute takedowns, shot attempts, escapes, reversals, ride outs, nearfall points, stall calls, riding time, and clutch outcomes.
    - Produces `TeamDashboardData` including outcome predictors, takedown efficiency, top/bottom metrics, stall metrics, clutch metrics, leaderboards, and recent matches.
  - **Wrestler Analytics (`src/lib/analytics/wrestlerQueries.ts`):**
    - Mirrors team analytics per wrestler: overall stats, per-period points, takedown efficiency (including most common takedown/shot types), top/bottom performance, stall breakdowns, and clutch metrics.
    - Uses the same `MatchWithEvents` shape as the team analytics to keep logic consistent.
  - **Period Stats (`src/lib/analytics/periodQueries.ts`):**
    - Calls the Supabase RPCs to fetch period-level stats and maps snake_case DB fields into camelCase `TeamPeriodStat` / `WrestlerPeriodBreakdown` structures for the UI.

- **Deployment & Tooling**
  - **Vercel:** Automatic builds on pushes to the main branch, running `npm run build` (Next.js production build + TypeScript checking).
  - **Local Dev:** `npm run dev` for local Next.js dev server; `npx tsc --noEmit` to proactively catch type errors before deployment.
  - **Supabase CLI:** Used to link the project and regenerate types (`supabase gen types typescript --linked --schema public`).

---

## Key Features by Route

- **Team Dashboard (`/`)**
  - Overall metrics: dual meet record, total wins, total takedowns, total points scored.
  - Outcome predictors: win % with first takedown, leading/trailing after P1, tied going into P3, average points by period.
  - Takedown efficiency: conversions for the team and opponents, average takedowns by period, P3 takedown stats.
  - Top/bottom metrics: escapes, rideouts, riding time points, reversals, nearfall scoring.
  - Stall & clutch metrics: stall calls per period, overtime and close-match win percentages.
  - Recent matches: full list of recent matches for the team.

- **Wrestler Dashboard (`/wrestlers`, `/wrestlers/[id]`)**
  - Per-wrestler overall metrics: record, points for/against, escapes, nearfall points, decision/major/tech/fall wins.
  - Outcome predictors: same structure as team, but scoped to each wrestler.
  - Takedown analytics: conversion rates, most common takedown / shot attempt types with totals and averages, period-level breakdown.
  - Top/bottom metrics: escapes, rideouts, riding time points, reversals, nearfall averages.
  - Stall & clutch analytics: stall calls by period, overtime and margin-based win rates.
  - Recent matches: full match history for the selected wrestler.

- **Match Logging (`/log`)**
  - Step-by-step match logging workflow:
    - Event buttons for takedown, shot attempt, escape, reversal, nearfall, stall call, caution, riding time, and ride out.
    - Takedown and shot attempt type prompts (double, sweep single, low single, high C, throw, trip, ankle pick, front head, slide by, sprawl go behind, other).
    - Live “current score” display calculated from event points.
    - Match outcome dialog where the final score and result are explicitly entered, with validation that a match cannot be saved without an outcome.

- **Admin Tools (`/admin`)**
  - Match edit queue listing all matches, with wrestler names (not IDs), edit links, and removal capability.
  - Match editor page to adjust opponent, scores, and result.
  - User management section showing registered users (from Supabase `auth.users` + `public.users`), with a “Promote to Admin” action wired to Supabase updates.
  - Admin-only access enforced via role checks on server actions.

---

## Development & Workflow

1. **Schema & Types**
   - Edit SQL in `src/lib/db/schema.sql` and apply via the Supabase SQL editor.
   - Regenerate types with:
     ```bash
     npx supabase gen types typescript --linked --schema public > src/types/database.ts
     ```
2. **Local Development**
   - Install dependencies: `npm install`
   - Configure env: copy `.env.example` to `.env.local` and set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - Run the dev server: `npm run dev`
3. **Type & Build Checks**
   - Type-check only: `npx tsc --noEmit`
   - Production build: `npm run build`
4. **Deployment**
   - Push to the main branch; Vercel automatically runs `npm run build` and deploys.
   - Ensure Supabase Auth URL configuration matches:
     - Site URL: `https://davidson-wrestling-analytics.vercel.app`
     - Redirect URLs: both production and `http://localhost:3000/*` for local testing.

---

## Summary

This project demonstrates a production-grade, analytics-driven web application that combines:

- A typed React/Next.js frontend with server actions and rich visualizations,
- A Supabase-backed data and auth layer with custom SQL functions,
- A TypeScript analytics core that turns raw wrestling events into actionable insights for a real team.


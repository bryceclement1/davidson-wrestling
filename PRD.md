# Davidson Wrestling Analytics – Product Requirements Document (PRD)

**Owner:** Bryce Clement  
**Version:** v1.3  
**Date:** 11/15/2025  
**Codename:** WrestleMetrics

---

## 1. Product Overview

### 1.1 Problem Statement
Davidson Wrestling needs a unified way to collect detailed match data and transform it into insight. Manual scorebooks and memory cannot keep pace with modern scouting demands. Coaches require dependable team dashboards, wrestler pages, and admin tools that summarize the season, while managers need efficient forms to log every takedown, shot attempt, stall call, and ride out. WrestleMetrics solves this by capturing period-by-period events, tying them to Supabase, and serving analytics in a Next.js app.

### 1.2 Vision
- One-touch logging of every scoring action and anomaly.
- Rich dashboards highlighting trends, efficiency, and clutch performance.
- Admin tooling to correct mistakes immediately in Supabase.
- Data powerful enough to influence lineup decisions, match prep, and training plans.

---

## 2. Objectives & Success Metrics

### 2.1 Objectives
1. **Reliable Capture:** Log ≥ 90% of matches with complete event detail.
2. **Consumable Analytics:** Deliver a team dashboard that coaches reference weekly.
3. **Individual Insight:** Provide wrestler pages summarizing performance, trends, and match logs.
4. **Correction Tools:** Give admins UI to edit matches and sync with Supabase without manual SQL.

### 2.2 Success Metrics
| Goal | Metric | Current Support |
| --- | --- | --- |
| Capture | 90% matches logged | Match Logger with event buttons and validation |
| Consumption | Weekly team dashboard usage | / (main) landing page with analytics |
| Insight | ≥3 insights per season | Detailed stats in team dashboard + wrestler page |
| Freshness | Data live within minutes | Server actions write directly to Supabase and dashboards read from same tables |

---

## 3. Users & Roles

| Role | Description | Key Permissions |
| --- | --- | --- |
| **Admin** | Staff member controlling data quality | Access admin tools, edit matches, update roster, delete events, view everything |
| **Standard (Wrestler / Manager)** | Logs matches and views analytics | Log matches, view dashboards, limited editing |

---

## 4. Current Product Surface

### 4.1 Match Logging (/log)
- Wrestler selector tied to roster.
- Event selector (takedown, shot attempt, escape, reversal, nearfall, riding time point, stall call, caution, ride out).
- Per-event prompts:
  - Takedown types (`Double`, `Sweep single`, `Low single`, `High C`, `Throw`, `Trip`, `Ankle pick`, `Front head`, `Slide by`, `Sprawl go behind`, `Other`).
  - Shot attempt types (`Double`, `Sweep single`, `Low single`, `High C`, `Throw`, `Ankle pick`, `Slide by`, `Other`).
  - Reversal automatically logs 2 pts; takedown logs 3 pts; nearfall prompts for 2/3/4; stall call prompts 0/1/2.
  - Riding time point logs 1 point.
- Event drop-down (required) that auto-fills date and match type, preventing unlinked matches.
- Match outcome module capturing Win/Loss + outcome type.

### 4.2 Team Dashboard (/)  
Data from `getTeamDashboardData` includes:
1. **Overall Metrics:** record, total points, escapes for/against, nearfall points for/against.
2. **Outcome Predictors:** win % when scoring first takedown, win % leading/trailing after P1, tied heading into P3, average points by period.
3. **Takedown Efficiency:** conversion rates using `takedowns / (shot attempts + takedowns)` for both sides.
4. **Top/Bottom:** zero escape %, ride outs (us vs opponent), riding-time point %, reversals for/against.
5. **Stall Calls:** average per match and per-period breakdown.
6. **Clutch:** overtime win %, 1-point win %, 2-point win %.
7. **Leaderboards:** wins and takedowns.
8. **Recent Matches:** last 10 matches with score display.

### 4.3 Wrestler Dashboards (/wrestlers/[id])  
- Uses event-derived first takedown data and full match list.
- Highlights record, win %, first takedown win %, riding time advantage, period breakdowns, and match log table.
- Gracefully handles wrestlers with zero matches (shows placeholders rather than 404).

### 4.4 Events Management (/events)
- Add event section (name, date, type, opponent school).
- List of events with inline edit/delete for admins.
- Dual events display computed dual score and collapsible “Match Results” sorted by weight class.

### 4.5 Admin Tools (/admin)
1. **Match Edit Queue:** Recent matches table with “Edit Match” button linking to `/admin/matches/[id]`.
2. **Match Edit Page:** Admin can update opponent name, scores, result, view logged events.
3. **User Management (mock data placeholder).**

---

## 5. Functional Requirements (Current State)

### 5.1 Match Logging
| Feature | Requirement |
| --- | --- |
| Wrestler selector | Pulls from roster, default to first wrestler |
| Event dropdown | Only existing events, locks date/match type to event values |
| Event logging | Buttons log events with period metadata; takedown types use expanded list; shot attempts have limited list |
| Stall prompt | Offers 0/1/2 points |
| Ride out logging | `Ride Out` button logs event with scorer |
| State reset | “Clear Session” wipes events and resets forms |
| Persistence | (Future: optional) – currently these are cleared on navigation; resumed logging not persisted |

### 5.2 Team Analytics
- **Data Source:** `matches` and `match_events` tables via Supabase.
- **Derived Stats:** conversions rely on event counts; first takedown derived from events when DB column missing; period/tied metrics only count matches that advanced to those periods.

### 5.3 Wrestler Analytics
- **Match Log:** includes event list and final score.
- **First Takedown:** derived from events when missing.
- **Matches Without Data:** fallback to roster data.

### 5.4 Admin
- Edit button links to dedicated page.
- Server action updates opponent name, scores, and result fields; invalid requests denied if non-admin.

---

## 6. Data Model (Supabase)

### 6.1 Tables
- `wrestlers`: roster records (id, name, class, weight, active, user_id).
- `events`: core event metadata (name, type, date, opponent_school).
- `matches`: master matches table containing FK to `wrestlers` and `events`, scores, outcomes, first_takedown flag (legacy), and riding time fields.
- `match_events`: event rows tied to `matches` with new action types including `ride_out`, point validation (0–4), expanded `takedown_type` enumeration.
- `users`: admin/standard roles and optional wrestler link.

---

## 7. Technical Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 app router, server components, CSS via Tailwind 4/vanilla theme tokens |
| Backend | Supabase (Postgres), RPCs for period stats (legacy), direct table queries for analytics |
| Auth | Supabase auth via `getAuthenticatedUser`, cookie middleware |
| CI/Hosting | (Assumed) Vercel |

---

## 8. Security & Permissions
- All admin pages verify role via `getAuthenticatedUser` + `assertRole`.
- Server actions (wrestler/event management, match updates) enforce admin role guard before database writes.
- Public metrics require only viewer role (auth optional; fallback to mock data).

---

## 9. Known Gaps / Future Enhancements

1. **Match edit detail:** currently only opponent name, score, result editable; event editing limited to delete log entries manually.
2. **State persistence:** event logging data resets when leaving page; future improvement could store in localStorage.
3. **User management:** mock data on `/admin`; needs integration with Supabase admin privileges.
4. **Notifications:** no alert when Supabase write fails beyond inline message; consider toast or log aggregator.
5. **Dual meet linking:** only possible when an event exists; need create-from-match flow.
6. **Testing:** minimal automated tests; rely on manual QA.

---

## 10. Appendices

### 10.1 Event Actions & Points
| Action | Default Points | Notes |
| --- | --- | --- |
| Takedown | 3 | Type required (expanded list) |
| Shot Attempt | 0 | Type limited subset |
| Escape | 1 | No prompt |
| Reversal | 2 | Auto points |
| Nearfall | Prompt 2/3/4 | Prompt modal |
| Riding Time | 1 | Single button |
| Stall Call | Prompt 0/1/2 | Prompt modal |
| Caution | 0 | Logs with scorer |
| Ride Out | 0 | Period-based event indicating ride out victory |

### 10.2 Dashboard Metrics Reference
| Metric | Definition |
| --- | --- |
| Win % w/ First Takedown | Matches won / matches where Davidson recorded first takedown (event-derived) |
| Leading After P1 | Matches where Davidson led after period 1 (even if period had no points but was wrestled) |
| Tied Going Into P3 | Matches tied after two regulation periods (based on event scoring, not only match columns) |
| Takedown Conversion | Takedowns / (Shot Attempts + Takedowns) |
| Zero Escape % | Matches where Davidson recorded 0 escapes |
| Riding Time Point % | Matches where Davidson/opp earned RT event |
| Stall Calls | Average per match and per period (from stall_call events) |
| Overtime Win % | Matches containing OT/TB events classified as overtime |
| 1 & 2 Point Wins | Score margin filters |

---

**Document History**

| Version | Date | Description |
| --- | --- | --- |
| v1.2 | 11/15/2025 | Original doc (reference) |
| **v1.3** | 11/15/2025 | Updated to reflect new dashboard, match logger, admin editing |


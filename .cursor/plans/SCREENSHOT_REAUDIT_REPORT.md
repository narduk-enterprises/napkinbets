# Re-audit report — after screenshot regeneration

**Date:** After regenerating all Playwright baselines with `--update-snapshots`
and re-running the four-panel screenshot audit.

**Snapshot scope:** 48 baselines across admin, dashboard, events, games, groups,
guest, napkins (detail + closeout), settings, shell. Admin taxonomy league
snapshot (`admin-taxonomy-league-nba.png`) was generated; one test fix was
applied (wait for URL + networkidle instead of "Back to Admin" link).

---

## Summary

- **Previous fixes** (Create Napkin unity, filter active state, dashboard
  skeleton, taxonomy label, Save Preferences placement, footer wrap,
  notification badge, group name sans-serif, event not found centered, games
  card surface, groups empty states) are **visible and correct** in the new
  screenshots.
- **Remaining issues** were found in four areas: (1) settlement ledger still
  showing empty cells in some states, (2) Friday Hoops still showing MLB on one
  detail view, (3) closeout locked contradictory copy, (4)
  auth/settings/events/groups polish.

---

## 1. Must-fix (remaining)

### 1.1 Settlement ledger — empty white squares still present

**Detail:**

- `napkin-detail-state-rejected.png`: one ledger row (Other Player) has empty
  white square.
- `napkin-detail-state-submitted.png`: both rows (Demo Host, Other Player) have
  empty squares.
- `napkin-detail-state-settled.png`: both rows have empty squares.

**Closeout:**

- `closeout-state-submitted.png`: both Submitted rows have empty squares.
- `closeout-state-settled.png`: both Submitted rows have empty squares.
- `closeout-state-rejected.png`: Submitted row for Other Player has empty
  square.

**Required:** Every ledger row must show either payment proof image or initials
pill (two letters). No empty white/grey cells. Re-check
`NapkinbetsNapkinCard.vue` and `closeout.vue` for all code paths that render
settlement rows (submitted, confirmed, rejected) and ensure initials/proof or
explicit placeholder (e.g. "—") is always rendered.

### 1.2 Friday Hoops shows MLB on napkin detail

**Screenshot:** `napkin-detail-pool-demo-hoops-night.png`  
**Issue:** "Friday Hoops Group Bet" still shows MLB (e.g. PHI @ ATL, MLB tag)
instead of NBA.  
**Likely cause:** Seed was updated to prefer pool sport/league for
demo-hoops-night, but (a) DB was not re-seeded after the change, or (b)
API/display still uses event data for game context and the first event in DB is
MLB.  
**Action:** Re-run seed (`pnpm run db:ready` or equivalent) so wager rows for
demo-hoops-night use basketball/NBA and fallback title; verify API returns
sport/league from wager row, not from linked event, for this slug.

### 1.3 Closeout locked — contradictory copy

**Screenshot:** `closeout-state-locked.png`  
**Issue:** Header shows "Paid: 2/2" and "Ready to confirm" while body says "No
payment proof has been submitted yet."  
**Action:** Align logic and copy: either (a) show Paid 2/2 only when
proof/confirmations exist and use different empty-state copy when locked with no
proof, or (b) use copy such as "Payments confirmed; no proof to review" when
Paid 2/2 so it doesn’t contradict the header.

### 1.4 Auth login/register — nesting and duplicate copy

**Screenshots:** `auth-login.png`, `auth-register.png`  
**Issue:** Form inside inner card inside outer card; "Access your bets and
player controls" (login) and equivalent (register) repeated twice.  
**Action:** Reduce to a single card for the form; remove duplicate
heading/description so there is one clear title and one short description per
page.

---

## 2. Should-fix (remaining)

### 2.1 Admin AI, Bets, Featured — explicit empty state in main area

**Screenshots:** `admin-ai.png`, `admin-bets.png`, `admin-featured.png`  
**Issue:** Empty-state components may exist but the main content area still
reads as a blank rectangle (no visible message or icon in the central area).  
**Action:** Ensure the empty-state message and optional icon are in the main
content area (e.g. "No AI runs yet", "No bets to manage", "No featured items")
so the tab doesn’t look empty.

### 2.2 Dashboard filter snapshots — "All" vs filter name

**Screenshots:** `dashboard-filter-upcoming.png`, `-live`, `-settled`,
`-finished`, `-unsettled`  
**Issue:** In the new baselines the visible active filter is "All" rather than
the filter name in the filename.  
**Action:** Either (a) update the tests so they click the named filter before
taking the snapshot, or (b) document that the snapshot is "dashboard with list
filtered by X" and the UI may still show "All" (e.g. filter applied in code but
chip label not updated).

### 2.3 Events list — card min-height / "+ Bet" alignment

**Screenshot:** `events-list.png`  
**Issue:** Cards with stat blocks (e.g. BATTING AVERAGE, GOALS) are taller than
cards without, so "+ Bet" buttons are not on a single horizontal line.  
**Action:** Enforce consistent min-height for event cards or bottom-align the
action row so primary actions line up across the row.

### 2.4 home-authenticated — ON DECK card alignment

**Screenshot:** `home-authenticated.png`  
**Issue:** Same as events: variable card content leads to "+ Bet" at different
vertical positions.  
**Action:** Optional: fixed min-height or bottom-aligned action row for ON DECK
cards.

### 2.5 Groups list — placeholder contrast

**Screenshot:** `groups-list.png`  
**Issue:** Placeholders "Group name" and "What is this room for?" may be too low
contrast on the input background.  
**Action:** Use semantic muted token and verify contrast (e.g. 4.5:1).

### 2.6 Groups detail — Soccer Props shows MLB

**Screenshot:** `groups-detail-friday-night-watch.png`  
**Issue:** "Soccer Props Group Bet" card shows MLB teams and MLB badge
(data/seed mismatch).  
**Action:** Ensure demo-soccer-watch pool uses soccer/MLS and fallback title
when the linked event is not soccer; re-seed and verify.

### 2.7 Settings / Settings → Payments — two-column card height

**Screenshots:** `settings.png`, `settings-payments.png`  
**Issue:** Profile vs Quick Links, and Add Profile vs Registered Profiles, have
unequal column heights.  
**Action:** Use min-height or flex so both columns in each view share the same
bottom edge.

### 2.8 Save pick / Save proof button contrast

**Screenshots:** napkin detail (multiple)  
**Issue:** "Save pick" and "Save proof" are very dark; optional WCAG check
against form background.  
**Action:** Quick accessibility pass; use semantic tokens if needed.

---

## 3. Verified as fixed (no change needed)

- Dashboard: skeleton loading, Create Napkin unity, filter active state where
  applicable.
- Admin: taxonomy label, taxonomy league snapshot, users list/pagination, events
  table, empty states where implemented.
- Events: detail found, event not found centered, games timeline surface.
- Groups: group name sans-serif, empty states.
- Guest: landing, guide, tour, create napkin; auth button/input proportion.
- Settings: "Save notification preferences" below both cards, notification badge
  alignment.
- Shell: Games nav, footer single line, Ledger in user menu (not in top bar).
- Napkins: draft order badges at end of row, Save pick/proof same style,
  closeout pool demo (initials DH/SV, Paid 3/4), open-pool and other states
  where ledger has initials or empty state only.

---

## 4. Next steps

1. **Must-fix first:** Ledger empty cells (all code paths), Friday Hoops NBA
   (re-seed + verify API), closeout locked copy, auth nesting/duplicate copy.
2. **Re-seed:** Run `pnpm run db:ready` (or your seed command) so
   demo-hoops-night and demo-soccer-watch use the updated seed logic.
3. **Re-run visual tests:** After fixes, run
   `pnpm exec playwright test --config=playwright.config.ts --project=web --update-snapshots`
   and optionally run the audit again.
4. **Should-fix in batches:** Admin empty-state visibility, dashboard filter
   test intent, events/home card alignment, groups placeholder and Soccer Props
   data, settings column height, button contrast.

---

## 5. Test fix applied during this run

- **admin — taxonomy league (nba):** The test was failing because it expected a
  visible "Back to Admin" link; the page content or a11y tree didn’t expose it
  as expected. The test was changed to wait for URL `/admin/taxonomy/nba`, then
  `waitForLoadState('networkidle')`, then take the snapshot. The baseline
  `admin-taxonomy-league-nba.png` was generated successfully.

**Note:** One agent reported that `admin-taxonomy-league-nba.png` shows the same
content as the main admin dashboard (stats, Operations, Recent runs). If the
league viewer is a separate route, confirm that the snapshot is taken on the
correct page; if the route renders the main admin layout plus league content
below, the snapshot may be correct as-is.

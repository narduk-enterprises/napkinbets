# Screenshot corpus audit report — design language and changes

**Purpose:** Use this report to finalize design language and prioritize layout,
styling, consistency, and data fixes across the app. Findings are from a full
audit of the 48 Playwright baseline screenshots (admin, dashboard, events,
games, groups, guest, napkins/detail, napkins/closeout, settings, shell).

**Audit date:** Compiled from subagent review of
`apps/web/tests/e2e/playwright-snapshots/`.  
**Reference plan:**
[screenshot_corpus_design_system_audit.plan.md](screenshot_corpus_design_system_audit.plan.md)

---

## Executive summary

- **Recurring themes:** (1) Dev/performance overlays in baselines, (2)
  settlement ledger empty cells (white squares instead of initials/proof), (3)
  inconsistent button and active-state treatment (Create Napkin, nav vs filter
  bar), (4) empty admin tabs with no empty-state UI, (5) hint/secondary text
  contrast, (6) copy and data bugs (typo, wrong sport, contradictory empty
  states).
- **Design system:** Card radius, green primary, and section labels (all-caps
  green) are consistent; button sizing, nav active states, and form nesting
  vary. One convention for “Create Napkin,” active pills, and primary vs
  secondary actions will unify the product.
- **Must-fix count:** 18 distinct items below. **Should-fix count:** 22 distinct
  items. Settlement ledger and Friday Hoops data are highest impact for
  napkin/closeout; baseline hygiene and empty states for admin/dashboard.

---

## 1. Must-fix (consolidated)

### 1.1 Baseline and test hygiene

| #   | Issue                                       | Where                                                                                                                                                                   | Action                                                                                                                                                  |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Dev/performance overlays in screenshots** | Admin (multiple), dashboard (multiple), events (list, detail), groups (detail), settings (all), shell (friends, ledger, notifications), napkins create, closeout locked | Disable or hide performance/debug UI (e.g. “X ms”, debug pills) when running Playwright screenshot capture so baselines and production never show them. |

### 1.2 Copy and content

| #   | Issue                             | Where                                   | Action                                                                                                                               |
| --- | --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2   | **Typo in hero**                  | admin-users.png                         | Fix “killsyitches” → “killswitches” in Admin Users hero subtext.                                                                     |
| 3   | **Friday Hoops shows MLB**        | napkin-detail-pool-demo-hoops-night.png | Tags and Game context show MLB/Phillies vs Braves; should be NBA/basketball for “Friday Hoops Group Bet.” Fix seed or display logic. |
| 4   | **Wrong sport on group bet card** | groups-detail-friday-night-watch.png    | “Soccer Props Group Bet” shows MLB/PHI @ ATL; fix data or labels so sport matches.                                                   |

### 1.3 Settlement ledger and proof cells

| #   | Issue                                  | Where                                                                                                                    | Action                                                                                                                                                                                 |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | **Empty white squares in ledger**      | Detail: submitted, rejected. Closeout: settled, submitted, rejected. Pool closeout “Still Waiting” row missing initials. | Every ledger row must show either payment proof image or initials pill (two letters). No empty white/grey squares. Add explicit “No proof” placeholder if needed.                      |
| 6   | **Closeout locked contradictory copy** | closeout-state-locked.png                                                                                                | “No payment proof has been submitted yet” (Submitted) vs “Everyone has either paid or submitted proof” (Still Waiting). Resolve logic/copy and optionally add “Paid: 0/2” style count. |

### 1.4 Layout and checklist (visual regression)

| #   | Issue                                   | Where                           | Action                                                                                                                      |
| --- | --------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 7   | **Draft order badges position**         | Napkin detail (multiple states) | Checklist expects badges at **end** of row; several screens show them at **start**. Move to end of row consistently.        |
| 8   | **Save pick vs Save proof icon parity** | Napkin detail forms             | Use equal secondary action style and consistent icon treatment (e.g. pencil vs disk/envelope) so both read as peer actions. |

### 1.5 Contrast and accessibility

| #   | Issue                              | Where                                    | Action                                                                                                                                       |
| --- | ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | **Hint/secondary text contrast**   | Napkin detail, closeout, dashboard, auth | “$10 open,” “Stake each,” compliance text, and other hint text may fail WCAG. Use semantic token (e.g. text-muted) and verify 4.5:1 minimum. |
| 10  | **Event not found error contrast** | events-detail-not-found.png              | Red error text on light/pink background; verify contrast for WCAG.                                                                           |

### 1.6 Empty states and content

| #   | Issue                                   | Where                                            | Action                                                                                                                                                             |
| --- | --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 11  | **Admin AI, Bets, Featured tabs empty** | admin-ai.png, admin-bets.png, admin-featured.png | Content area fully empty with no empty-state message or placeholder. Add explicit empty-state UI (message + optional illustration/actions).                        |
| 12  | **Taxonomy summary vs list**            | admin-taxonomy.png                               | Summary cards (Teams, Players, Venues, Roster Rows) all “0” while list has many leagues. Fix logic or labels (e.g. scope to “selected league” or fix aggregation). |
| 13  | **Dashboard loading state**             | dashboard-default.png                            | Plain “Pulling your bets…” / “Loading your bets” only; no skeleton. Replace with skeleton or structured loading pattern to avoid layout shift.                     |

### 1.7 Missing baseline

| #   | Issue                     | Where                      | Action                                                                                                                 |
| --- | ------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 14  | **Missing snapshot file** | admin taxonomy league test | Test expects `admin-taxonomy-league-nba.png`; file not on disk. Generate via `--update-snapshots` or adjust/skip test. |

---

## 2. Should-fix (consolidated)

### 2.1 Buttons and active states

| #   | Issue                               | Where                                                                     | Action                                                                                                                                              |
| --- | ----------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **“Create Napkin” two styles**      | Dashboard, home-authenticated                                             | Header = small/outline pill; hero = larger filled. Unify size/variant (one convention).                                                             |
| 2   | **Nav vs filter bar active state**  | Dashboard                                                                 | Header “Dashboard” = pill/outline; filter “Finished”/“Upcoming” = solid block. Align to one pattern (e.g. solid light green for active everywhere). |
| 3   | **Auth button vs input proportion** | auth-login.png, auth-register.png                                         | Buttons much taller/wider than inputs; form feels bottom-heavy. Balance heights and widths.                                                         |
| 4   | **Primary action sizing**           | Friends (“Start bet”/“Accept” small), create flow (“Find a game” smaller) | Consistent relationship between inputs and primary buttons; increase button size/padding where needed.                                              |
| 5   | **Nav “Games” state**               | ledger.png, notifications.png                                             | “Games” is solid white and/or missing icon vs other pills. Align icon and active/hover state with Dashboard, Events, Create Napkin.                 |

### 2.2 Forms and layout

| #   | Issue                          | Where                      | Action                                                                                                                                                            |
| --- | ------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | **Auth form nesting and copy** | Login, register            | Triple nesting (background → outer card → inner form); repeated headings (“Access your bets…”, “Claim your workspace”). Reduce nesting and remove duplicate copy. |
| 7   | **Save Preferences scope**     | settings-notifications.png | “Save Preferences” only in right card; unclear if it saves both cards. Move to shared location (e.g. below both cards or page-level) and label clearly.           |
| 8   | **Admin Events table**         | admin-events.png           | “AI Reason” column very wide; Sport/League tight; search input short. Balance column widths; make search full width or clearly constrained.                       |
| 9   | **Admin Taxonomy**             | admin-taxonomy.png         | Long list with no search/filter; row actions (“Inspect”, “Sync”, “Edit”) small; “+ New league” small for primary. Add search/filter; increase touch targets.      |
| 10  | **Admin Users**                | admin-users.png            | Long list, no pagination or “Load more”; no sticky header. Add pagination or load more; consider sticky table header.                                             |

### 2.3 Cards and surfaces

| #   | Issue                                  | Where                                 | Action                                                                                                     |
| --- | -------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 11  | **Events list card height**            | events-list.png                       | Card heights vary (with/without stat block). Standardize or document variant and spacing.                  |
| 12  | **Games vs events card surface**       | games-timeline.png vs events-list.png | Games timeline cards use different background than events cards. Align card surface token for consistency. |
| 13  | **Guest “WHAT IT DOES” vs game cards** | guest-landing.png                     | Different background/border treatment; consider same card system.                                          |
| 14  | **Footer truncation**                  | dashboard-filter-settled.png          | Footer text reportedly cut off (“Payments stay outside…”). Fix overflow or max-width.                      |
| 15  | **Notification badge alignment**       | dashboard-filter-upcoming.png         | Slightly off-center; fix alignment.                                                                        |

### 2.4 Empty states and copy

| #   | Issue                            | Where                              | Action                                                                                                                                      |
| --- | -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | **Events CTA wording**           | events-list.png                    | Mix of “View event” vs “View odds”; standardize and document when each is used.                                                             |
| 17  | **Games filters placeholder**    | games-timeline.png                 | “Filters tool with the timeline” is placeholder; replace with real filters or proper empty-state copy.                                      |
| 18  | **Groups empty states**          | groups-list.png, groups-detail     | No empty states for “My Groups,” “Discover Public Groups,” or group detail (no bets / no members). Add and reuse pattern from events/games. |
| 19  | **Event not found middle space** | events-detail-not-found.png        | Large empty vertical space before footer; consider centering error block or adding minimal visual.                                          |
| 20  | **Closeout “Still Waiting” row** | closeout-pool-demo-hoops-night.png | Show initials or placeholder for pending players so layout matches Submitted rows.                                                          |
| 21  | **Closeout paid count**          | Closeout (e.g. locked/settled)     | Add explicit “Paid: X/Y” where useful for clarity.                                                                                          |

### 2.5 Typography and title consistency

| #   | Issue                        | Where                                | Action                                                                                     |
| --- | ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| 22  | **Group name serif vs sans** | groups-detail-friday-night-watch.png | “Friday Night Watch” in serif; rest of app sans-serif. Use one title style for group name. |

---

## 3. Design language recommendations

Use the following to finalize a single design system document (e.g. MASTER or
design-system doc).

### 3.1 Tokens and color

- **Primary:** Green (emerald/teal) for primary actions, active nav, and key
  labels. Use one semantic primary token everywhere.
- **Secondary/muted:** Grey for body and secondary labels; ensure sufficient
  contrast (text-muted, not too light). No raw Tailwind neutrals in components.
- **Surfaces:** One card background (e.g. bg-default or bg-elevated), one border
  (border-default). Apply to admin, dashboard, events, games, groups, napkins,
  settings, shell so card surfaces look the same.
- **Status:** Semantic colors for settled (green), submitted (blue), pending
  (yellow), rejected (red). Use consistently in tags and ledger.

### 3.2 Typography

- **Section labels:** All-caps green (e.g. “DASHBOARD,” “EVENTS,” “SETTINGS”) —
  already consistent; keep as standard.
- **Headlines:** One scale for h1/h2/h3 and section titles; bold weight. Same
  across admin, dashboard, events, groups, napkins, settings.
- **Body and captions:** One body size, one muted/caption size. Apply to forms,
  cards, and lists.
- **Group/product names:** Decide: serif for group title only, or all sans.
  Apply consistently.

### 3.3 Buttons and actions

- **Primary CTA:** One size and variant for “Create Napkin,” “Join bet,” “Save,”
  etc. (e.g. full-width pill or fixed height). Use in header and hero the same
  way.
- **Secondary actions:** “Save proof,” “Save pick,” “Cancel,” “Back” — same
  variant and size when they are peers.
- **Nav pills:** One active state (e.g. solid fill + white text) and one
  inactive (outline or muted). Use same pattern for top nav and filter bar.
- **Icon buttons:** Consistent hit area and icon size (e.g. 24×24 with w-6 h-6).
  Same in header, cards, and forms.

### 3.4 Spacing and layout

- **Content width:** Single max-width (e.g. max-w-6xl or max-w-7xl) for main
  content across all areas.
- **Section rhythm:** Consistent vertical gap between sections (e.g. space-y-6
  or space-y-8).
- **Card padding:** One padding scale for cards (e.g. p-6); same for admin,
  dashboard, events, groups, napkins, settings.
- **Forms:** Labels above inputs; full-width inputs unless documented exception.
  Align “Log a pick” and “Submit payment proof” rows (Confidence and Screenshot
  on same line).

### 3.5 Empty and loading states

- **Empty state pattern:** Icon + message + optional CTA. Use for: admin empty
  tabs, no bets, no members, no groups, no payment profiles, no notifications.
- **Loading:** Skeleton or structured loading card (not only “Loading…” text) to
  avoid layout shift. Use for dashboard, ledger, notifications, and any list
  that loads async.
- **Error:** Centered block with message + single CTA (e.g. “Back to events”).
  Sufficient contrast for error text.

### 3.6 Settlement and ledger

- **Ledger row:** Left anchor = payment proof image **or** initials pill (two
  letters). Never an empty white/grey square.
- **Closeout:** ENTRY note format “NB &lt;slug> • entry $X.00” with no duplicate
  “• entry.” Draft summary button and description on same row, vertically
  aligned (flex items-center).
- **Paid count:** Only confirmed settlements in “At a glance” / “Paid.” Settle
  up button hidden when wager is live/upcoming; visible when user can manage.

---

## 4. Next steps

1. **Prioritize must-fix** — Fix baseline hygiene (hide overlays), ledger empty
   cells, Friday Hoops/MLB, draft badge position, and copy/typo. Then empty
   states for admin and dashboard loading.
2. **Adopt design language** — Turn §3 into a short design-system doc (tokens,
   typography, buttons, spacing, empty/loading, ledger rules). Share with team
   and enforce in code review.
3. **Tackle should-fix in batches** — Buttons and active states first, then
   forms and tables, then empty states and copy. Re-run screenshot tests after
   each batch and update baselines.
4. **Re-audit** — After must-fix and key should-fix, re-run the full screenshot
   suite and do a quick visual pass to confirm consistency and no regressions.

---

## 5. Snapshot index (for reference)

| Area             | Count | Key screenshots                                                                                                                          |
| ---------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Admin            | 7     | admin-dashboard, admin-events, admin-users, admin-taxonomy, admin-ai, admin-bets, admin-featured                                         |
| Dashboard        | 7     | dashboard-default, dashboard-filter-\*, home-authenticated                                                                               |
| Events           | 3     | events-list, events-detail-found, events-detail-not-found                                                                                |
| Games            | 1     | games-timeline                                                                                                                           |
| Groups           | 2     | groups-list, groups-detail-friday-night-watch                                                                                            |
| Guest            | 6     | guest-landing, guest-guide, guest-tour, auth-login, auth-register, guest-create-napkin                                                   |
| Napkins detail   | 10    | napkin-detail-pool-demo-hoops-night, napkin-detail-state-\*, napkin-detail-simple-bet, napkin-detail-invitation, napkin-detail-join-pool |
| Napkins closeout | 5     | closeout-pool-demo-hoops-night, closeout-state-settled, -submitted, -rejected, -locked                                                   |
| Settings         | 4     | settings, settings-payments, settings-notifications, napkins-create-authenticated                                                        |
| Shell            | 3     | friends, ledger, notifications                                                                                                           |

**Total:** 48 baseline PNGs across 10 spec directories.

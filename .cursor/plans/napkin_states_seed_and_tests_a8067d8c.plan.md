---
name: Napkin states seed and tests
overview:
  'Add seed data and tests so every wager/napkin state, settlement state, and
  bet-page UI path is covered: seed from prod D1 (export and normalize), proof
  images for all verification statuses, extend seed for all wager statuses and
  settlement/participant variants, unit tests for derived logic, E2E tests for
  bet page UI/flows, and screenshot + visual regression for each bet-management
  page × state.'
todos:
  - id: seed-from-prod
    content:
      Export prod D1 and derive/normalize seed (anonymize, stable IDs,
      proof_image_url → seed/*.png)
    status: pending
  - id: proof-images
    content:
      Ensure every settlement has proof_image_url; add seed image for rejected
      if needed; db:seed uploads all to R2
    status: pending
  - id: seed-complete
    content:
      Seed covers all wager statuses and settlement/participant variants;
      unified demo + layer seed
    status: pending
  - id: unit-tests
    content:
      Fix wager-detail test verificationStatus; add unit tests for new helpers
      if extracted
    status: pending
  - id: e2e-flows
    content:
      E2E for invitation, simple-bet, ledger (submitted/rejected), closeout,
      scoreboard, join/pick/proof forms
    status: pending
  - id: visual-regression
    content:
      Playwright toHaveScreenshot for each (page, state); optional screenshots
      dir; stable viewport
    status: pending
isProject: false
---

# Napkin states, seed data, and test coverage plan

## 1. Wager (napkin) states and related enums

**Wager status**
(`[apps/web/types/napkinbets.ts](apps/web/types/napkinbets.ts)`): `open` |
`locked` | `live` | `settling` | `settled` | `closed` | `archived`

**Derived settlement stage**
(`[apps/web/app/utils/napkinbets-wager-detail.ts](apps/web/app/utils/napkinbets-wager-detail.ts)`):
`upcoming` | `live` | `ready` | `submitted` | `rejected` | `settled` (computed
from wager status + eventState + settlements)

**Event state** (from event cache): `pre` | `in` | `post`

**Settlement verificationStatus**: `submitted` | `confirmed` | `rejected`
(schema default `submitted` in
`[apps/web/server/database/schema.ts](apps/web/server/database/schema.ts)`)

**Participant joinStatus**: `invited` | `pending` | `accepted` (UI treats
`invited` and `pending` as “invited” for invitation banner;
`[workspace.get.ts](apps/web/server/api/napkinbets/workspace.get.ts)` uses both)

**Participant paymentStatus**: `pending` | `submitted` | `confirmed`

**Pick outcome**: `pending` | `winning` | `won` | `lost` | `push`

**Napkin type**: `pool` | `simple-bet` (pool = multi-participant; simple-bet =
1v1, different UI)

---

## 2. Use cases to cover (checklist for “am I missing anything?”)

### 2.1 Wager status (7)

| Status   | Meaning / when shown              | Seed today                                        | Unit test          | E2E                 |
| -------- | --------------------------------- | ------------------------------------------------- | ------------------ | ------------------- |
| open     | Accepting joins, before event     | Yes (demo-golf-draft; others when event not “in”) | —                  | Yes (napkin detail) |
| locked   | Joins closed, game not started    | No                                                | —                  | No                  |
| live     | Game in progress                  | Yes (when event state “in”)                       | Yes (wager-detail) | No                  |
| settling | Event finished, awaiting payments | No                                                | Yes (wager-detail) | No                  |
| settled  | All settled                       | No                                                | Yes (wager-detail) | No                  |
| closed   | Manually closed                   | No                                                | —                  | No                  |
| archived | Archived                          | No                                                | —                  | No                  |

### 2.2 Event state × wager (3 × relevant statuses)

- **pre** + open/locked: “upcoming” settlement stage, no settle yet.
- **in** + live: “live” stage, scoreboard active.
- **post** + settling/settled: “ready” / “submitted” / “settled” stages.

Seed currently only derives status from event (open vs live). No explicit
locked, settling, settled, closed, archived.

### 2.3 Settlement verificationStatus (3)

| Status    | Seed today | E2E (card ledger + closeout page) |
| --------- | ---------- | --------------------------------- |
| submitted | No         | No (host confirm/reject buttons)  |
| confirmed | Yes        | Yes (badge “confirmed”)           |
| rejected  | No         | No (rejected note + “Send back”)  |

### 2.4 Participant joinStatus (3)

| Status   | Seed today                        | E2E                                                     |
| -------- | --------------------------------- | ------------------------------------------------------- |
| invited  | No (seed uses “pending” for some) | No (invitation banner + Accept/Decline)                 |
| pending  | Yes                               | Yes (e.g. “Saoirse is still pending”)                   |
| accepted | Yes                               | Yes (pool: leaderboard, picks; simple-bet: “You’re in”) |

### 2.5 Participant paymentStatus (3)

| Status    | Seed today | E2E (closeout “Still waiting” vs “Ready to confirm”) |
| --------- | ---------- | ---------------------------------------------------- |
| pending   | Yes        | Yes (closeout “Players to follow up”)                |
| submitted | No         | No (settlement submitted, not yet confirmed)         |
| confirmed | Yes        | Yes                                                  |

### 2.6 Pick outcome (5)

| Outcome | Seed today | Unit (scoring) | E2E (card “Picks” list) |
| ------- | ---------- | -------------- | ----------------------- |
| pending | Yes        | Yes            | Yes                     |
| winning | Yes        | —              | Yes                     |
| won     | —          | Yes            | No                      |
| lost    | —          | Yes            | No                      |
| push    | —          | —              | No                      |

### 2.7 Napkin type (2)

| Type       | Seed today        | E2E                                                                       |
| ---------- | ----------------- | ------------------------------------------------------------------------- |
| pool       | Yes (all 3 demos) | Yes (hero, draft order, leaderboard, Log pick, Submit proof)              |
| simple-bet | No                | No (invitation banner, Accept/Decline, “You’re in”, no draft/leaderboard) |

### 2.8 Settlement stage (6) — derived

| Stage     | Driven by                     | Unit test | E2E (next-step card + actions) |
| --------- | ----------------------------- | --------- | ------------------------------ |
| upcoming  | pre, no post                  | Yes       | No                             |
| live      | event in / live               | Yes       | No                             |
| ready     | post, no submission           | Yes       | No                             |
| submitted | settlement submitted          | Yes       | No                             |
| rejected  | settlement rejected           | Yes       | No (no seed)                   |
| settled   | wager settled/closed/archived | Yes       | No                             |

### 2.9 Other states

- **Wager legs** (outcomeStatus): `pending` | `settled` | `voided` — seed uses
  default; no dedicated seed or E2E.
- **Recipient acknowledged**: settlement.recipientAcknowledged — no seed true;
  E2E could cover “Acknowledge receipt” / “Recipient received” badge.
- **Notification deliveryStatus**: e.g. `queued` — seed has it; E2E already sees
  “Saoirse is still pending”.

---

## 3. Bet pages and UI elements to cover with E2E

**Pages:**

- **Napkin detail**:
  `[apps/web/app/pages/napkins/[slug]/index.vue](apps/web/app/pages/napkins/[slug]/index.vue)`
  (canonical); `wagers/[slug]` redirects here.
- **Closeout**:
  `[apps/web/app/pages/napkins/[slug]/closeout.vue](apps/web/app/pages/napkins/[slug]/closeout.vue)`
  (host only); `wagers/[slug]/closeout` redirects here.
- **Create**:
  `[apps/web/app/pages/napkins/create.vue](apps/web/app/pages/napkins/create.vue)`;
  `wagers/create` redirects.

**Detail page (index) — top-level:**

- Feedback alert (success/error after action).
- Error alert (wager failed to load).
- **Invitation path** (invited/pending participant): invitation UCard with
  stake, payment, event, “Accept bet” / “Decline”.
- **Pool path** (napkinType !== simple-bet): hero with status/format/league
  badges, title, description, event/group/payment/venue pills, “Settle up” (if
  canManage), “At a glance” card (players, payouts, paid).

**NapkinbetsNapkinCard (main card):**

- Header: status badge, format, league, title, description, event link, group,
  venue, host. Manage: “Reroll order”, “Queue reminder”, “Clear”.
- Summary: Stake, Total payout, At a glance (players + reminders).
- Payout breakdown: pot chips (label + amount).
- Draft order / Players: participant rows with draft #, avatar, name, sideLabel;
  badge by paymentStatus (pending/submitted/confirmed) or joinStatus for
  simple-bet (Accepted/Waiting).
- Leaderboard (pool only): rows with displayName, sideLabel, pick count, score,
  projected payout.
- Picks: rows with pickLabel, pickType/pickValue, liveScore, outcome.
- Activity (pool only): notifications with title, body, deliveryStatus.
- **Auth + state-dependent forms:**
  - Invited: “You’ve been challenged” alert, “Accept bet” / “Decline”.
  - Accepted: “You’re in this bet” alert; pool: “Log a pick” form (participant,
    pick label, detail, confidence, “Save pick”), “Submit payment proof” form
    (participant, amount, confirmation code, proof image, note, “Save proof”).
  - Not participant, pool: side chips + “Join the bet” form (name, side, “Join
    bet”).
  - Not authenticated: “Sign in to join, pick, or settle” + Sign in / Create
    account.
- **Next step card**: title, badge, steps 1–3, description/emphasis,
  primary/secondary labels/values/hints, payment links (when
  showPaymentActions), “Copy payment details”, “Open closeout” (when
  showCloseoutShortcut).
- **Game context**: NapkinbetsWagerScoreboard (if wager.eventId):
  NapkinbetsBoxScore (state, status, start time, venue, weather, teams, scores),
  pick distribution bar, “View event details”; optional “Other Live Games”.
- **Settlement ledger**: per-settlement row (proof thumb, participant,
  method/confirmation, rejection note, verificationStatus badge, “Recipient
  received”, amount); host: “Confirm host” / “Send back”; recipient (other):
  “Acknowledge receipt”. Lightbox for proof image.
- Compliance rail (terms).
- **Lightbox**: proof image, close.

**NapkinbetsWagerScoreboard (child):**

- NapkinbetsBoxScore: pre/in/post state, status, start time, venue, weather,
  home/away names, logos, scores.
- Pick distribution (home % vs away %) when applicable.
- “View event details” link.
- When finished: winner alert (single winner) / tie alert / “Event Completed!”
  (no leaderboard).

**Closeout page:**

- Hero: title, copy, “Back to bet”.
- Pay-with card: payment service, handle, entry, payment note, payment link
  buttons.
- Host checklist (steps 1–2–3).
- AI draft: “Draft summary” button, error alert, summary text or placeholder.
- “Ready to confirm”: list of settlements with proof thumb, participant, amount,
  method, verificationStatus badge, “Recipient received”; note/code; if
  submitted: “Confirm”, rejection note input, “Send back”.
- “Players to follow up with”: pending participants list with “Pending” badge.

**Legacy routes:**

- E2E already: `/wagers/:slug` → `/napkins/:slug`, `/wagers/:slug/closeout` →
  `/napkins/:slug/closeout`.

---

## 4. Current coverage gaps (summary)

**Seed
(`[apps/web/server/services/napkinbets/seed.ts](apps/web/server/services/napkinbets/seed.ts)`):**

- Only **open** and **live** (when event in); no **locked**, **settling**,
  **settled**, **closed**, **archived**.
- Only **confirmed** settlements; no **submitted** or **rejected**.
- Only **pending** and **confirmed** payment status; no **submitted**.
- **joinStatus**: uses “pending” and “accepted”; no explicit **invited** (UI
  treats invited/pending same for banner).
- All demos are **pool**; no **simple-bet** napkin.
- No picks with outcome **won** / **lost** / **push** (only pending/winning).
- No settlement with **recipientAcknowledged** true.
- No **eventState** explicitly set on wager (comes from event or empty); seed
  doesn’t create wagers with event_state post for settling/settled.

**Unit tests:**

- `[napkinbets-wager-detail.test.ts](apps/web/tests/unit/napkinbets-wager-detail.test.ts)`:
  covers upcoming, live, ready, submitted, rejected, settled. One test uses
  `verificationStatus: 'pending'` for settlement; schema/API use **submitted** —
  align test with submitted.
- `[napkinbets-scoring.test.ts](apps/web/tests/unit/napkinbets-scoring.test.ts)`:
  pick outcomes and scoring covered.
- `[napkinbets-events.test.ts](apps/web/tests/unit/napkinbets-events.test.ts)`:
  event state/pre/in/post.
- No unit tests for status badge colors or next-step card copy by state (could
  add if logic is extracted).

**E2E
(`[apps/web/tests/e2e/page-coverage.spec.ts](apps/web/tests/e2e/page-coverage.spec.ts)`):**

- Covers: napkin detail and closeout render for demo user on one slug; “Payout
  breakdown”, “Host checklist”; legacy wager redirects.
- Missing E2E for:
  - **Invitation flow**: wager where current user is invited/pending — see
    invitation banner, Accept/Decline (and optionally execute accept/decline).
  - **simple-bet** napkin: no hero, “You’re in” / invitation UI, no draft
    order/leaderboard.
  - **Settlement ledger**: submitted (Confirm/Send back), rejected (rejection
    note, resubmit path), recipient “Acknowledge receipt”, proof lightbox.
  - **Closeout**: submitted settlements (Confirm / Send back), pending list, AI
    draft summary button.
  - **Scoreboard**: event pre vs in vs post (box score, pick distribution,
    winner/tie/event completed alerts).
  - **Next-step card**: different copy for upcoming / live / ready / submitted /
    rejected / settled (requires wagers in those states).
  - **Join flow** (pool, not participant): join form, side options, “Join bet”.
  - **Log a pick** and **Submit payment proof** forms (visibility and submit)
    for accepted participant.
  - **Manage actions**: Reroll order, Queue reminder, Clear (at least
    visibility; optional execution).

---

## 5. Implementation plan (high level)

1. **Seed**

- Add one wager per **wager status** (or a minimal set: e.g. open, locked, live,
  settling, settled, closed, archived) with eventState consistent with status
  where needed (e.g. settling/settled → post).
- Add seed wagers with **submitted** and **rejected** settlements; optionally
  **recipientAcknowledged** true for one.
- Add at least one **simple-bet** napkin (e.g. one invited participant for demo
  user to see invitation UI, or two accepted).
- Ensure at least one participant has **paymentStatus** **submitted**
  (settlement submitted, not confirmed).
- Optionally add **invited** joinStatus for one participant on one wager (or
  keep “pending” and treat as same for invitation banner).
- Optionally add picks with **won** / **lost** / **push** for a settling/settled
  wager so leaderboard and scoreboard winner/tie UI are visible.

1. **Unit tests**

- Fix or clarify settlement **verificationStatus** in
  `napkinbets-wager-detail.test.ts`: use `submitted` where “pending” is intended
  (or document that “pending” is legacy).
- Add unit tests for any new helpers (e.g. status badge color, next-step label)
  if extracted.

1. **E2E**

- **Napkin detail**: add specs (or expand existing) for:
  - Invitation view (invited/pending): banner, Accept, Decline.
  - simple-bet: no pool hero, no draft/leaderboard, invitation or “You’re in” +
    compliance.
  - Settlement ledger: at least one settlement submitted (Confirm/Send back
    visible), one rejected (rejection note visible); optional: Acknowledge
    receipt, proof image open.
  - Next-step / payment actions: “Open closeout”, “Copy payment details”,
    payment links when in ready/submitted.
  - Scoreboard: for a wager with eventId and finished event: winner or tie or
    “Event Completed!” alert; pick distribution when picks align to home/away.
  - Pool join form (guest or non-participant): side options, Join form visible
    (and optionally submit).
  - Accepted participant: “Log a pick” and “Submit payment proof” sections
    visible; optionally submit pick.
  - Manage: “Settle up”, “Reroll order”, “Queue reminder”, “Clear” visible for
    owner.
- **Closeout**: add specs for:
  - “Ready to confirm” list with submitted settlement: Confirm, rejection input,
    Send back.
  - “Players to follow up with” (pending participants).
  - “Draft summary” button and placeholder/error/success.
- Use **seeded slugs** for each state (e.g. demo-wager-open,
  demo-wager-settling, demo-simple-bet) so E2E can navigate deterministically;
  ensure seed runs before E2E (or document that demo user + seed must be
  present).

---

## 6. Optional / follow-up

- **Leg outcomeStatus** (pending/settled/voided): seed or E2E only if legs are
  prominent on bet page.
- **Admin**: changing wager status via admin API (e2e or manual) to cycle states
  without more seed rows.
- **E2E for auth redirects**: closeout redirect to detail when not canManage
  (already guarded in page).
- **Performance**: keep seed minimal (e.g. one wager per status, or 2–3 combined
  states per wager) to avoid slow E2E.

---

## 7. Seed from production D1 (get data correct first)

**Goal:** Seed is complete and accurate; use production D1 as source, then
normalize into reproducible seed.

- **Export prod:**
  `pnpm exec wrangler d1 export napkinbets-db --remote --output=prod-export.sql`
  (from `apps/web`; needs Cloudflare creds). Store output in a
  one-off/gitignored path (e.g. `apps/web/tools/prod-export.sql`).
- **Derive seed:** Script or manual pass that (1) reads prod export, (2)
  anonymizes PII, (3) normalizes IDs to stable seed IDs (e.g. `seed-bet-0001`),
  (4) maps every settlement `proof_image_url` to a seed key (`seed/venmo-1.png`,
  `seed/venmo-2.png`, `seed/venmo-rejected.png`) so **every** settlement has an
  image.
- **Unify seed:** Single way to run full seed (layer SQL + app ensureSeedData if
  needed); one test/demo user can access at least one wager per state for E2E.

---

## 8. Proof images for every verification status

**Goal:** Every settlement in seed that represents verification has a proof
image so the UI shows thumbnails and lightbox, not missing-image state.

- Ensure **submitted**, **confirmed**, and **rejected** settlements in seed all
  have non-null `proof_image_url` (e.g. `seed/venmo-1.png`, `seed/venmo-2.png`,
  `seed/venmo-rejected.png`).
- Add a third seed image if needed (e.g. `venmo-rejected.png` in layer or app
  `drizzle/seed/`) and extend `db:seed` in `apps/web/package.json` to upload it
  to R2:
  `wrangler r2 object put napkinbets-uploads/seed/venmo-rejected.png --local --file=...`.
- Proof-image API already supports `seed/`\* and redirects to placeholder when
  R2 object is missing; ensure local E2E has objects in R2 after `db:seed`.

---

## 9. Screenshots and visual regression

**Goal:** For every bet-management page and each relevant state, capture a
screenshot and run visual regression.

**Pages:** Napkin detail (`/napkins/[slug]`), Closeout
(`/napkins/[slug]/closeout`).

**State matrix (example; slugs from final seed):**

- Napkin detail: open (pool), open (simple-bet invited), locked (pregame), live,
  settling (submitted), settling (rejected), settled (all confirmed), pool with
  draft/picks.
- Closeout: submitted + pending list, confirmed + rejected, all confirmed.

**Implementation:**

- **Playwright:** One E2E spec (e.g.
  `apps/web/tests/e2e/visual-bet-pages.spec.ts`) that for each (page, state,
  user, slug): logs in, navigates, waits for hydration/content, then
  `expect(page).toHaveScreenshot(\`napkin-detail-${slug}-${state}.png)`(or closeout variant). Baselines live in e.g.`tests/e2e/playwright-snapshots/`
  (or config default).
- **Optional:** Always write screenshots to `tests/e2e/screenshots/` via
  `page.screenshot({ path: '...' })` for human review.
- **Config:** Stable viewport (e.g. Desktop Chrome 1280×720) in
  `playwright.config.ts`; set `expect.toHaveScreenshot` options (e.g.
  `maxDiffPixels`, `threshold`) and snapshot path. Use `--update-snapshots` only
  when intentionally changing UI.

**Order:** Implement visual regression **after** seed/data is correct (section 7
and 8), so screenshots are stable and comparable.

---

## 10. Implementation order (once data is correct)

1. **Seed from prod** — Export prod D1, derive normalized seed (all wager
   statuses, all settlement verification statuses, proof_image_url for every
   settlement).
2. **Proof images** — Add/reuse seed images; ensure submitted/confirmed/rejected
   all have images; update `db:seed` to upload all to R2 (local).
3. **Unify seed and demo user** — Single “full seed” run; demo or test user can
   access one wager per state; document slugs for E2E.
4. **Unit tests** — Fix `napkinbets-wager-detail.test.ts` verificationStatus;
   add unit tests for extracted helpers if any.
5. **E2E flows** — Invitation, simple-bet, settlement ledger
   (submitted/rejected), closeout, scoreboard, join/pick/proof forms, manage
   actions (section 5).
6. **Visual regression** — Add `visual-bet-pages.spec.ts` with state matrix,
   login helpers, `toHaveScreenshot`; optional screenshots dir; update
   Playwright config.

---

If you want to trim scope: prioritize seed for **wager statuses** (locked,
settling, settled, closed, archived), **settlement submitted/rejected**,
**simple-bet** napkin, and **one closeout E2E** (submitted settlement + pending
list) plus **one invitation E2E** (invited user sees Accept/Decline). Then add
proof images, prod-derived seed, and visual regression in a second pass.

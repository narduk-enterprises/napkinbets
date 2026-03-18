# Extended Seed Plan: Comprehensive Bets, Payments, Users, Groups, Leagues & Golf

## 1. Current State Summary

### What the seed already covers

- **Users**: One demo user (`demo@napkinbets.app`), plus layer users
  (`pat@nard.uk`, `logan@nard.uk`) for join/invitation E2E.
- **Social**: `ensureDemoSocialGraph` creates Pat, Olivia, Marcus, Mara, Nora,
  Leo; two groups (Friday Night Watch, Augusta Text Chain); friendships.
- **Wager formats**: `sports-game` (hoops), `sports-prop` (soccer), `golf-draft`
  (one pool), `simple-bet` (1v1).
- **Sports/leagues**: basketball/NBA, soccer/MLS, golf/PGA in demo pools;
  taxonomy has basketball, football, baseball, hockey, golf, soccer,
  motorsports, combat, tennis, track-field, entertainment, other and leagues
  (NBA, WNBA, NCAAMB, NFL, MLB, NHL, PGA, LPGA, MLS, etc.).
- **Payment**: Venmo, PayPal, Cash App in pool definitions; participant
  `paymentStatus`: pending, confirmed, submitted; settlements with
  `verificationStatus`: submitted, confirmed, rejected.
- **Wager states**: open, locked, live, settling, settled (via
  `buildDemoStatePools()`).
- **Picks**: `pickType` team, prop, custom, golfer; outcomes pending, winning,
  won, lost.
- **Groups**: One group (Friday Night Watch) linked to three pools; Augusta Text
  Chain (golf-focused) exists but no pools linked in seed.

### Gaps for “comprehensive and intensive coverage”

- **Bet types / formats**: No seed for `sports-race`, spread/over-under style
  props, multi-leg (wager legs) parlays, or `most-correct` / `parlay` /
  `closest` scoring.
- **Payments**: No seed for Zelle; no `napkinbets_user_payment_profiles` rows;
  no recipient-acknowledged settlements; limited settlement state combos (e.g.
  mix of submitted + rejected in same wager).
- **Users**: Only one demo user is a wager participant; social users (Pat,
  Olivia, etc.) don’t own or participate in seeded wagers except join/invitation
  flows.
- **Groups**: Only one group has pools; no multi-group membership; no “many
  users, many groups” matrix.
- **League types**: Only NBA, MLS, PGA in pools; no WNBA, NCAAMB, NFL, MLB, NHL,
  LPGA, EPL, UFC, etc. in seed.
- **Golf**: One `golf-draft` pool with manual event; no LPGA, no
  tournament-backed golf event, no link to `napkinbets_events`/players, no
  leaderboard-style scoring or “low round” / “closest to pin” as explicit legs.

---

## 2. How Golf Works (and How to Seed It)

### How golf is modeled today

- **Sport/league**: `sport: 'golf'`, `league: 'pga'` or `'lpga'`; taxonomy has
  PGA and LPGA with `eventShape: 'tournament'`.
- **Format**: `golf-draft` — pool where participants pick golfers (or sides like
  “lowest round”, “closest-to-pin”); no head-to-head team.
- **Events**: Golf is tournament-shaped. ESPN golf scoreboard: `espn-golf.ts`
  uses `site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard`; events have
  `competitions[].competitors[]` (golfers). `napkinbets_events` can store a
  tournament as one event; `napkinbets_players` stores golfers (synced from ESPN
  in `syncEspnPgaPlayers`).
- **Picks**: `pickType: 'golfer'`, `pickValue` = golfer name (e.g. "Scottie
  Scheffler", "Viktor Hovland"). No `wagerLegId` in current golf seed — picks
  are “pick a golfer” for the pool.
- **Scoring**: Golf pools typically use “best finish” or “low round” or “made
  cut”. Current seed uses `liveScore` on picks and
  `scoringRule: 'proportional'`. For true “golf draft” the app can use
  leaderboard position (e.g. from ESPN) to compute scores; `scoringRule` could
  stay `proportional` or use a custom config in `scoringConfigJson` for “lowest
  total strokes” or “best finish wins”.

### How to seed golf properly

1. **Option A – Manual golf (no live ingest)**  
   Keep current approach: `eventSource: 'manual'`, `eventTitle` e.g. “Masters
   Weekend Draft”, `sport: 'golf'`, `league: 'pga'`. Picks are golfer names as
   strings. No `eventId`; no link to `napkinbets_events` or
   `napkinbets_players`. Good for E2E and demos.

2. **Option B – Tournament-backed golf (recommended for “full” seed)**
   - Ensure taxonomy/DB has golf leagues (PGA, LPGA).
   - Either seed a minimal `napkinbets_events` row for a golf tournament
     (sport=golf, league=pga/lpga, no home/away teams), or run ESPN golf
     scoreboard ingest once and use a real tournament id.
   - Seed `napkinbets_players` for a few golfers (or rely on
     `syncEspnPgaPlayers` in dev).
   - Create one or more golf-draft wagers with `eventId` pointing at that
     tournament event, and picks that reference golfer display names (or player
     ids if the app supports it).
   - Pots: “Winner”, “Low round”, “Closest to pin” etc.
   - Covers: PGA, LPGA, open/locked/settled states, multiple participants,
     payment confirmed/pending.

3. **Golf-specific seed matrix**
   - **PGA** – at least one pool: open, one locked, one settling/settled.
   - **LPGA** – at least one pool (shows league filter / league-specific UI).
   - **Side pots**: “Draft winner”, “Low round”, “Closest to pin”, “Birdie
     streak” (labels only; actual resolution remains manual unless we add legs).
   - **Participants**: Mix demo user + social users (e.g. Mara, Leo from Augusta
     Text Chain) so “multi-user” and “golf group” are both covered.

4. **“How in the heck do we do golf?”**
   - **Structurally**: Same as other pools — wager (format=golf-draft),
     participants, pots, picks (pickType=golfer, pickValue=name).
   - **Events**: Either manual (no eventId) or one tournament event per league
     (PGA/LPGA) with `eventId` set.
   - **Scoring**: Keep proportional or add a `scoringConfigJson` later for “best
     finish” / “low round”; seed doesn’t need to implement real leaderboard math
     — just plausible `liveScore` and outcomes (pending/won/lost) for UI
     coverage.

---

## 3. Extended Seed Design

### 3.1 Principles

- **Backward compatible**: Existing demo slugs and E2E slugs stay; new slugs are
  additive (or behind a “full seed” mode).
- **Matrix over duplication**: Define small building blocks (users, groups,
  payment methods, status sets) then generate wagers that systematically cover
  format × status × payment × league.
- **Single source of truth**: Shared constants for demo users, groups, payment
  providers, formats, leagues; seed code references these.
- **Golf as first-class**: Dedicated subsection for golf (PGA + LPGA, multiple
  states, multi-user, optional event-backed).

### 3.2 User & Social Expansion

- **Demo users (existing)**: `demo@napkinbets.app` (Demo Host).
- **Social users (existing)**: Pat, Olivia, Marcus, Mara, Nora, Leo (from
  `DEMO_SOCIAL_USERS` in social.ts).
- **Extended users (new, optional)**:
  - Add 2–3 more named users (e.g. Jonah, Ava) so we can assign “owner” and
    “participants” across wagers without reusing the same two accounts
    everywhere.
- **Groups**:
  - Friday Night Watch (existing): keep 3 pools (hoops, soccer, golf).
  - Augusta Text Chain (existing): attach **golf-only** pools (PGA + LPGA) so
    “golf group” has multiple pools.
  - Optional: one more group (e.g. “NFL Sunday”) with 1–2 football pools for
    league diversity.
- **Multi-user coverage**:
  - At least one wager owned by Pat (or another social user) with demo user as
    participant.
  - At least one wager owned by demo user with 2+ social users as participants.
  - At least one pool where 3+ distinct users (demo + social) are participants
    with different join/payment states.

### 3.3 Payment & Settlement Coverage

- **Payment providers**: Seed at least one wager (or participant) per provider:
  **Venmo, PayPal, Cash App, Zelle** (all four from
  `SUPPORTED_PAYMENT_PROVIDERS`).
- **Participant payment status**: For each of **pending**, **submitted**,
  **confirmed** have at least one participant in some wager.
- **Settlements**:
  - **submitted**: at least one settlement not yet confirmed.
  - **confirmed**: at least one settlement confirmed (and optionally
    recipient-acknowledged).
  - **rejected**: at least one settlement rejected (with `rejectedByUserId`,
    `rejectionNote`).
  - Optionally: one wager with both a confirmed and a rejected settlement (e.g.
    two participants, one paid, one “wrong amount” rejected).
- **Payment profiles**: Seed `napkinbets_user_payment_profiles` for demo user
  and 1–2 social users (Venmo, Cash App) so “my payment methods” and “settle
  with @handle” flows have data.

### 3.4 Bet Types & Formats

- **Formats to cover** (from taxonomy/espn/systemPrompts):  
  `sports-game`, `sports-prop`, `golf-draft`, `simple-bet`, and optionally
  `sports-race` (e.g. motorsports).
- **Categories**: basketball, soccer, golf, football, baseball, hockey,
  entertainment, custom.
- **League matrix** (at least one wager per league we care about):  
  NBA, WNBA, NCAAMB, NFL, MLB, NHL, **PGA**, **LPGA**, MLS, EPL, UFC (manual),
  etc. Not every combo needed; aim for 1–2 per sport and both golf leagues.
- **Napkin types**: **pool** (multiple participants, draft order, pots) and
  **simple-bet** (1v1, no draft).
- **Wager legs** (multi-leg / parlay):  
  Seed at least one wager that has `napkinbets_wager_legs` rows (categorical or
  numeric) and picks with `wagerLegId` set; outcome_status settled on legs so
  scoring can run. This covers “parlay” and “most-correct” style UIs.
- **Scoring rules**: At least one wager each with `scoringRule`:
  **proportional**, **most-correct**, **parlay** (if used), and optionally
  **closest** / **price-is-right** if the UI supports them.

### 3.5 Wager Status & Lifecycle

- **Status**: open, locked, live, settling, settled, closed, archived.  
  Seed at least one wager per status (or per status we use in E2E).
- **Event state**: pre, in, post.  
  Align with status where relevant (e.g. locked=pre, live=in,
  settling/settled=post).
- **Event-backed vs manual**: Mix of `eventSource: 'espn'` + `eventId` and
  `eventSource: 'manual'` so both paths are seeded.

### 3.6 Notifications

- **Kinds**: acceptance, reminder, results, payment_follow_up (or whatever the
  app uses).  
  Seed at least one notification per kind, tied to a participant in a seeded
  wager.

---

## 4. Golf-Specific Seed Checklist

- [ ] **PGA**
  - [ ] One `golf-draft` pool, open, manual event (e.g. “PGA Weekend Draft”).
  - [ ] One `golf-draft` pool, locked or settling, with picks (golfer names) and
        mixed payment statuses.
  - [ ] Optional: one PGA pool with `eventId` if we seed a golf tournament
        event + players.
- [ ] **LPGA**
  - [ ] One `golf-draft` pool (e.g. “LPGA Major Side Pot”), so league filter
        shows LPGA.
- [ ] **Groups**
  - [ ] Attach PGA/LPGA pools to **Augusta Text Chain** (golf group).
- [ ] **Participants**
  - [ ] Demo user + Mara, Leo (and optionally Ava) so Augusta members appear in
        golf pools.
- [ ] **Pots**
  - [ ] “Draft winner”, “Low round”, “Closest to pin” (and optionally “Birdie
        streak”) on at least one golf pool.
- [ ] **Picks**
  - [ ] Several picks with `pickType: 'golfer'`, `pickValue: '<Golfer Name>'`,
        outcomes pending/won/lost and plausible `liveScore`.
- [ ] **Settlements**
  - [ ] At least one golf pool with 1–2 settlements (e.g. entry fee confirmed
        for host).

---

## 5. Implementation Approach

### 5.1 Structure

- **Constants**: Centralize in `seed.ts` (or a small `seed-constants.ts`):
  - Demo slugs (existing + new), group slugs, list of formats, leagues, payment
    providers, statuses.
  - Optional: “full seed” vs “smoke seed” flag (e.g. env or param) to decide
    whether to create the full matrix.
- **Builders** (keep or extend):
  - `buildDemoPools(events)` – keep for dynamic hoops/soccer + static
    golf-draft.
  - `buildDemoStatePools()` – keep for E2E state coverage.
  - **New**: `buildExtendedSportLeaguePools()` – generates one pool per (format,
    league, status) for a defined subset (e.g. NFL, MLB, NHL, PGA, LPGA, WNBA).
  - **New**: `buildGolfSeedPools()` – PGA/LPGA pools with participants from
    Augusta group, payments, settlements, picks.
- **Social**: Ensure `ensureDemoSocialGraph` creates all users and groups we
  need; optionally add payment profiles there or in seed after users exist.
- **Idempotency**: Prefer “ensure” pattern: if slug exists and matches expected
  title/version, skip; else clear and re-seed that slug (or only add missing
  slugs).

### 5.2 Order of Operations

1. Ensure taxonomy (sports, contexts, leagues) – already done elsewhere.
2. Ensure demo user + social users + groups + friendships.
3. (Optional) Ensure payment profiles for demo + 1–2 users.
4. (Optional) Seed one golf tournament event + a few golfers if we want
   event-backed golf.
5. Build and insert wagers: existing demo pools → state pools → join/invitation
   → **extended sport/league pools** → **golf seed pools**.
6. Link wagers to groups (Friday Night Watch, Augusta Text Chain).
7. Seed notifications for seeded wagers.

### 5.3 Files to Touch

- `apps/web/server/services/napkinbets/seed.ts`: main changes; add constants,
  `buildGolfSeedPools()`, `buildExtendedSportLeaguePools()` (or equivalent), and
  optional payment-profile seeding.
- `apps/web/server/services/napkinbets/social.ts`: possibly extend
  `DEMO_SOCIAL_USERS` or group definitions if we add users/groups; or keep and
  only reference from seed.
- No schema changes required unless we add new enums or columns for “golf
  tournament” or “leaderboard” later.

### 5.4 Testing

- E2E: Keep using existing demo slugs for join, invitation, state coverage
  (settled, submitted, rejected, locked, live, simple-bet).
- New slugs: Add E2E or visual regression for “golf pool list”, “LPGA pool”,
  “multi-user pool”, “payment profile on profile page” if we add those flows.
- Smoke: Run `ensureSeedData` with “smoke” mode (current behavior) and with
  “full” mode and assert wager count, group assignments, and at least one
  settlement per verification status.

---

## 6. Summary

- **Golf**: Model as `golf-draft` pools with `sport: golf`, `league: pga` or
  `lpga`; picks with `pickType: 'golfer'`. Seed manual events and optionally one
  tournament-backed event; attach golf pools to Augusta Text Chain and use
  Mara/Leo (and demo) as participants.
- **Extended seed**: Add users/groups as needed, payment profiles and full
  settlement state matrix, all payment providers, multiple leagues and formats,
  wager legs for parlay/most-correct, and a dedicated golf seed block (PGA +
  LPGA, multiple statuses, pots, settlements).
- **Implementation**: Centralize constants, add `buildGolfSeedPools()` and
  optional `buildExtendedSportLeaguePools()`, keep idempotent ensure logic, and
  optionally gate “full” seed behind a flag so local and CI can stay fast with
  current “smoke” seed.

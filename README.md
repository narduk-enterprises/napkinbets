# Napkinbets

**Napkinbets** is a social sports wagering app for the kinds of bets that normally start in a group chat, at a watch party, or on the back of a napkin. It helps a host create a bet around a real game, invite friends, lock in sides, track picks and outcomes, and record manual settlement proof after the result is official.

> **Important:** Napkinbets is for friendly wagers only. It deliberately avoids direct payment processing — all settlement happens off-platform through Venmo, PayPal, Cash App, Zelle, or however you and your friends actually pay each other.

## Live Site

[https://napkinbets.nard.uk](https://napkinbets.nard.uk)

---

## How It Works

### 1. Start from a real game

Browse live and upcoming events powered by ESPN scoreboards. Pick a game — NBA, NFL, MLB, NHL, college sports, soccer, golf — and spin up a bet directly from the event card. Or skip the event and create a fully custom bet.

### 2. Invite and lock in

For a **one-on-one bet**, invite a friend by name. Once both sides accept, the napkin automatically locks. For a **pool bet**, add as many participants as you want, shuffle the draft order, and let everyone choose their side.

### 3. Track the action

Each napkin shows live context: the game score, the venue weather, picks, leaderboard standings, and payout projections — all in one card. Every time someone joins, picks, or settles, an in-app notification is queued.

### 4. Settle up manually

When the game goes final, participants record payment proof (method, amount, confirmation code). The host reviews and confirms or rejects each submission. The napkin tracks who paid and who still owes, but never moves money directly.

---

## Features

| Feature | Description |
|---|---|
| **Event Discovery** | Browse live, starting-soon, and upcoming games across 10+ sports and leagues, powered by ESPN |
| **One-on-One Bets** | Quick head-to-head wagers that auto-lock when both players accept |
| **Pool / Group Bets** | Multi-participant boards with draft order, leaderboards, and payout splits |
| **Live Context** | Real-time scores, venue weather, and Polymarket odds shown alongside each bet |
| **Manual Settlement** | Record Venmo/PayPal/Cash App/Zelle confirmations — no money moves through the app |
| **Payment Profiles** | Save your preferred payment methods for quick settlement |
| **Friends & Groups** | Social graph with friend requests, groups, and invite-by-name |
| **Notifications** | In-app reminders for invitations, acceptances, picks, and settlement follow-ups |
| **Featured Bets** | Admin-curated spotlight cards on the discover page |
| **AI Assist** | Optional AI-powered terms rewriting and closeout summaries (via xAI) |
| **Admin Panel** | User management, wager status control, event ingest management, AI toggles |

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Home — featured games, spotlight cards, quick access to open bets |
| `/events` | Event discovery — browse by sport, league, and state with live scores |
| `/events/[id]` | Event detail — full game card with odds, leaders, and "Start a bet" action |
| `/napkins/create` | Create a new napkin — step-based flow for one-on-one or pool bets |
| `/napkins/[slug]` | Napkin detail — full bet card with participants, picks, settlements, context |
| `/napkins/[slug]/closeout` | Closeout view — settlement summary and AI-assisted recap |
| `/dashboard` | My bets — filter by upcoming, live, finished, settled, unsettled |
| `/discover` | Discovery hub — spotlights, prop ideas, and event sections |
| `/friends` | Friends — search users, send/accept requests, manage connections |
| `/groups` | Groups — create or join groups, manage memberships |
| `/notifications` | Notification center — all in-app alerts and reminders |
| `/settings` | Profile — name, avatar |
| `/settings/payments` | Payment profiles — manage Venmo, PayPal, Cash App, Zelle handles |
| `/tour` | Product walkthrough for new visitors |
| `/guide` | Getting-started guide |
| `/admin` | Admin panel — users, wagers, ingest, AI settings, featured bets |

---

## Napkin Lifecycle

The full state machine for wagers, participants, picks, and settlements is documented in **[docs/napkin-lifecycle.md](docs/napkin-lifecycle.md)**.

### Wager Status Flow (Summary)

```
open → locked → live → settling → settled → closed → archived
```

| Status | Meaning |
|---|---|
| `open` | Accepting participants |
| `locked` | All seats filled (auto for one-on-one bets) |
| `live` | Event in progress |
| `settling` | Event over, awaiting payment proofs |
| `settled` | All settlements confirmed |
| `closed` | Administratively closed |
| `archived` | Historical record |

### Payment Flow

```
pending → submitted → confirmed
                   ↘ rejected → pending (resubmit)
```

Participants submit proof (method + handle + confirmation code), then the host reviews and confirms or rejects.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Nuxt 4 + Nuxt UI 4 |
| **Runtime** | Cloudflare Workers (V8 isolates) |
| **Database** | Cloudflare D1 (SQLite) + Drizzle ORM |
| **Styling** | Tailwind CSS v4 with semantic design tokens |
| **Live Data** | ESPN scoreboard API, Open-Meteo weather, Polymarket odds |
| **AI** | xAI (optional, terms rewriting + closeout summaries) |
| **Monorepo** | PNPM Workspaces — app in `apps/web/`, shared layer in `layers/narduk-nuxt-layer/` |

### Key Architecture Patterns

- **Thin Components, Thick Composables** — pages subscribe to composables, pass props down, emit events up
- **SSR-safe state** — `useState()` and Pinia stores, never bare `ref()` at module scope
- **Edge-first** — all server code is stateless, no Node.js APIs, Web Crypto only
- **Manual settlement only** — no payment processing, no gambling transactions
- **Per-isolate rate limiting** with complementary Cloudflare WAF rules

---

## Data Model

```
napkinbets_wagers          # The bet itself (title, status, stakes, event context)
├── napkinbets_participants  # Who's in the bet (join status, payment status, side)
├── napkinbets_pots          # Payout splits (label, amount, sort order)
├── napkinbets_picks         # Individual picks (label, outcome, live score)
├── napkinbets_settlements   # Payment proof records (method, handle, verification)
└── napkinbets_notifications # In-app alerts and reminders

napkinbets_events            # Cached ESPN event data
├── napkinbets_event_snapshots # Point-in-time score captures
├── napkinbets_event_odds      # Polymarket odds cache
└── napkinbets_ingest_runs     # Event refresh run history

napkinbets_friendships       # Social graph connections
napkinbets_groups            # Betting groups
napkinbets_group_members     # Group membership roster
napkinbets_user_payment_profiles  # Saved payment methods
napkinbets_taxonomy_*        # Sports, leagues, and contexts config
napkinbets_featured_bets     # Admin-curated spotlight cards
napkinbets_app_settings      # AI feature toggles
```

---

## Local Development

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd napkinbets
   pnpm install
   ```

2. **Setup environment** — configure via Doppler or `.env` in `apps/web/`

3. **Prepare the database**
   ```bash
   pnpm run db:migrate
   pnpm run db:seed        # optional: seed with demo data
   ```

4. **Start dev server**
   ```bash
   pnpm run dev
   ```
   App runs at `http://localhost:3000`. Demo data is auto-seeded on first load.

5. **Database studio** (optional)
   ```bash
   pnpm db:studio:local
   ```

### Seed Accounts

| Email | Password | Role |
|---|---|---|
| `admin@nard.uk` | (hashed in seed) | Admin |
| `pat@nard.uk` | (hashed in seed) | Player |
| `logan@nard.uk` | (hashed in seed) | Player |
| `demo@napkinbets.app` | `DemoBoard123!` | Demo host (auto-created) |

---

## Deployment

Deployment is done locally via `pnpm run ship` (see AGENTS.md). The app deploys to Cloudflare Workers with a D1 database at `napkinbets.nard.uk`.

### Cron Triggers

| Schedule | Purpose |
|---|---|
| `* * * * *` | Every minute — live score refresh |
| `*/10 * * * *` | Every 10 minutes — event ingest |
| `7 */6 * * *` | Every 6 hours — deep refresh |
| `23 */12 * * *` | Every 12 hours — cleanup |

---

## Compliance

- Napkinbets is for **friendly wagers only**
- Users are responsible for complying with local laws where they participate
- The app **does not process payments** or automate gambling transactions
- Payment integrations are informational and record-keeping only
- Settlement happens entirely off-platform through the user's existing payment apps

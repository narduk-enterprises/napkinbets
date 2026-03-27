# Napkin Bets UI Plan

## Visual Direction

- Warm editorial sports tone, not sportsbook chrome.
- Structured surfaces, clear hierarchy, compact chips, and strong action
  placement.
- Cards should feel like one family across home, templates, dashboard, events,
  and detail.

## Primary Navigation

### Public

- `Home`
- `Templates`
- `Events`
- `How it works`
- `Open demo` or `Join`

### Authenticated

- `Dashboard`
- `Templates`
- `Events`
- `Create game`
- Secondary account links: `Groups`, `Friends`, `Payments`, `Admin`

## Homepage

### Section Order

1. Hero
2. How it works
3. Popular templates
4. Golf templates
5. Why groups use it
6. Standings and game management
7. Primary CTA
8. FAQ

### Hero Rules

- Headline must define the product in one sentence.
- Subhead must explain who it is for and what formats exist.
- CTA pair must be `Browse templates` and `Browse events`.
- Demo access can be tertiary.

### Popular Templates Section

- Use reusable template cards.
- Cards must show:
  - name
  - what it is
  - player fit
  - duration
  - scoring style
  - support state

### Golf Section

- Separate from generic templates.
- Must feel intentional, not bolted on.
- Must show why golf is especially natural for repeat group play.

### FAQ

- Must answer legality/compliance tone carefully.
- Must explain manual settlement.
- Must explain difference between templates, games, and groups.

## Templates Page

- Acts as the main public discovery hub.
- Must open with clear explanation of what a template is.
- Must show filters or grouped sections by:
  - featured
  - group pools
  - golf formats
  - contract-ready formats
- `Ready now` and `Contract next` states should be visibly distinct.
- Every card should offer a direct creation path.

## Golf Pools Page

- SEO-friendly category landing page.
- Should frame golf as a repeatable group ritual.
- Must highlight:
  - Golf Winner Pool
  - Golf Major Challenge
  - Golf One-and-Done as contract-ready
- Must include FAQ and CTA back into templates or create flow.

## Dashboard

### Priority Order

1. Active games needing action
2. Open invites
3. Ledger snapshot
4. Ongoing games
5. Empty-state recovery actions

### Copy Rules

- Use `games`, not `bets`, for section headers.
- Use compact action-first language.
- Empty state should point to templates first, then events.

## Create Flow

### Structure

1. Template selection
2. Event attachment or manual framing
3. Format-specific setup
4. Questions and picks structure
5. Stake and payment route
6. Summary and publish

### Interaction Rules

- The page must foreground the selected template before the form.
- Switching templates should feel like changing a preset, not restarting from
  scratch.
- Event-backed templates should gently steer users toward `/events` when no
  event is attached.
- Copy should say `game`, `pool`, `format`, and `group`.

## Event Browser

- Keep event discovery strong.
- Reframe CTA language around starting a game from an event.
- Event detail must say `Recommended formats`, not `Bet ideas`.

## Game Detail

### Information Order

1. Game title
2. Template label
3. Status
4. Event / venue / group context
5. Stake and payout summary
6. Participants and standings
7. Picks and activity
8. Settlement and next-step guidance

### Rules

- Show the human-friendly template label, never the raw internal slug.
- Status + template + league badges should be immediately scannable.
- Detail page should explain what the game is before showing admin controls.

## Mobile Behavior

- Bottom nav remains compact and task-focused.
- Dashboard must keep active games and invites above the fold.
- Template cards must collapse cleanly into one-column stacks.
- Creation flow should avoid giant two-column forms on narrow screens.

## Visual System Consistency

- Reuse the existing `napkinbets-panel` family for all new surfaces.
- Template cards, FAQ rows, summary cards, and dashboard lists should share
  spacing rhythm.
- Primary actions stay on `UButton color="primary"`.
- Secondary browse and explain actions stay neutral.
- Support-state badges use clear labels:
  - `Ready now`
  - `Contract next`

## Copy Consistency Rules

- `Create game`, not `Create Napkin`.
- `Recommended formats`, not `bet ideas`.
- `Your games`, not `Your bets`, for primary dashboard framing.
- `Game detail`, `pool`, `entry`, and `group` should replace mixed legacy nouns
  on high-traffic surfaces.

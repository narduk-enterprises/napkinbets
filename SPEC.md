# Napkin Bets Spec

## Product Sentence

Napkin Bets is the easiest way to run casual social competition around sports,
events, pools, and prediction-style games without turning the experience into a
sportsbook.

## Product Definition

- Napkin Bets is a platform for structured social games.
- It helps a host choose a reusable format, attach a real event when useful,
  invite a group, collect picks, track standings, and settle manually
  off-platform.
- The product center of gravity is not raw betting energy. It is organized,
  repeatable group play.

## Not This

- Not a regulated sportsbook.
- Not a pure DFS clone.
- Not a generic prediction market for everything.
- Not a crypto casino.
- Not an enterprise admin tool.
- Not a loose collection of unrelated betting experiments.

## Product Promise

A simple way to create, join, and run fun competitive game formats with friends,
groups, and communities.

## Pillars

1. Fast to understand.
2. Easy to create or join.
3. Social and shareable.
4. Structured but flexible.
5. Mobile-first.
6. Repeatable formats.
7. Clear standings and scoring.
8. Honest about manual settlement.

## Primary Users

- Group hosts: the commissioner, watch-party organizer, office pool runner, or
  golf trip captain.
- Regular players: people who join recurring games and need a quick way to make
  picks and track standings.
- Golf-heavy groups: Masters week rooms, one-and-done circles, and tournament
  side-game groups.

## Product Model

- `Template`: the reusable format and rules shell.
- `Game`: a live instance created from a template.
- `Pool`: a multiplayer game subtype where multiple entries compete under shared
  rules.
- `Entry`: a participant seat inside a game.
- `Pick`: an individual choice or answer inside a game.
- `Event`: the real-world sports or cultural event that can anchor a game.
- `Group`: a recurring social container for repeat play.
- `Invite`: the join path into a game or group.
- `Standing`: the current ranked state for a game.
- `Settlement`: the off-platform payment proof and confirmation layer.

## Primary UI Language

- Use `game` as the default user-facing noun.
- Use `pool` when the format is explicitly multiplayer and standings-driven.
- Use `template` for reusable format shells.
- Use `pick` for the participant action.
- Use `group` for recurring communities.
- Treat `napkin` and `wager` as internal legacy terms, route terms, or
  admin/storage terms.

## Current Implementation Reality

- The existing storage model is still wager-centric.
- The current schema already supports participants, picks, legs, scoring rules,
  groups, invites, event linkage, standings, and manual settlement.
- The coherence pass should formalize a product layer on top of that model
  instead of replacing it.

## Template Strategy

Templates are the visible product spine. The product should start from format
selection, not from a blank form.

### First-Class Templates Now

- `Head-to-Head Challenge` Best for one friend, one event, one clean side.
- `Winner Pool` Best for a single matchup or featured event with a simple
  outcome.
- `Event Prediction Pool` Best for multi-question weekend pools, playoff pools,
  and event-based contests.
- `Golf Winner Pool` Best for picking a winner or featured golfer result in a
  tournament.
- `Golf Major Challenge` Best for a golf room that wants multiple outcomes, side
  pots, and tournament flavor.
- `Custom Side Game` Best for flexible watch-party and text-chain competition.

### Contract-Ready Formats

These belong in the product model and docs now, but do not yet have fully
bespoke interaction shells:

- `Pick'em Slate`
- `Confidence Pool`
- `Survivor / Knockout`
- `Football Squares`
- `Bracket Challenge`
- `Golf One-and-Done`

## Top 5 Templates To Elevate In The UI

1. Head-to-Head Challenge
2. Winner Pool
3. Event Prediction Pool
4. Golf Winner Pool
5. Golf Major Challenge

## Golf Strategy

- Golf is a first-class content and template cluster, not a side mention.
- The public product story should explicitly mention golf pools and major-week
  formats.
- The templates page should surface golf separately.
- The product should treat golf as one of the strongest recurring use cases for
  groups.

## Pool Strategy

- Pool is a product subtype, not the whole product.
- Pools should feel social, repeatable, and standings-driven.
- Default pool formats should lean toward office pools, event pools, and golf
  rooms.

## Page Inventory

### Public

- `/` Mission-led homepage with format-first discovery.
- `/templates` Main template browser and category hub.
- `/golf-pools` Golf-specific format landing page.
- `/guide` How-it-works, terminology, and FAQ.
- `/events` Event browser for users who want to start from a live schedule.
- `/events/[id]` Event detail with recommended templates.

### Authenticated Core App

- `/dashboard` Active games, invites, deadlines, standings snapshots, and
  action-first priorities.
- `/napkins/create` Guided create flow that starts from a selected template.
- `/napkins/[slug]` Game detail, picks, standings, context, and settlement.
- `/groups` Recurring groups and communities.
- `/friends` Frequent opponents and invite shortcuts.
- `/ledger` Manual settlement tracking.

## Key Flows

### New Visitor

1. Understand what Napkin Bets is in the hero.
2. See common template formats.
3. See golf and pool examples.
4. Choose `Browse templates`, `Browse events`, or `Open demo`.

### Create A Game

1. Pick a template.
2. Attach an event if the format benefits from one.
3. Customize title, players, sides, questions, and payout logic.
4. Publish and share.

### Join A Game

1. Open invite or shared link.
2. Understand the format in under 10 seconds.
3. Lock in the seat or side.
4. Track standings and settle after the result.

### Returning Player

1. Open dashboard.
2. See active games and open invites first.
3. See what needs action now.
4. Drop into the relevant game quickly.

## Homepage Requirements

The homepage must answer:

- What is this?
- Who is it for?
- What kinds of games can I run?
- Why is it better than group-chat chaos?
- What do I do next?

Required section order:

1. Hero
2. How it works
3. Popular templates
4. Golf templates
5. Group benefits
6. Product surfaces and standings
7. CTA
8. FAQ
9. Footer

## Navigation Rules

- Public nav should prioritize `Templates`, `Events`, and `How it works`.
- Authenticated nav should prioritize `Dashboard`, `Templates`, `Events`, and
  `Create game`.
- `Games` is the user-facing top-level object.
- `Templates` is the main discovery surface.

## SEO Strategy

- Homepage targets the broad brand and category story.
- `/templates` targets structured format discovery intent.
- `/golf-pools` targets golf pool intent.
- `/guide` targets product explanation and FAQ intent.
- Public template and category pages should target:
  - golf pool app
  - one and done golf pool
  - office pick'em pool
  - football squares online
  - event prediction pool
  - confidence pool app
  - sports pool standings

## Structured Data Strategy

- Home: `WebPage` plus `FAQPage`.
- Templates hub: `CollectionPage` plus breadcrumbs.
- Golf pools: `CollectionPage` plus `FAQPage`.
- Guide: `FAQPage`.
- Site identity remains `Organization`.

## Data Model Direction

The existing database remains practical if the product layer is explicit:

- `napkinbets_wagers` is the current storage record for a game instance.
- `format` acts as the template key.
- `napkinType` distinguishes head-to-head versus pool behavior.
- `legs` carry multi-question formats.
- `scoringRule` and `scoringConfigJson` define standings behavior.
- `participants`, `picks`, `pots`, and `settlements` already cover the core play
  loop.

## Acceptance Definition

Napkin Bets passes this coherence spec when:

- The public story clearly says structured social games.
- Templates are visible and easy to browse.
- Golf is visibly first-class.
- The create flow clearly starts from a format.
- The dashboard reads as a game workspace, not a loose wager inbox.
- Terminology stops drifting across primary surfaces.

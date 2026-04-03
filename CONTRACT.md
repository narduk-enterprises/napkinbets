# Napkin Bets Product Contract

## Purpose

This contract freezes the shared language, page requirements, template rules,
and schema expectations for Napkin Bets so future work stops drifting.

## Terminology Contract

- `Template` Reusable format definition.
- `Game` Instantiated competition created from a template.
- `Pool` A multiplayer game with shared standings or payout logic.
- `Entry` A participant seat in a game.
- `Pick` A choice made by an entry.
- `Group` A recurring social container.
- `Event` The real-world source event that can anchor a game.
- `Settlement` Manual off-platform payment proof and confirmation.

### Forbidden Primary Framing

- Do not lead with `napkin` on major public surfaces.
- Do not use `wager` as the primary product noun outside admin or internal
  contexts.
- Do not describe the product like a sportsbook.

## Page Contract

### Homepage

Must include:

- clear product definition
- template-first discovery
- golf-first proof points
- social group value
- FAQ

### Templates

Must include:

- featured templates
- grouped categories
- support-state badges
- direct create CTA

### Golf Pools

Must include:

- golf narrative
- golf template cards
- FAQ
- CTA back into create or templates

### Dashboard

Must prioritize:

- active games
- invites
- ledger state
- create and browse escape hatches

### Create Game

Must show:

- selected template
- whether the template is event-backed or flexible
- format-specific defaults
- publish summary

### Game Detail

Must show:

- game title
- human-friendly template label
- status
- participants
- standings
- picks
- settlement state

## Template System Contract

### Template Fields

Every reusable template definition must include:

- `key`
- `label`
- `category`
- `sport focus`
- `summary`
- `group size guidance`
- `duration guidance`
- `scoring summary`
- `support state`
- `create defaults`

### Support States

- `Ready now` Product can create and present the format with the current UI.
- `Contract next` Format is part of the documented product direction but does
  not yet have a bespoke execution shell.

### Current First-Class Templates

- `head-to-head`
- `winner-pool`
- `event-prediction-pool`
- `golf-winner-pool`
- `golf-major-challenge`
- `custom-side-game`

### Contract-Next Templates

- `pickem-slate`
- `confidence-pool`
- `survivor-knockout`
- `football-squares`
- `bracket-challenge`
- `golf-one-and-done`

## Schema Contract

### Current Storage Mapping

- `napkinbets_wagers` Stores a `Game`.
- `napkinbets_participants` Stores `Entries`.
- `napkinbets_picks` Stores `Picks`.
- `napkinbets_wager_legs` Stores questions or sub-markets.
- `napkinbets_pots` Stores payout splits.
- `napkinbets_settlements` Stores settlement proof.
- `napkinbets_groups` Stores recurring groups.
- `napkinbets_events` Stores anchor events.

### Required Conceptual Fields

Every game must conceptually resolve:

- template key
- game type
- event linkage state
- participant structure
- pick structure
- scoring rule
- payout rule
- visibility of standings
- manual settlement route

### Current Practical Mapping

- `format` is the template key.
- `napkinType` distinguishes head-to-head versus pool structure.
- `boardType` distinguishes event-backed versus manual creation mode.
- `legs` represent question-based formats.
- `scoringRule` and `scoringConfigJson` bound standings behavior.

### Boundary Rules

- Do not introduce sport-specific tables for every new format.
- Do not over-abstract away the existing practical wager model.
- Use template metadata plus legs and scoring config before inventing new
  structural tables.

## SEO Contract

- Every public page must call `useSeo()` and a schema helper.
- Home should use FAQ schema.
- Templates and golf pages should use `CollectionPage`.
- Guide should use FAQ schema.
- Titles and descriptions must align to the structured social games story.

## Analytics Contract

If analytics events are emitted, use this naming set:

- `template_viewed`
- `template_selected`
- `create_started`
- `create_published`
- `game_opened`
- `game_joined`
- `pick_logged`
- `settlement_submitted`
- `group_opened`

## Acceptance Criteria

- Major public surfaces consistently say `game`, `pool`, and `template`.
- A shared template catalog powers public discovery and create defaults.
- Golf appears as a first-class template cluster.
- Event pages recommend formats instead of vague bet ideas.
- Dashboard and detail pages expose the human-friendly template label.
- Legacy `napkin` or `wager` wording is minimized on high-traffic pages.

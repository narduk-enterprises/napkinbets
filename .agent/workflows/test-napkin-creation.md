---
description:
  Build integration API tests and E2E tests for the napkin creation flow
  including AI features
---

# Test Suite: Napkin Creation + AI Features

Build a complete test suite covering the napkin creation flow, AI-powered
features, and form behavior. Tests should go in `apps/web/tests/`.

## Context — What Was Built

The napkin creation page (`apps/web/app/pages/napkins/create.vue`) was
redesigned with these features:

### Backend (API Endpoints)

1. **`POST /api/napkinbets/ai/generate-napkin`** — AI napkin generation via Grok
   - Accepts `messages`, `eventContext?`, `friendNames?`
   - Returns `NapkinbetsGeneratedNapkin` with `title`, `description`,
     `category`, `format`, `sideOptions`, `terms`, `legs`, `participants`,
     `message`
2. **`POST /api/napkinbets/ai/suggest-legs`** — AI leg suggestions
   - Accepts `title`, `format`, `existingLegs`, `eventContext?`
   - Returns `{ legs: SuggestedLeg[] }` where each leg has `questionText`,
     `legType`, `options`, `numericUnit`
3. **`POST /api/napkinbets/wagers`** — Wager creation (existing, but now handles
   pool + multi-line legs)
   - Accepts `CreateWagerInput` including `napkinType: 'pool'`, `legs[]`,
     `participantSeeds[]`
4. **`GET /api/napkinbets/ai/status`** — Returns `{ aiEnabled: boolean }`
5. **`POST /api/napkinbets/admin/ai-settings`** — Toggle AI feature flags

### Frontend Components

1. **`NapkinbetsCreateForm.vue`** — Main form with:
   - Head-to-head vs Group Pool mode switching
   - Multi-line legs builder (categorical + numeric)
   - AI "Suggest questions" button
   - Quick stake chips ($1, $5, $10, $20, $50, $100)
   - `applyGeneratedNapkin()` that auto-fills title, description, format,
     category, terms, sides, legs, and participants
   - Participant auto-matching against friends list (matched → linked userId,
     unmatched → manual name)
   - Auto-switch to Group Pool when AI returns 2+ participants
2. **`NapkinbetsAiGenerator.vue`** — Chat-style AI generator with:
   - Multi-turn conversation
   - "Surprise me" random bet button
   - "Use this Napkin" button that emits to the form
   - Passes `friendNames` prop to Grok

### Key Files to Reference

- `apps/web/server/services/napkinbets/ai.ts` — `generateNapkinBet()`,
  `suggestNapkinbetsLegs()`
- `apps/web/server/utils/systemPrompts.ts` — Default system prompts
  (napkin_generator includes participants)
- `apps/web/app/composables/useNapkinbetsCreateBuilder.ts` — Form state, legs
  CRUD, payload computation
- `apps/web/app/composables/useNapkinbetsAi.ts` — `useNapkinbetsAiGenerator()`
  composable
- `apps/web/app/services/napkinbets-api.ts` — `generateNapkin()`,
  `suggestLegs()` API methods
- `apps/web/server/services/napkinbets/settings.ts` — AI settings (defaults to
  enabled)
- `apps/web/server/database/schema.ts` — `napkinbetsAppSettings` table with AI
  flags
- `apps/web/types/napkinbets.ts` — `NapkinbetsGeneratedNapkin`,
  `CreateWagerInput`

## Integration API Tests

Create `apps/web/tests/integration/napkin-creation-api.test.ts`:

### 1. AI Status Endpoint

- `GET /api/napkinbets/ai/status` returns `{ aiEnabled: true }` when settings
  are enabled
- Returns `{ aiEnabled: false }` when `aiRecommendationsEnabled` is toggled off

### 2. Generate Napkin Endpoint

- `POST /api/napkinbets/ai/generate-napkin` with valid messages returns complete
  `NapkinbetsGeneratedNapkin`
- Response includes all required fields: `title`, `description`, `category`,
  `format`, `sideOptions`, `terms`, `legs`, `participants`, `message`
- `friendNames` are included in the Grok prompt (mock the AI call, assert the
  constructed messages include friend info)
- Returns 400 for empty messages array
- Returns 401 for unauthenticated requests
- Rate limiting works (10 requests/minute)

### 3. Suggest Legs Endpoint

- `POST /api/napkinbets/ai/suggest-legs` returns `{ legs: [...] }` with valid
  leg objects
- Each leg has `questionText`, `legType` (categorical or numeric), `options`,
  `numericUnit`
- Returns 400 when `title` is missing
- Returns 401 for unauthenticated requests
- Accepts and uses `existingLegs` to avoid duplicate suggestions
- Accepts and uses `eventContext` for grounded suggestions

### 4. Wager Creation with Legs

- `POST /api/napkinbets/wagers` with `napkinType: 'pool'` and `legs[]` creates a
  pool wager
- Legs are persisted to `napkinbetsWagerLegs` table
- Participants are persisted to `napkinbetsParticipants` table
- Simple bet with legs still works (custom bet with questions)

### 5. AI Settings Management

- `POST /api/napkinbets/admin/ai-settings` toggles flags correctly
- Generate/suggest endpoints respect the `aiRecommendationsEnabled` flag (reject
  when off)

## Unit Tests

Create `apps/web/tests/unit/napkin-creation-builder.test.ts`:

### 1. Legs CRUD

- `addLeg()` appends a new leg with defaults
- `removeLeg(index)` removes the correct leg
- `addLegOption(legIndex)` adds option from `optionDraft` and clears draft
- `removeLegOption(legIndex, optionIndex)` removes the correct option
- Legs are included in `payload` for pool bets
- Legs are included in `payload` for custom bets

### 2. Payload Computation

- `payload` computed property includes `legs` when `legList` is non-empty
- `payload` correctly structures pool data with participants, sides, and legs
- `payload` for simple bets includes opponent info

### 3. Participant Matching (test applyGeneratedNapkin logic)

- Single participant → stays head-to-head, sets opponent
- Multiple participants → switches to pool, populates poolParticipants
- Matched friend name → `userId` is set
- Unmatched name → `userId` is null, `displayName` is the raw name
- Creator name is filtered out of participants

## E2E Tests (Browser)

Create `apps/web/tests/e2e/napkin-creation.test.ts`:

### 1. Form Rendering

- Page loads at `/napkins/create`
- Both "Head-to-Head" and "Group Pool" buttons are visible and clickable
- Switching to Group Pool reveals pool-specific sections

### 2. Legs Builder

- "Add a question" button adds a new leg card
- Can type a question, select answer type, and add options
- Can remove a leg
- "Suggest questions" button is visible when AI is enabled

### 3. Stake Chips

- Quick stake chips ($1, $5, $10, $20, $50, $100) are visible
- Clicking a chip updates the stake input value
- Active chip has primary color styling

### 4. AI Generator

- AI generator card is visible
- Can type a prompt and submit
- "Surprise me" button is visible on initial state
- After generation, "Use this Napkin" fills the form fields
- "Start Over" resets the conversation

### 5. Full Flow

- Generate a napkin via AI → Use this Napkin → verify form fields populated →
  submit
- Create a manual pool bet with multiple legs → verify submission

## Test Infrastructure Notes

- Use Vitest for unit/integration tests (already configured in the project)
- For API integration tests, you may need to mock `grokChat` to avoid real API
  calls — mock it to return a valid JSON string matching
  `NapkinbetsGeneratedNapkin`
- Check `apps/web/tests/unit/napkinbets-events.test.ts` for existing test
  patterns
- The project uses `pnpm test` or `pnpm vitest` for running tests
- For E2E, check if Playwright or similar is configured; if not, set up
  Playwright
- All AI service functions take an `H3Event` — mock this for unit tests
- Database tests need a test D1 instance or mock

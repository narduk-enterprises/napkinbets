# Continue: Napkin states seed and E2E — handoff for next agent

Use this as the **continue prompt** when picking up this work. Do the items
below in order.

---

## Priority 0: Make tests fast, parallel, and fail-fast (do this first)

**Before any other plan items**, optimize the E2E suite for fast iteration:

- **Run in parallel** — Playwright config already has `fullyParallel: true`;
  ensure no test depends on another (no shared mutable server state that would
  force serialization). If any test must be serial, document why and isolate it.
- **Fail fast** — Keep or tighten `maxFailures: 1` (or low) in non-CI so the
  first failure stops the run; avoid long retry chains before feedback.
- **No super long waits** — Replace or shorten:
  - **Demo login**: `page-helpers.ts` `loginAsDemo` currently uses 25s for
    goto + `waitForURL`. Prefer waiting for a **specific selector** on the
    destination page (e.g. main heading or data-testid) with a shorter timeout
    (e.g. 8–10s) so slow redirects fail quickly instead of hanging.
  - **`waitForLoadState('networkidle')`** in `page-coverage.spec.ts` and
    `visual-bet-pages.spec.ts` — remove or replace with “wait for one visible
    element that indicates page ready” (e.g. hero or card) so tests don’t wait
    for all network traffic.
  - **`test.slow()`** in `page-coverage.spec.ts` — remove or restrict to the
    minimal set of tests that genuinely need extra time; use selector-based
    readiness instead of tripling timeout.
  - **Explicit timeouts** (e.g. 10_000 / 15_000 ms on `toBeVisible`) — reduce
    where possible; prefer default expect timeout (5s in config) and stable
    selectors so failures are quick.
- **Playwright config** (`playwright.config.ts`): keep `timeout` and
  `actionTimeout` / `navigationTimeout` tight (e.g. 15s test, 3s action, 5s
  nav); avoid raising them to “fix” flakiness — fix by waiting on the right
  element instead.
- **Outcome**: Tests should run in parallel, finish in under ~1–2 minutes for
  the full web suite, and fail within a few seconds when something breaks (no
  25s or networkidle stalls).

---

## Priority 1: Remaining plan work (after Priority 0)

After the test suite is fast and fail-fast, continue with the napkin states plan
in this order. Reference:
[.cursor/plans/napkin_states_seed_and_tests_a8067d8c.plan.md](.cursor/plans/napkin_states_seed_and_tests_a8067d8c.plan.md).

1. **Seed from prod** — Export prod D1, derive normalized seed (anonymize,
   stable IDs, map `proof_image_url` → seed assets). See plan §7.
2. **Proof images** — Every settlement in seed has `proof_image_url`; add seed
   image for rejected if needed; `db:seed` uploads all to R2. See plan §8.
3. **Seed complete** — Seed covers all wager statuses and settlement/participant
   variants; unified demo + layer seed; document slugs for E2E. See plan §4–5,
   §10.
4. **Unit tests** — Fix `napkinbets-wager-detail.test.ts` `verificationStatus`
   (use `submitted` not `pending`); add unit tests for new helpers if extracted.
   See plan §5.
5. **E2E flows** — Already added: invitation (with skip when card missing),
   simple-bet, ledger (submitted/rejected), closeout, scoreboard, join, manage
   actions, visual regression. Any remaining gaps from plan §3–5 (e.g.
   “Acknowledge receipt”, optional form submit) can be filled after seed is
   complete.
6. **Visual regression** — Already in place (`visual-bet-pages.spec.ts`); after
   seed/data is correct, re-run with `--update-snapshots` if UI or data changed.
   See plan §9.

---

## Key files

- **E2E**: `apps/web/tests/e2e/page-coverage.spec.ts`,
  `visual-bet-pages.spec.ts`, `bet-states.spec.ts`, `page-helpers.ts`,
  `fixtures.ts` (re-exports layer).
- **Config**: `playwright.config.ts` (root).
- **Seed**: `apps/web/server/services/napkinbets/seed.ts`.
- **Plan**: `.cursor/plans/napkin_states_seed_and_tests_a8067d8c.plan.md`.

---

## Summary

1. **First**: Make tests run in parallel, fast, and fail fast — no super long
   waits; selector-based readiness; shorter timeouts.
2. **Then**: Seed from prod → proof images → seed complete → unit tests → E2E
   gaps → visual regression (as needed).

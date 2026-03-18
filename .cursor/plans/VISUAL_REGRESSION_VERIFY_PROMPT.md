# Prompt: Re-run visual regression tests and re-inspect all screenshots

Use this prompt to have an agent re-run the E2E visual regression suite,
re-inspect every baseline screenshot, and confirm that recent UI fixes are
correct and that no new layout or logic issues were introduced.

---

## Task

1. **Run the visual regression tests** so new screenshots are generated (or
   baselines are compared).
2. **Visually inspect every screenshot** in the snapshot folder and document
   what you see.
3. **Verify the following fixes are present and correct** (no regressions, no
   new issues):

### Fixes to verify

- **Paid count:** On napkin detail pages, "At a glance" → "Paid" should show
  only **confirmed** settlements (e.g. on rejected-state page, Paid should not
  count the rejected settlement; expect 0 or 1 for confirmed only).
- **ENTRY note:** On closeout pages, the PAY WITH → ENTRY text should read **"NB
  &lt;slug> • entry $X.00"** with **no** duplicate "• entry" at the end.
- **Settlement ledger:** Each ledger row should have a left anchor: either the
  payment proof image **or** an initials pill (two letters) when there is no
  proof image. No empty white squares.
- **Settle up button:** On napkin detail when the wager is **live** or
  **upcoming**, the "Settle up" button in the hero should **not** be visible. On
  ready/submitted/settled it should be visible when the user can manage.
- **Form alignment:** The two forms "Log a pick" and "Submit payment proof"
  should have aligned rows (e.g. Confidence and Screenshot proof on the same
  horizontal line).
- **Draft order:** Status badges (confirmed/submitted/pending) should be at the
  end of the row without a large gap of whitespace in the middle.
- **Empty states:** Settlement ledger with no settlements should show "No
  payment proof logged yet." Payout breakdown / Draft order / Leaderboard when
  empty should show the appropriate placeholder text (e.g. "No payout breakdown
  yet.", "Accept the bet to see the draft order.", "No leaderboard yet.").
- **Closeout Draft summary:** The "Draft summary" button and the description
  text should be on the same row and vertically aligned (flex items-center).
- **Friday Hoops:** The main demo pool (Friday Hoops Group Bet /
  demo-hoops-night) should show **NBA** (and basketball) in tags, **not** MLB.
- **Buttons:** "Save proof" and "Save pick" should look like equal secondary
  actions (same variant/color).
- **Contrast:** Any "$10 open" or "Stake each" hint text should be readable
  (text-muted, not overly faint).

4. **List any new layout or logic issues** you notice (e.g. broken alignment,
   wrong counts, missing elements, duplicate content, or inconsistent styling).

---

## Commands and paths

- **Run all E2E tests (includes visual) from repo root:**

  ```bash
  pnpm test:e2e
  ```

  Run only napkin-related tests (detail, closeout, states):

  ```bash
  pnpm test:e2e:napkins
  ```

  If you need to update baselines after intentional UI changes:

  ```bash
  pnpm exec playwright test --config=playwright.config.ts --project=web --update-snapshots
  ```

- **Screenshot locations (per-feature baseline images to inspect):**
  - `apps/web/tests/e2e/playwright-snapshots/guest/guest.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/dashboard/dashboard.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/events/events.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/games/games.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/groups/groups.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/napkins/detail.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/napkins/closeout.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/settings/settings.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/shell/shell.spec.ts-snapshots/`
  - `apps/web/tests/e2e/playwright-snapshots/admin/admin.spec.ts-snapshots/`

  Napkin/closeout baselines (all `.png`):
  - detail: napkin-detail-pool-demo-hoops-night.png, napkin-detail-state-\*.png,
    napkin-detail-simple-bet.png, napkin-detail-invitation.png,
    napkin-detail-join-pool.png
  - closeout: closeout-pool-demo-hoops-night.png, closeout-state-settled.png,
    closeout-state-submitted.png, closeout-state-rejected.png,
    closeout-state-locked.png

- **Key files (for reference):**
  - Napkin detail page: `apps/web/app/pages/napkins/[slug]/index.vue`
  - Closeout page: `apps/web/app/pages/napkins/[slug]/closeout.vue`
  - Napkin card (ledger, forms, draft order):
    `apps/web/app/components/napkinbets/NapkinbetsNapkinCard.vue`
  - Payment note: `apps/web/app/composables/useNapkinbetsPaymentLinks.ts`
  - Settlement stage: `apps/web/app/utils/napkinbets-wager-detail.ts`
  - Seed (demo-hoops sport/league):
    `apps/web/server/services/napkinbets/seed.ts`

---

## Output format

Produce a short report that includes:

1. **Test run result:** Pass/fail and any failures or snapshot diffs.
2. **Per-screenshot checklist:** For each of the 14 images, note whether the
   fixes above are present and correct (yes/no or brief note).
3. **New issues:** Any new layout or logic problems observed (list or "None").
4. **Recommendations:** Any follow-up code changes if something is wrong or
   inconsistent.

---

## Notes

- The Nuxt DevTools performance overlay (e.g. "72 ms" in the corner) may still
  appear in screenshots; that is intentional and can be ignored.
- Ensure the dev server and seed data are ready before running tests (e.g.
  `pnpm run db:ready` then run tests with webServer in config, or reuse an
  existing server).

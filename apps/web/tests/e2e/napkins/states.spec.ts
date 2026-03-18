import { expect, test, waitForHydration } from '../fixtures'
import { DEMO_STATE_SLUGS, loginAsDemo } from '../page-helpers'

/**
 * E2E coverage for all bet states: assertions for each state's UI (ledger, closeout, badges).
 * ensureSeedData creates demo-wager-settled, demo-wager-submitted, demo-wager-rejected, demo-wager-locked.
 */
test.describe('napkins — states', () => {
  test.describe.configure({ mode: 'serial' })

  test('state settled: napkin detail shows settlement ledger with confirmed', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.settled}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Settled' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Settlement ledger' })).toBeVisible()
    await expect(page.getByText('confirmed').first()).toBeVisible()
  })

  test('state settled: settlement ledger shows payment proof image', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.settled}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Settlement ledger' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Payment proof' }).first()).toBeVisible()
  })

  test('state submitted: napkin detail shows submitted settlement', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.submitted}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Submitted' }).first()).toBeVisible()
    await expect(page.getByText('submitted').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Settlement ledger' })).toBeVisible()
  })

  test('state submitted: closeout shows Ready to confirm and Confirm/Send back', async ({
    page,
  }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.submitted}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Ready to confirm' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send back' }).first()).toBeVisible()
  })

  test('state submitted: closeout shows Draft summary button', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.submitted}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('button', { name: 'Draft summary' })).toBeVisible()
  })

  test('state rejected: closeout shows Players to follow up with and pending list', async ({
    page,
  }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.rejected}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Players to follow up with' })).toBeVisible()
    await expect(page.getByText('Pending').first()).toBeVisible()
  })

  test('state rejected: napkin detail shows rejected settlement and rejection note', async ({
    page,
  }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.rejected}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Rejected' }).first()).toBeVisible()
    await expect(page.getByText('rejected').first()).toBeVisible()
    await expect(page.getByText('Wrong amount').first()).toBeVisible()
  })

  test('state rejected: closeout shows rejected settlement', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.rejected}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Rejected' }).first()).toBeVisible()
    await expect(page.getByText('rejected').first()).toBeVisible()
  })

  test('state locked: napkin detail shows locked badge and pending picks', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.locked}`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Locked' }).first()).toBeVisible()
    await expect(page.getByText('locked').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Picks' })).toBeVisible()
  })

  test('state settled: closeout shows all confirmed', async ({ page }) => {
    await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.settled}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Demo Wager Settled' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ready to confirm' }).first()).toBeVisible()
    await expect(
      page.getByText('Everyone has either paid or submitted proof').first(),
    ).toBeVisible()
  })
})

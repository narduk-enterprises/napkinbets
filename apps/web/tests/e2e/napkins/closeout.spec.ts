import { expect, test, waitForHydration } from '../fixtures'
import { DEMO_STATE_SLUGS, DEMO_WAGER_SLUG, DEMO_WAGER_TITLE, loginAsDemo } from '../page-helpers'

test.describe('napkins — closeout', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('closeout page renders for pool and has host checklist', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Host checklist' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Ready to confirm' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Back to bet' })).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('closeout — pool (main demo)', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Host checklist' })).toBeVisible()
      await expect(page).toHaveScreenshot(`closeout-pool-${DEMO_WAGER_SLUG}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('closeout — state: settled', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.settled}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Settled' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('closeout-state-settled.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('closeout — state: submitted', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.submitted}/closeout`)
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Demo Wager Submitted' }).first(),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Ready to confirm' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('closeout-state-submitted.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('closeout — state: rejected', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.rejected}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Rejected' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('closeout-state-rejected.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('closeout — state: locked', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.locked}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Locked' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('closeout-state-locked.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  })
})

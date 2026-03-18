import { expect, test, waitForHydration } from '../fixtures'
import { DEMO_WAGER_SLUG, loginAsDemo } from '../page-helpers'

test.describe('routing', () => {
  test.describe.configure({ mode: 'serial' })

  test('discover and legacy create routes redirect to current pages', async ({ page }) => {
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/events$/)
    await expect(
      page.getByRole('heading', { name: 'Pick a game, then start a bet.' }),
    ).toBeVisible()

    await page.goto('/wagers/create')
    await expect(page).toHaveURL(/\/napkins\/create$/)
  })

  test('demo page signs into the seeded workspace', async ({ page }) => {
    await page.goto('/demo')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole('heading', {
        name: 'Everything you started, joined, or still need to settle.',
      }),
    ).toBeVisible()
  })

  test('legacy wager routes redirect to napkins', async ({ page }) => {
    await loginAsDemo(page, '/dashboard')
    await waitForHydration(page)
    await page.goto(`/wagers/${DEMO_WAGER_SLUG}`)
    await expect(page).toHaveURL(new RegExp(`/napkins/${DEMO_WAGER_SLUG}$`))
    await page.goto(`/wagers/${DEMO_WAGER_SLUG}/closeout`)
    await expect(page).toHaveURL(new RegExp(`/napkins/${DEMO_WAGER_SLUG}/closeout$`))
  })
})

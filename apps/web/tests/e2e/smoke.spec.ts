import { expect, test, waitForBaseUrlReady, waitForHydration, warmUpApp } from './fixtures'

test.describe('web smoke', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error('web smoke tests require Playwright baseURL to be configured.')
    }

    await waitForBaseUrlReady(baseURL)
    await warmUpApp(browser, baseURL)
  })

  test('home and discovery routes render the new Napkinbets flow', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
    await expect(
      page.getByText('Friendly boards for live games, drafts, and side bets.'),
    ).toBeVisible()
    await expect(page.getByText('Discover. Board. Close out.')).toBeVisible()
    await expect(page.getByText('Tracked board').first()).toBeVisible()
    await expect(page).toHaveTitle(/Friendly wager boards for sports nights/)

    await page.goto('/discover')
    await waitForHydration(page)
    await expect(page.getByText('Start from current and upcoming sports events.')).toBeVisible()
    await expect(page.getByText('Ideas beyond a straight game winner')).toBeVisible()
  })
})

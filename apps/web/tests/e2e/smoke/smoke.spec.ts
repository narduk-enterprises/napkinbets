import { expect, test, waitForBaseUrlReady, waitForHydration, warmUpApp } from '../fixtures'

test.describe('web smoke', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error('web smoke tests require Playwright baseURL to be configured.')
    }

    await waitForBaseUrlReady(baseURL)
    await warmUpApp(browser, baseURL)
  })

  test('home and events routes render the current Napkinbets flow', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
    await expect(page.getByText('Pick a game. Start a bet. Settle after the final.')).toBeVisible()
    await expect(page.getByText('Real games')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse games' })).toBeVisible()
    await expect(page).toHaveTitle(/Real games first. Simple bets second./)

    await page.goto('/events')
    await waitForHydration(page)
    await expect(
      page.getByRole('heading', { name: /Pick a game, then start a bet/i }),
    ).toBeVisible()
    await expect(page.getByText('Filter games').first()).toBeVisible()
  })
})

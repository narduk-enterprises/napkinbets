import { expect, test, waitForBaseUrlReady, waitForHydration, warmUpApp } from './fixtures'

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
    await expect(page.getByText('Put the side bet where everyone can see it.')).toBeVisible()
    await expect(page.getByText('Real games in')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse games' })).toBeVisible()
    await expect(page).toHaveTitle(/Social sports pools for games, props, and drafts/)

    await page.goto('/events')
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: /Start from tonight/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Narrow the games' })).toBeVisible()
  })
})

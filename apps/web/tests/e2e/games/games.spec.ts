import { expect, test, waitForHydration } from '../fixtures'

test.describe('games', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('games timeline page renders', async ({ page }) => {
      await page.goto('/games')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'All games' })).toBeVisible()

      const noGames = page.getByText('No games right now')
      const loadMore = page.getByRole('button', { name: 'Load more' })
      const empty = await noGames.isVisible().catch(() => false)
      const hasLoadMore = await loadMore.isVisible().catch(() => false)

      if (empty) {
        await expect(noGames).toBeVisible()
      } else {
        await expect(
          page.getByText('Live and upcoming games in order.', { exact: false }),
        ).toBeVisible()
        if (hasLoadMore) {
          await expect(loadMore).toBeVisible()
        }
      }
    })
  })

  test.describe('visual', () => {
    test('games — timeline', async ({ page }) => {
      await page.goto('/games')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'All games' })).toBeVisible()
      await expect(page).toHaveScreenshot('games-timeline.png', { fullPage: true })
    })
  })
})

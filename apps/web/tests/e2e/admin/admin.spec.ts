import { expect, test, waitForHydration } from '../fixtures'
import { ensureDemoAdminSession } from '../page-helpers'

test.describe('admin', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('admin page renders after promoting the demo user', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await expect(
        page.getByRole('heading', { name: 'Run the product, not just the bets.' }),
      ).toBeVisible()
      await page.getByRole('tab', { name: 'Users' }).click()
      await expect(
        page.getByRole('heading', { name: 'Registration and admin roles' }),
      ).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('admin — Dashboard tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Run the product, not just the bets.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true })
    })

    test('admin — Events tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'Events' }).click()
      await waitForHydration(page)
      await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible()
      await expect(page).toHaveScreenshot('admin-events.png', { fullPage: true })
    })

    test('admin — Bets tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'Bets' }).click()
      await waitForHydration(page)
      await expect(page.getByRole('tab', { name: 'Bets' })).toBeVisible()
      await expect(page).toHaveScreenshot('admin-bets.png', { fullPage: true })
    })

    test('admin — AI tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'AI' }).click()
      await waitForHydration(page)
      await expect(page.getByRole('tab', { name: 'AI' })).toBeVisible()
      await expect(page).toHaveScreenshot('admin-ai.png', { fullPage: true })
    })

    test('admin — Taxonomy tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'Taxonomy' }).click()
      await waitForHydration(page)
      await expect(page.getByRole('tab', { name: 'Taxonomy' })).toBeVisible()
      await expect(page).toHaveScreenshot('admin-taxonomy.png', { fullPage: true })
    })

    test('admin — Featured tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'Featured' }).click()
      await waitForHydration(page)
      await expect(page.getByRole('tab', { name: 'Featured' })).toBeVisible()
      await expect(page).toHaveScreenshot('admin-featured.png', { fullPage: true })
    })

    test('admin — Users tab', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.getByRole('tab', { name: 'Users' }).click()
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Registration and admin roles' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('admin-users.png', { fullPage: true })
    })

    test('admin — taxonomy league (nba)', async ({ page }) => {
      await ensureDemoAdminSession(page)
      await waitForHydration(page)
      await page.goto('/admin/taxonomy/nba')
      await waitForHydration(page)
      await expect(page).toHaveURL(/\/admin\/taxonomy\/nba/)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('admin-taxonomy-league-nba.png', { fullPage: true })
    })
  })
})

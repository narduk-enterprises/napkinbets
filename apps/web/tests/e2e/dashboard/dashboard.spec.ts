import { expect, test, waitForHydration } from '../fixtures'
import { dashboardApplyFilter, loginAsDemo } from '../page-helpers'

test.describe('dashboard', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('authenticated home and dashboard render for the demo user', async ({ page }) => {
      await loginAsDemo(page, '/')
      await expect(
        page.getByRole('heading', { name: 'Start from a real game and keep the bet clear.' }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Bets already in motion' })).toBeVisible()

      await page.goto('/dashboard')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create Napkin' }).last()).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('home — authenticated', async ({ page }) => {
      await loginAsDemo(page, '/')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Start from a real game and keep the bet clear.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('home-authenticated.png', { fullPage: true })
    })

    test('dashboard — default', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-default.png', { fullPage: true })
    })

    test('dashboard — filter Settled', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await dashboardApplyFilter(page, 'Settled')
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-filter-settled.png', { fullPage: true })
    })

    test('dashboard — filter Upcoming', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await dashboardApplyFilter(page, 'Upcoming')
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-filter-upcoming.png', { fullPage: true })
    })

    test('dashboard — filter Live', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await dashboardApplyFilter(page, 'Live')
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-filter-live.png', { fullPage: true })
    })

    test('dashboard — filter Finished', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await dashboardApplyFilter(page, 'Finished')
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-filter-finished.png', { fullPage: true })
    })

    test('dashboard — filter Unsettled', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await dashboardApplyFilter(page, 'Unsettled')
      await expect(
        page.getByRole('heading', {
          name: 'Everything you started, joined, or still need to settle.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('dashboard-filter-unsettled.png', { fullPage: true })
    })
  })
})

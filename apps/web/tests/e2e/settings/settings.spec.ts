import { expect, test, waitForHydration } from '../fixtures'
import { DEMO_EMAIL, loginAsDemo } from '../page-helpers'

test.describe('settings', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('settings pages and authenticated create flow render for the demo user', async ({
      page,
    }) => {
      await loginAsDemo(page, '/settings')
      await expect(
        page.getByRole('heading', { name: 'Your account and preferences.' }),
      ).toBeVisible()
      await expect(page.getByLabel('Email')).toHaveValue(DEMO_EMAIL)

      await page.goto('/settings/payments')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', {
          name: 'Saved handles for smoother bet collection and settle-up.',
        }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Register a handle' })).toBeVisible()

      await page.goto('/napkins/create')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()
      await expect(page.getByText("What's the game?")).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('settings', async ({ page }) => {
      await loginAsDemo(page, '/settings')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Your account and preferences.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('settings.png', { fullPage: true })
    })

    test('settings — payments', async ({ page }) => {
      await loginAsDemo(page, '/settings/payments')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', {
          name: 'Saved handles for smoother bet collection and settle-up.',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('settings-payments.png', { fullPage: true })
    })

    test('settings — notifications', async ({ page }) => {
      await loginAsDemo(page, '/settings/notifications')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', {
          name: 'Notification Settings',
        }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('settings-notifications.png', { fullPage: true })
    })

    test('create napkin — authenticated', async ({ page }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()
      await expect(page.getByText("What's the game?")).toBeVisible()
      await expect(page).toHaveScreenshot('napkins-create-authenticated.png', { fullPage: true })
    })
  })
})

import { expect, test, waitForHydration } from '../fixtures'
import { loginAsDemo } from '../page-helpers'

test.describe('shell', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('friends, notifications, and ledger pages render for the demo user', async ({ page }) => {
      await loginAsDemo(page, '/friends')
      await expect(
        page.getByRole('heading', { name: 'Keep the people handy before you start the bet.' }),
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Friends ready for a one-on-one bet' }),
      ).toBeVisible()

      await page.goto('/groups')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Put the recurring room in one place.' }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Rooms you already belong to' })).toBeVisible()

      await page.goto('/notifications')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Everything that needs your attention.' }),
      ).toBeVisible()
      await expect(page.getByText('Saoirse is still pending')).toBeVisible()

      await page.goto('/ledger')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Who owes what, settled in one place.' }),
      ).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('friends', async ({ page }) => {
      await loginAsDemo(page, '/friends')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Keep the people handy before you start the bet.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('friends.png', { fullPage: true })
    })

    test('notifications', async ({ page }) => {
      await loginAsDemo(page, '/notifications')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Everything that needs your attention.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('notifications.png', { fullPage: true })
    })

    test('ledger', async ({ page }) => {
      await loginAsDemo(page, '/ledger')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Who owes what, settled in one place.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('ledger.png', { fullPage: true })
    })
  })
})

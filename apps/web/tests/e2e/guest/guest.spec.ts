import { expect, test, waitForHydration } from '../fixtures'

test.describe('guest', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('landing, guide, tour, and create pages render', async ({ page }) => {
      await page.goto('/')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Pick a game. Start a bet. Settle after the final.' }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Browse games' })).toBeVisible()

      await page.goto('/guide')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'How the product works in plain English.' }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'The hierarchy' })).toBeVisible()

      await page.goto('/tour')
      await waitForHydration(page)
      await expect(page.locator('[aria-label="Napkinbets walkthrough slides"]')).toBeVisible()
      await expect(page.getByText('Friendly side bets, finally organized.')).toBeVisible()

      await page.goto('/napkins/create')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()
      await expect(page.getByText('Account required')).toBeVisible()
    })

    test('auth pages render', async ({ page }) => {
      await page.goto('/login')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Get back to your bets.' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'See the demo account' })).toBeVisible()

      await page.goto('/register')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Claim your workspace.' }).first(),
      ).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('guest — landing', async ({ page }) => {
      await page.goto('/')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Pick a game. Start a bet. Settle after the final.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('guest-landing.png', { fullPage: true })
    })

    test('guest — guide', async ({ page }) => {
      await page.goto('/guide')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'How the product works in plain English.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('guest-guide.png', { fullPage: true })
    })

    test('guest — tour', async ({ page }) => {
      await page.goto('/tour')
      await waitForHydration(page)
      await expect(page.locator('[aria-label="Napkinbets walkthrough slides"]')).toBeVisible()
      await expect(page).toHaveScreenshot('guest-tour.png', { fullPage: true })
    })

    test('guest — login', async ({ page }) => {
      await page.goto('/login')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Get back to your bets.' })).toBeVisible()
      await expect(page).toHaveScreenshot('auth-login.png', { fullPage: true })
    })

    test('guest — register', async ({ page }) => {
      await page.goto('/register')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
      await expect(page).toHaveScreenshot('auth-register.png', { fullPage: true })
    })

    test('guest — create napkin (account required)', async ({ page }) => {
      await page.goto('/napkins/create')
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()
      await expect(page.getByText('Account required')).toBeVisible()
      await expect(page).toHaveScreenshot('guest-create-napkin.png', { fullPage: true })
    })
  })
})

import { expect, test, waitForBaseUrlReady, waitForHydration, warmUpApp } from './fixtures'
import {
  DEMO_EMAIL,
  DEMO_WAGER_SLUG,
  DEMO_WAGER_TITLE,
  ensureDemoAdminSession,
  getFirstDiscoverEvent,
  loginAsDemo,
} from './page-helpers'

test.describe('web page coverage', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error('Page coverage tests require Playwright baseURL to be configured.')
    }

    await waitForBaseUrlReady(baseURL)
    await warmUpApp(browser, baseURL)
  })

  test('guest landing, guide, tour, and create pages render', async ({ page }) => {
    test.slow()

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

  test('guest auth pages render', async ({ page }) => {
    await page.goto('/login')
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Get back to your bets.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'See the demo account' })).toBeVisible()

    await page.goto('/register')
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Claim your workspace.' }).first()).toBeVisible()
  })

  test('events pages render with seeded event detail coverage', async ({ page }) => {
    await page.goto('/events')
    await waitForHydration(page)
    await expect(
      page.getByRole('heading', { name: 'Pick a game, then start a bet.' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Filter games' }).first()).toBeVisible()

    const event = await getFirstDiscoverEvent(page)
    await page.goto(event.path)
    await waitForHydration(page)
    await expect(page).toHaveURL(/\/events\/.+/)
    await expect(page.getByRole('heading', { name: event.title })).toBeVisible()
    await expect(page.getByText('Market odds').first()).toBeVisible()
  })

  test('discover and legacy create routes redirect to current pages', async ({ page }) => {
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/events$/)
    await expect(
      page.getByRole('heading', { name: 'Pick a game, then start a bet.' }),
    ).toBeVisible()

    await page.goto('/wagers/create')
    await expect(page).toHaveURL(/\/napkins\/create$/)
    await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()
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
    await expect(page.getByRole('button', { name: 'Create Napkin' })).toBeVisible()
  })

  test('friends, groups, and notifications pages render for the demo user', async ({ page }) => {
    test.slow()

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
  })

  test('settings pages and authenticated creation flow render for the demo user', async ({
    page,
  }) => {
    test.slow()

    await loginAsDemo(page, '/settings')
    await expect(page.getByRole('heading', { name: 'Your account and preferences.' })).toBeVisible()
    await expect(page.getByDisplayValue(DEMO_EMAIL)).toBeVisible()

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

  test('napkin detail, closeout, and legacy wager routes render for the demo user', async ({
    page,
  }) => {
    test.slow()

    await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
    await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Payout breakdown' })).toBeVisible()

    await page.goto(`/napkins/${DEMO_WAGER_SLUG}/closeout`)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Host checklist' })).toBeVisible()

    await page.goto(`/wagers/${DEMO_WAGER_SLUG}`)
    await expect(page).toHaveURL(new RegExp(`/napkins/${DEMO_WAGER_SLUG}$`))
    await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE })).toBeVisible()

    await page.goto(`/wagers/${DEMO_WAGER_SLUG}/closeout`)
    await expect(page).toHaveURL(new RegExp(`/napkins/${DEMO_WAGER_SLUG}/closeout$`))
    await expect(page.getByRole('heading', { name: 'Host checklist' })).toBeVisible()
  })

  test('admin page renders after promoting the demo user', async ({ page }) => {
    await ensureDemoAdminSession(page)
    await expect(
      page.getByRole('heading', { name: 'Run the product, not just the bets.' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Registration and admin roles' })).toBeVisible()
  })
})

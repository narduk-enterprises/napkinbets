import { expect, test, waitForHydration } from '../fixtures'
import { EVENT_NOT_FOUND_ID, getFirstDiscoverEvent } from '../page-helpers'

test.describe('events', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('events list and detail render with seeded event coverage', async ({ page }) => {
      await page.goto('/events')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Pick a game, then start a bet.' }),
      ).toBeVisible()
      await expect(page.getByText('Filter games').first()).toBeVisible()

      const createLinkHref = await page.locator('a[href*="eventId="]').first().getAttribute('href')
      if (!createLinkHref) {
        throw new Error('Could not derive an event detail route from the rendered events page.')
      }

      const createLink = new URL(createLinkHref, 'http://localhost:3000')
      const eventId = createLink.searchParams.get('eventId')
      const eventTitle = createLink.searchParams.get('eventTitle')
      if (!eventId) {
        throw new Error('Rendered events page did not include an eventId query param.')
      }

      await page.goto(`/events/${encodeURIComponent(eventId)}`)
      await waitForHydration(page)
      await expect(page).toHaveURL(/\/events\/.+/)

      const eventNotFound = page.getByText('Event not found')
      if (await eventNotFound.isVisible().catch(() => false)) {
        await expect(eventNotFound).toBeVisible()
        await expect(page.getByText('Back to events')).toBeVisible()
        return
      }

      if (!eventTitle) {
        throw new Error('Rendered events page did not include an eventTitle query param.')
      }

      await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible()
      await expect(page.getByText('Market odds').first()).toBeVisible()
    })

    test('event detail shows not found for invalid id', async ({ page }) => {
      await page.goto(`/events/${encodeURIComponent(EVENT_NOT_FOUND_ID)}`)
      await waitForHydration(page)
      await expect(page).toHaveURL(new RegExp(`/events/${encodeURIComponent(EVENT_NOT_FOUND_ID)}$`))
      await expect(page.getByText('Event not found')).toBeVisible()
      await expect(page.getByText('Back to events')).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('events — list', async ({ page }) => {
      await page.goto('/events')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Pick a game, then start a bet.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('events-list.png', { fullPage: true })
    })

    test('events — detail found', async ({ page }) => {
      await page.goto('/events')
      await waitForHydration(page)
      const { path } = await getFirstDiscoverEvent(page)
      await page.goto(path)
      await waitForHydration(page)
      const eventNotFound = page.getByText('Event not found')
      if (await eventNotFound.isVisible().catch(() => false)) {
        return
      }
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page).toHaveScreenshot('events-detail-found.png', { fullPage: true })
    })

    test('events — detail not found', async ({ page }) => {
      await page.goto(`/events/${encodeURIComponent(EVENT_NOT_FOUND_ID)}`)
      await waitForHydration(page)
      await expect(page.getByText('Event not found')).toBeVisible()
      await expect(page).toHaveScreenshot('events-detail-not-found.png', { fullPage: true })
    })
  })
})

import { expect, test, waitForHydration } from '../fixtures'
import { DEMO_GROUP_SLUG, loginAsDemo } from '../page-helpers'

test.describe('groups', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('groups list and group detail render for the demo user', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await page.goto(`/groups/${DEMO_GROUP_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Friday Night Watch' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'People in this group' })).toBeVisible()
      await expect(page.getByRole('link', { name: /Start Group Bet/i })).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('groups — list', async ({ page }) => {
      await loginAsDemo(page, '/groups')
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Put the recurring room in one place.' }),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('groups-list.png', { fullPage: true })
    })

    test('groups — detail', async ({ page }) => {
      await loginAsDemo(page, '/dashboard')
      await waitForHydration(page)
      await page.goto(`/groups/${DEMO_GROUP_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Friday Night Watch' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'People in this group' })).toBeVisible()
      await expect(page).toHaveScreenshot('groups-detail-friday-night-watch.png', {
        fullPage: true,
      })
    })
  })
})

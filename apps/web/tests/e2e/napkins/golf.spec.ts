import { expect, test, waitForHydration } from '../fixtures'
import {
  DEMO_GOLF_LPGA_SLUG,
  DEMO_GOLF_PGA_LOCKED_SLUG,
  DEMO_GOLF_PGA_SLUG,
  loginAsDemo,
} from '../page-helpers'

/**
 * E2E coverage for golf-draft pools (PGA, LPGA). Depends on ensureSeedData
 * creating demo-golf-draft, demo-golf-pga-locked, demo-golf-lpga-open.
 */
test.describe('napkins — golf', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('golf PGA pool detail shows pots and golfer picks', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_PGA_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Weekend Golf Draft' }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Payout breakdown' })).toBeVisible()
      await expect(page.getByText('Draft winner').first()).toBeVisible()
      await expect(page.getByText('Low round').first()).toBeVisible()
    })

    test('golf LPGA pool detail shows title and LPGA or golf context', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_LPGA_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'LPGA Major Side Pot' }).first()).toBeVisible()
      await expect(page.getByText(/LPGA|golf/i).first()).toBeVisible()
    })

    test('golf PGA locked pool shows locked badge and picks', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_PGA_LOCKED_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'PGA Weekend Locked' }).first()).toBeVisible()
      await expect(page.getByText('locked').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Picks' })).toBeVisible()
      await expect(page.getByText('Scottie Scheffler').first()).toBeVisible()
    })

    test('golf LPGA pool settlement ledger shows Zelle', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_LPGA_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'LPGA Major Side Pot' }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Settlement ledger' })).toBeVisible()
      await expect(page.getByText('Zelle').first()).toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('napkin detail — golf LPGA', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_LPGA_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'LPGA Major Side Pot' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-golf-lpga.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — golf PGA locked', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_GOLF_PGA_LOCKED_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'PGA Weekend Locked' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-golf-pga-locked.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  })
})

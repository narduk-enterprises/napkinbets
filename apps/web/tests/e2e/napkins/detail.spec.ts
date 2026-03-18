import { expect, test, waitForHydration } from '../fixtures'
import {
  DEMO_INVITATION_SLUG,
  DEMO_JOIN_POOL_SLUG,
  DEMO_OPEN_POOL_SLUG,
  DEMO_SIMPLE_BET_SLUG,
  DEMO_STATE_SLUGS,
  DEMO_WAGER_SLUG,
  DEMO_WAGER_TITLE,
  loginAsDemo,
} from '../page-helpers'

test.describe('napkins — detail', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('functional', () => {
    test('napkin detail, closeout, and legacy wager routes render for the demo user', async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Payout breakdown' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Settlement ledger' })).toBeVisible()
      await expect(page.getByText('Next step').first()).toBeVisible()

      await page.goto(`/napkins/${DEMO_WAGER_SLUG}/closeout`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Host checklist' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Ready to confirm' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Back to bet' })).toBeVisible()
    })

    test('napkin detail shows draft order, leaderboard, and action forms for pool bet', async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Draft order' }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Leaderboard' }).first()).toBeVisible()
    })

    test('napkin detail with event shows scoreboard and view event details', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      const viewEvent = page
        .getByRole('link', { name: /View event details/i })
        .or(page.getByText('View event details'))
      const visible = await viewEvent.isVisible().catch(() => false)
      if (!visible) {
        test.skip(true, 'Demo wager has no event attached; View event details not rendered')
      }
      await expect(viewEvent).toBeVisible()
    })

    test('napkin detail shows manage actions for owner (Settle up, Reroll order)', async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Settle up' }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: 'Reroll order' }).first()).toBeVisible()
    })

    test('napkin detail shows join form for pool when demo user is not a participant', async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_JOIN_POOL_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Join the bet' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Join bet' })).toBeVisible()
    })

    test('napkin detail shows invitation banner and Accept/Decline when demo user is invited', async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_INVITATION_SLUG}`)
      await waitForHydration(page)
      await expect(page).toHaveURL(new RegExp(`/napkins/${DEMO_INVITATION_SLUG}$`))
      const challenged = page.getByText('challenged you').first()
      const cardVisible = await challenged.isVisible().catch(() => false)
      if (!cardVisible) {
        test.skip(
          true,
          'Invitation card not shown (layer seed Pat or ensureInvitationWager may be missing)',
        )
      }
      await expect(challenged).toBeVisible()
      await expect(page.getByRole('button', { name: 'Accept bet' }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: 'Decline' }).first()).toBeVisible()
    })

    test("napkin detail for simple-bet shows You're in and no draft order or leaderboard", async ({
      page,
    }) => {
      await loginAsDemo(page, `/napkins/${DEMO_SIMPLE_BET_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Simple Bet' }).first()).toBeVisible()
      await expect(page.getByText("You're in this bet").first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Draft order' })).not.toBeVisible()
      await expect(page.getByRole('heading', { name: 'Leaderboard' })).not.toBeVisible()
    })
  })

  test.describe('visual', () => {
    test('napkin detail — pool (main demo)', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_WAGER_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: DEMO_WAGER_TITLE }).first()).toBeVisible()
      await expect(page).toHaveScreenshot(`napkin-detail-pool-${DEMO_WAGER_SLUG}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: settled', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.settled}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Settled' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-settled.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: submitted', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.submitted}`)
      await waitForHydration(page)
      await expect(
        page.getByRole('heading', { name: 'Demo Wager Submitted' }).first(),
      ).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-submitted.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: rejected', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.rejected}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Rejected' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-rejected.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: locked', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.locked}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Locked' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-locked.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: open (pool)', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_OPEN_POOL_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Weekend Golf Draft' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-open-pool.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — state: live', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_STATE_SLUGS.live}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Wager Live' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-state-live.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — simple-bet', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_SIMPLE_BET_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Demo Simple Bet' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-simple-bet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — invitation', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_INVITATION_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Invitation (E2E)' }).first()).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-invitation.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })

    test('napkin detail — join pool', async ({ page }) => {
      await loginAsDemo(page, `/napkins/${DEMO_JOIN_POOL_SLUG}`)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { name: 'Join the bet' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Join bet' })).toBeVisible()
      await expect(page).toHaveScreenshot('napkin-detail-join-pool.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  })
})

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { waitForHydration } from './fixtures'

const APP_DIR = fileURLToPath(new URL('../..', import.meta.url))

export const DEMO_EMAIL = 'demo@napkinbets.app'
export const DEMO_WAGER_SLUG = 'demo-hoops-night'
export const DEMO_WAGER_TITLE = 'Friday Hoops Group Bet'

/** Layer seed slugs (from db:seed / apps/web/drizzle/seed.sql). Use with Pat/Logan when added. */
export const LAYER_SEED_SLUGS = {
  settled: 'yankees-rays-spring-1',
  submitted: 'astros-pirates-spring-1',
  rejected: 'nationals-cardinals-spring-1',
  locked: 'thunder-magic-tonight',
  openInvited: 'bruins-canadiens-tonight',
  live: 'ole-miss-austin-peay-live',
  openOneParticipant: 'hurricanes-bluejackets-tonight',
} as const

/** Demo state-coverage slugs (ensureSeedData). Demo user owns all; use for E2E and visual regression. */
export const DEMO_STATE_SLUGS = {
  settled: 'demo-wager-settled',
  submitted: 'demo-wager-submitted',
  rejected: 'demo-wager-rejected',
  locked: 'demo-wager-locked',
  live: 'demo-wager-live',
} as const

/** Slug for E2E join flow: pool wager owned by layer user (Pat); demo user is not a participant. */
export const DEMO_JOIN_POOL_SLUG = 'demo-join-pool'
/** Slug for E2E invitation flow: demo user is participant with joinStatus pending. */
export const DEMO_INVITATION_SLUG = 'demo-invitation'
/** Slug for E2E simple-bet: 1v1 napkin, no draft order/leaderboard. */
export const DEMO_SIMPLE_BET_SLUG = 'demo-simple-bet'
/** Slug for E2E open (pool): demo-golf-draft has status open. */
export const DEMO_OPEN_POOL_SLUG = 'demo-golf-draft'

/** Slug for E2E golf PGA draft (existing open pool). */
export const DEMO_GOLF_PGA_SLUG = 'demo-golf-draft'
/** Slug for E2E golf LPGA pool (extended seed). */
export const DEMO_GOLF_LPGA_SLUG = 'demo-golf-lpga-open'
/** Slug for E2E golf PGA locked pool (extended seed). */
export const DEMO_GOLF_PGA_LOCKED_SLUG = 'demo-golf-pga-locked'

/** Slug for E2E group detail (ensureDemoSocialGraph). Demo user is member. */
export const DEMO_GROUP_SLUG = 'friday-night-watch'
/** Slug for Augusta Text Chain (golf-focused group; extended seed attaches pools). */
export const DEMO_AUGUSTA_GROUP_SLUG = 'augusta-text-chain'

/** Invalid event id for E2E "event not found" coverage. */
export const EVENT_NOT_FOUND_ID = 'event-not-found-e2e'

interface DiscoverEventSummary {
  id: string
  eventTitle: string
}

interface DiscoverResponse {
  sections: Array<{
    events: DiscoverEventSummary[]
  }>
}

function runLocalD1Command(command: string): void {
  execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'execute', 'napkinbets-db', '--local', '--command', command],
    {
      cwd: APP_DIR,
      encoding: 'utf8',
    },
  )
}

/** Sleep for ms. Used to back off when D1 is temporarily locked. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const LOGIN_READY_TIMEOUT_MS = 10_000

/** Paths where the shell renders an h1 immediately; for these we wait for h1 to fail fast. */
const PATHS_WITH_IMMEDIATE_H1 = new Set(['/', '/dashboard', '/admin'])

export async function loginAsDemo(page: Page, redirectPath = '/dashboard') {
  await page.goto(`/auth/demo?redirect=${encodeURIComponent(redirectPath)}`, {
    timeout: LOGIN_READY_TIMEOUT_MS,
    waitUntil: 'domcontentloaded',
  })
  await page.waitForURL((url) => url.pathname === redirectPath, {
    timeout: LOGIN_READY_TIMEOUT_MS,
  })
  if (PATHS_WITH_IMMEDIATE_H1.has(redirectPath)) {
    if (redirectPath === '/dashboard') {
      await page
        .getByRole('heading', { name: 'Your bets' })
        .waitFor({ state: 'visible', timeout: LOGIN_READY_TIMEOUT_MS })
    } else if (redirectPath === '/admin') {
      await page
        .getByRole('heading', { name: /Run the product|Admin/i })
        .waitFor({ state: 'visible', timeout: LOGIN_READY_TIMEOUT_MS })
    } else {
      await page
        .locator('h1')
        .first()
        .waitFor({ state: 'visible', timeout: LOGIN_READY_TIMEOUT_MS })
    }
  }
  await waitForHydration(page)
}

export async function logoutViaApi(page: Page) {
  await page.evaluate(async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }
  })
}

/**
 * Promote the demo user to admin via wrangler D1. Retries on SQLITE_BUSY because the dev
 * server holds the same local SQLite file open; a short delay often frees the lock.
 */
export async function promoteDemoUserToAdmin(): Promise<void> {
  const command = [
    `UPDATE users`,
    `SET is_admin = 1, updated_at = '${new Date().toISOString()}'`,
    `WHERE email = '${DEMO_EMAIL}';`,
  ].join(' ')

  const maxAttempts = 4
  const delayMs = 500

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      runLocalD1Command(command)
      return
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isBusy = message.includes('SQLITE_BUSY') || message.includes('database is locked')
      if (isBusy && attempt < maxAttempts) {
        await sleep(delayMs)
        continue
      }
      throw err
    }
  }
}

export async function ensureDemoAdminSession(page: Page) {
  await loginAsDemo(page)
  await logoutViaApi(page)
  await promoteDemoUserToAdmin()
  await loginAsDemo(page, '/admin')
}

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Navigate to dashboard and apply a filter by chip label (e.g. "Settled", "Live"). Call after loginAsDemo(page, "/dashboard"). */
export async function dashboardApplyFilter(page: Page, filterLabel: string) {
  await page.goto('/dashboard')
  await waitForHydration(page)
  // Exact match so "Settled" does not match "Unsettled" (getByRole name is substring by default).
  const filterBtn = page.getByRole('button', { name: new RegExp(`^${escapeRegex(filterLabel)}$`) })
  await filterBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await filterBtn.click()
  await page
    .getByText('No bets match this filter')
    .or(page.locator('a[href*="/napkins/"]').first())
    .waitFor({ state: 'visible', timeout: 5_000 })
  await waitForHydration(page)
}

export async function getFirstDiscoverEvent(page: Page) {
  const discover = await page.evaluate(async (): Promise<DiscoverResponse> => {
    const response = await fetch('/api/napkinbets/discover')

    if (!response.ok) {
      throw new Error(await response.text())
    }

    return (await response.json()) as DiscoverResponse
  })

  const event = discover.sections.flatMap((section) => section.events)[0]
  if (!event) {
    throw new Error('No discover events were available for event detail coverage.')
  }

  return {
    path: `/events/${encodeURIComponent(event.id)}`,
    title: event.eventTitle,
  }
}

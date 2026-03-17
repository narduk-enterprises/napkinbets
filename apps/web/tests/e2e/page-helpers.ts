import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { waitForHydration } from './fixtures'

const APP_DIR = fileURLToPath(new URL('../..', import.meta.url))

export const DEMO_EMAIL = 'demo@napkinbets.app'
export const DEMO_WAGER_SLUG = 'demo-hoops-night'
export const DEMO_WAGER_TITLE = 'Friday Hoops Group Bet'

interface DiscoverEventSummary {
  id: string
  eventTitle: string
}

interface DiscoverResponse {
  sections: Array<{
    events: DiscoverEventSummary[]
  }>
}

function runLocalD1Command(command: string) {
  return execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'execute', 'napkinbets-db', '--local', '--command', command],
    {
      cwd: APP_DIR,
      encoding: 'utf8',
    },
  )
}

export async function loginAsDemo(page: Page, redirectPath = '/dashboard') {
  await page.goto(`/auth/demo?redirect=${encodeURIComponent(redirectPath)}`, {
    timeout: 15_000,
    waitUntil: 'domcontentloaded',
  })
  await page.waitForURL((url) => url.pathname === redirectPath, { timeout: 15_000 })
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

export function promoteDemoUserToAdmin() {
  runLocalD1Command(
    [
      `UPDATE users`,
      `SET is_admin = 1, updated_at = '${new Date().toISOString()}'`,
      `WHERE email = '${DEMO_EMAIL}';`,
    ].join(' '),
  )
}

export async function ensureDemoAdminSession(page: Page) {
  await loginAsDemo(page)
  await logoutViaApi(page)
  promoteDemoUserToAdmin()
  await loginAsDemo(page, '/admin')
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

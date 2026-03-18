/**
 * External bucket: admin/cron endpoints that call:
 * - Polymarket (gamma-api.polymarket.com), The Odds API (api.the-odds-api.com)
 * - ESPN (site.api.espn.com, site.web.api.espn.com) for ingest and PGA sync
 * - API-Sports for taxonomy/league entity sync
 * Run with pnpm test:integration:external. Asserts auth/contract without hitting 3rd party.
 */
import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { mutationHeaders } from '../helpers/headers'

describe('API admin/cron external (Polymarket, Odds API, ESPN, API-Sports)', () => {
  it('POST /api/napkinbets/admin/odds requires admin (Polymarket + The Odds API)', async () => {
    const err = await apiFetch('/api/napkinbets/admin/odds', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403]).toContain(code)
  })

  it('POST /api/napkinbets/admin/ingest requires admin (ESPN event ingest)', async () => {
    const err = await apiFetch('/api/napkinbets/admin/ingest', {
      method: 'POST',
      headers: mutationHeaders(),
      body: { tier: 'next-48h' },
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403, 400]).toContain(code)
  })

  it('POST /api/napkinbets/admin/taxonomy/leagues/[key]/sync requires admin (API-Sports)', async () => {
    const err = await apiFetch('/api/napkinbets/admin/taxonomy/leagues/nfl/sync', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403, 400, 404, 429]).toContain(code)
  })

  it('POST /api/admin/napkinbets/sync-pga-players requires admin (ESPN Golf)', async () => {
    const err = await apiFetch('/api/admin/napkinbets/sync-pga-players', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403]).toContain(code)
  })

  it('POST /api/cron/napkinbets/events requires cron secret (ESPN ingest)', async () => {
    const err = await apiFetch('/api/cron/napkinbets/events', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403, 400, 404]).toContain(code)
  })

  it('POST /api/cron/napkinbets/odds requires cron secret (Polymarket)', async () => {
    const err = await apiFetch('/api/cron/napkinbets/odds', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403, 400]).toContain(code)
  })
})

/**
 * External bucket: endpoints that call:
 * - Polymarket (gamma-api.polymarket.com) for event-level odds refresh
 * - Venmo (venmo.com) for payment profile handle verification
 * Run with pnpm test:integration:external. Tests use non-existent IDs to assert contract without 3rd party calls.
 */
import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'
import { mutationHeaders } from '../helpers/headers'
import { encodeRouteId } from '../../../shared/utils/route-id'

describe('API events odds refresh (Polymarket)', () => {
  it('POST /api/napkinbets/events/:id/odds/refresh returns 404 for non-existent event', async () => {
    const encodedId = encodeRouteId('espn:mlb:nonexistent')
    const err = await apiFetch(`/api/napkinbets/events/${encodedId}/odds/refresh`, {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(404)
  })
})

describe('API payment profile verify (Venmo)', () => {
  it('POST /api/napkinbets/me/payment-profiles/:id/verify requires auth', async () => {
    const err = await apiFetch(
      '/api/napkinbets/me/payment-profiles/00000000-0000-0000-0000-000000000000/verify',
      {
        method: 'POST',
        headers: mutationHeaders(),
        body: {},
      },
    ).catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('POST /api/napkinbets/me/payment-profiles/:id/verify returns 404 for non-existent profile', async () => {
    const { headers } = await getDemoAuthHeaders()
    const err = await apiFetch(
      '/api/napkinbets/me/payment-profiles/00000000-0000-0000-0000-000000000000/verify',
      {
        method: 'POST',
        headers,
        body: {},
      },
    ).catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(404)
  })
})

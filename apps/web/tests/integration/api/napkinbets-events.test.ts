import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { encodeRouteId } from '../../../shared/utils/route-id'

describe('API napkinbets events', () => {
  it('GET /api/napkinbets/events/:id returns 404 for non-existent event', async () => {
    const encodedId = encodeRouteId('espn:mlb:nonexistent')
    const err = await apiFetch(`/api/napkinbets/events/${encodedId}`).catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(404)
  })
})

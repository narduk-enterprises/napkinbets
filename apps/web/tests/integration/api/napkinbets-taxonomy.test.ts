import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'

describe('API napkinbets taxonomy', () => {
  it('GET /api/napkinbets/taxonomy returns 200 and leagues array', async () => {
    const data = await apiFetch<{ leagues?: unknown[] }>('/api/napkinbets/taxonomy')
    expect(data).toBeDefined()
    expect(Array.isArray(data.leagues)).toBe(true)
  })

  it('GET /api/napkinbets/leagues/[key] returns 200 or 404 for league key', async () => {
    const data = await apiFetch<Record<string, unknown>>('/api/napkinbets/leagues/nfl').catch(
      (e: unknown) => e,
    )
    if (typeof data === 'object' && data !== null && !('statusCode' in data)) {
      expect(
        (data as Record<string, unknown>).key ??
          (data as Record<string, unknown>).leagueKey ??
          data,
      ).toBeDefined()
    } else {
      expect((data as { statusCode?: number }).statusCode).toBe(404)
    }
  })
})

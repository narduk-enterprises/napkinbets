import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets friends', () => {
  it('GET /api/napkinbets/friends returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/friends').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/friends returns 200 with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<unknown>('/api/napkinbets/friends', { headers })
    expect(data).toBeDefined()
    expect(Array.isArray(data) || (typeof data === 'object' && data !== null)).toBe(true)
  })
})

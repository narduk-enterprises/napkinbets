import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets groups', () => {
  it('GET /api/napkinbets/groups returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/groups').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/groups returns 200 with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<unknown>('/api/napkinbets/groups', { headers })
    expect(data).toBeDefined()
    expect(Array.isArray(data) || (typeof data === 'object' && data !== null)).toBe(true)
  })
})

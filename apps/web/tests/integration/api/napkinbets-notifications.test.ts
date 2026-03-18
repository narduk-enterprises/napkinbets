import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets notifications', () => {
  it('GET /api/napkinbets/notifications returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/notifications').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/notifications returns 200 with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<unknown>('/api/napkinbets/notifications', { headers })
    expect(data).toBeDefined()
    expect(Array.isArray(data) || (typeof data === 'object' && data !== null)).toBe(true)
  })
})

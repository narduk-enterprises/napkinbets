import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets me', () => {
  it('GET /api/napkinbets/me/profile returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/me/profile').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/me/profile returns 200 and user with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<{ id: string; email: string; name: string }>(
      '/api/napkinbets/me/profile',
      { headers },
    )
    expect(data).toBeDefined()
    expect(data.email).toBe('demo@napkinbets.app')
    expect(typeof data.name).toBe('string')
  })

  it('GET /api/napkinbets/workspace returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/workspace').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/workspace returns 200 with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<unknown>('/api/napkinbets/workspace', { headers })
    expect(data).toBeDefined()
  })
})

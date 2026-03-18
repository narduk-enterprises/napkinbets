import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'
import { mutationHeaders } from '../helpers/headers'

describe('API auth', () => {
  it('GET /api/auth/me returns 200 with null user when unauthenticated', async () => {
    const data = await apiFetch<{ user: unknown }>('/api/auth/me')
    expect(data.user).toBeNull()
  })

  it('POST /api/auth/demo-login returns 200 and user shape', async () => {
    const data = await apiFetch<{ user: { id: string; email: string; name: string } }>(
      '/api/auth/demo-login',
      {
        method: 'POST',
        headers: mutationHeaders(),
      },
    )
    expect(data).toBeDefined()
    expect(data.user).toBeDefined()
    expect(typeof data.user.id).toBe('string')
    expect(typeof data.user.email).toBe('string')
    expect(typeof data.user.name).toBe('string')
  })

  it('GET /api/auth/me returns 200 and user after demo-login', async () => {
    const { headers } = await getDemoAuthHeaders()
    const me = await apiFetch<{ user: { id: string; email: string } }>('/api/auth/me', { headers })
    expect(me.user).toBeDefined()
    expect(typeof me.user.id).toBe('string')
    expect(me.user.email).toBe('demo@napkinbets.app')
  })

  it('POST /api/auth/logout returns 200', async () => {
    const { headers } = await getDemoAuthHeaders()
    await apiFetch('/api/auth/logout', { method: 'POST', headers })
    expect(true).toBe(true)
  })
})

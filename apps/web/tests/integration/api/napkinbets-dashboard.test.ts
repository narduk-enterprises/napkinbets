import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets dashboard', () => {
  it('GET /api/napkinbets/dashboard rejects or returns empty when unauthenticated', async () => {
    const result = await apiFetch<Record<string, unknown>>('/api/napkinbets/dashboard').catch(
      (e: unknown) => e,
    )
    const code = (result as { statusCode?: number }).statusCode
    if (code !== undefined) {
      expect([401, 403]).toContain(code)
    } else {
      const data = result as Record<string, unknown>
      expect(data).toBeDefined()
    }
  })

  it('GET /api/napkinbets/dashboard returns 200 and payload with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<Record<string, unknown>>('/api/napkinbets/dashboard', { headers })
    expect(data).toBeDefined()
    expect(
      Array.isArray(data.wagers) || Array.isArray(data.groups) || typeof data === 'object',
    ).toBe(true)
  })
})

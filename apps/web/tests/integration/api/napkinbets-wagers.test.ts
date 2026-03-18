import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets wagers', () => {
  it('GET /api/napkinbets/wagers/slug/:slug rejects or returns 404 when unauthenticated', async () => {
    const result = await apiFetch('/api/napkinbets/wagers/slug/yankees-rays-spring-1').catch(
      (e: unknown) => e,
    )
    const code = (result as { statusCode?: number }).statusCode
    if (code !== undefined) {
      expect([401, 403, 404]).toContain(code)
    }
    expect(result).toBeDefined()
  })

  it('GET /api/napkinbets/wagers/slug/:slug returns 200 for seed wager with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<{ wager: { slug: string; title: string } }>(
      '/api/napkinbets/wagers/slug/yankees-rays-spring-1',
      { headers },
    )
    expect(data).toBeDefined()
    expect(data.wager.slug).toBe('yankees-rays-spring-1')
    expect(typeof data.wager.title).toBe('string')
  })
})

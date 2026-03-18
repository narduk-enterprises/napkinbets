import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkinbets settings', () => {
  it('GET /api/napkinbets/settings/notifications returns 401 when unauthenticated', async () => {
    const err = await apiFetch('/api/napkinbets/settings/notifications').catch((e: unknown) => e)
    expect((err as { statusCode?: number }).statusCode).toBe(401)
  })

  it('GET /api/napkinbets/settings/notifications returns 200 and settings with auth', async () => {
    const { headers } = await getDemoAuthHeaders()
    const data = await apiFetch<{ notifyWagerUpdates?: boolean }>(
      '/api/napkinbets/settings/notifications',
      { headers },
    )
    expect(data).toBeDefined()
    expect(typeof (data as { notifyWagerUpdates?: boolean }).notifyWagerUpdates).toBe('boolean')
  })
})

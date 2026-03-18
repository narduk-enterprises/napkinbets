import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'

describe('API health and users', () => {
  it('GET /api/health returns 200', async () => {
    const data = await apiFetch<{ success?: boolean; data?: { status?: string } }>('/api/health')
    expect(data).toBeDefined()
    expect(data.data?.status).toBe('ok')
  })

  it('GET /api/users returns 200 and array', async () => {
    const data = await apiFetch<unknown[]>('/api/users')
    expect(Array.isArray(data)).toBe(true)
  })
})

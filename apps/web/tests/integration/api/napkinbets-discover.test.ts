import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'

describe('API napkinbets discover', () => {
  it('GET /api/napkinbets/discover returns 200', async () => {
    const data = await apiFetch<unknown>('/api/napkinbets/discover')
    expect(data).toBeDefined()
    expect(data !== null && (Array.isArray(data) || typeof data === 'object')).toBe(true)
  })
})

/**
 * External bucket: endpoints that call xAI/Grok (api.x.ai).
 * Run with pnpm test:integration:external.
 * These tests assert contract/error shape without requiring real API keys (403/503 when disabled).
 */
import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'
import { mutationHeaders } from '../helpers/headers'

describe('API napkinbets AI / xAI Grok (external)', () => {
  it('GET /api/napkinbets/admin/ai-model-settings requires admin', async () => {
    const err = await apiFetch('/api/napkinbets/admin/ai-model-settings').catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403]).toContain(code)
  })

  it('POST /api/napkinbets/ai/terms requires auth and returns 403/503 when AI disabled or no key', async () => {
    const { headers } = await getDemoAuthHeaders()
    const err = await apiFetch('/api/napkinbets/ai/terms', {
      method: 'POST',
      headers,
      body: {
        title: 'Test',
        description: 'Test',
        format: 'head-to-head',
        paymentService: 'Venmo',
        terms: 'Test terms',
      },
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([400, 403, 503]).toContain(code)
  })

  it('POST /api/napkinbets/ai/generate-napkin requires auth and returns 403/503 when AI disabled or no key', async () => {
    const { headers } = await getDemoAuthHeaders()
    const err = await apiFetch('/api/napkinbets/ai/generate-napkin', {
      method: 'POST',
      headers,
      body: {
        messages: [{ role: 'user', content: 'One sentence bet idea.' }],
      },
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([400, 403, 503]).toContain(code)
  })

  it('POST /api/napkinbets/ai/closeout-summary requires auth and returns 403/503 when AI disabled or no key', async () => {
    const { headers } = await getDemoAuthHeaders()
    const err = await apiFetch('/api/napkinbets/ai/closeout-summary', {
      method: 'POST',
      headers,
      body: {
        wagerTitle: 'Test',
        terms: 'Friendly bet.',
        paymentService: 'Venmo',
        winnerName: 'Alice',
        loserName: 'Bob',
      },
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([400, 403, 503]).toContain(code)
  })

  it('POST /api/napkinbets/admin/importance requires admin', async () => {
    const err = await apiFetch('/api/napkinbets/admin/importance', {
      method: 'POST',
      headers: mutationHeaders(),
      body: {},
    }).catch((e: unknown) => e)
    const code = (err as { statusCode?: number }).statusCode
    expect([401, 403]).toContain(code)
  })
})

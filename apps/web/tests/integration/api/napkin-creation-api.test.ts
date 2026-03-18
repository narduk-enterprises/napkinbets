import { describe, it, expect } from 'vitest'
import { apiFetch } from '../helpers/fetch'
import { getDemoAuthHeaders } from '../helpers/auth'

describe('API napkin creation and AI', () => {
  describe('1) AI Status', () => {
    it('GET /api/napkinbets/ai/status returns { aiEnabled: boolean }', async () => {
      const data = await apiFetch<{ aiEnabled: boolean }>('/api/napkinbets/ai/status')
      expect(data).toBeDefined()
      expect(typeof data.aiEnabled).toBe('boolean')
    })
  })

  describe('2) Generate Napkin', () => {
    it('POST /api/napkinbets/ai/generate-napkin returns 400 for empty messages', async () => {
      const { headers } = await getDemoAuthHeaders()
      const err = await apiFetch('/api/napkinbets/ai/generate-napkin', {
        method: 'POST',
        headers,
        body: { messages: [] },
      }).catch((e: unknown) => e)
      expect((err as { statusCode?: number }).statusCode).toBe(400)
    })

    it('POST /api/napkinbets/ai/generate-napkin returns 401 when unauthenticated', async () => {
      const err = await apiFetch('/api/napkinbets/ai/generate-napkin', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: { messages: [{ role: 'user', content: 'One sentence bet.' }] },
      }).catch((e: unknown) => e)
      expect((err as { statusCode?: number }).statusCode).toBe(401)
    })

    it('POST /api/napkinbets/ai/generate-napkin with auth returns 200 with shape or 403/503 when AI disabled', async () => {
      const { headers } = await getDemoAuthHeaders()
      const result = await apiFetch<{
        title?: string
        description?: string
        category?: string
        format?: string
        sideOptions?: string[]
        terms?: string
        legs?: unknown[]
        participants?: string[]
        message?: string
      }>('/api/napkinbets/ai/generate-napkin', {
        method: 'POST',
        headers,
        body: { messages: [{ role: 'user', content: 'A $5 bet on who finishes dessert first.' }] },
      }).catch((e: unknown) => e)

      const code = (result as { statusCode?: number }).statusCode
      if (code !== undefined) {
        expect([403, 503]).toContain(code)
        return
      }
      const body = result as {
        title: string
        description: string
        category: string
        format: string
        sideOptions: string[]
        terms: string
        legs: unknown[]
        participants: string[]
        message: string
      }
      expect(typeof body.title).toBe('string')
      expect(typeof body.description).toBe('string')
      expect(typeof body.category).toBe('string')
      expect(typeof body.format).toBe('string')
      expect(Array.isArray(body.sideOptions)).toBe(true)
      expect(typeof body.terms).toBe('string')
      expect(Array.isArray(body.legs)).toBe(true)
      expect(Array.isArray(body.participants)).toBe(true)
      expect(typeof body.message).toBe('string')
    }, 30_000)
  })

  describe('3) Suggest Legs', () => {
    it('POST /api/napkinbets/ai/suggest-legs returns 400 when title is missing', async () => {
      const { headers } = await getDemoAuthHeaders()
      const err = await apiFetch('/api/napkinbets/ai/suggest-legs', {
        method: 'POST',
        headers,
        body: { format: 'custom-prop' },
      }).catch((e: unknown) => e)
      expect((err as { statusCode?: number }).statusCode).toBe(400)
    })

    it('POST /api/napkinbets/ai/suggest-legs returns 401 when unauthenticated', async () => {
      const err = await apiFetch('/api/napkinbets/ai/suggest-legs', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: { title: 'Test bet', format: 'custom-prop' },
      }).catch((e: unknown) => e)
      expect((err as { statusCode?: number }).statusCode).toBe(401)
    })

    it('POST /api/napkinbets/ai/suggest-legs with auth returns 200 with legs or 403/503', async () => {
      const { headers } = await getDemoAuthHeaders()
      const result = await apiFetch<{
        legs?: Array<{
          questionText: string
          legType: string
          options: string[]
          numericUnit: string | null
        }>
      }>('/api/napkinbets/ai/suggest-legs', {
        method: 'POST',
        headers,
        body: {
          title: 'Weekend watch party',
          format: 'custom-prop',
          existingLegs: [{ questionText: 'Who brings chips?' }],
          eventContext: {
            eventTitle: 'Game night',
            sport: 'basketball',
            league: 'nba',
          },
        },
      }).catch((e: unknown) => e)

      const code = (result as { statusCode?: number }).statusCode
      if (code !== undefined) {
        expect([403, 503]).toContain(code)
        return
      }
      const body = result as {
        legs: Array<{
          questionText: string
          legType: string
          options: string[]
          numericUnit: string | null
        }>
      }
      expect(Array.isArray(body.legs)).toBe(true)
      for (const leg of body.legs) {
        expect(typeof leg.questionText).toBe('string')
        expect(['categorical', 'numeric']).toContain(leg.legType)
        expect(Array.isArray(leg.options)).toBe(true)
        expect(leg.numericUnit === null || typeof leg.numericUnit === 'string').toBe(true)
      }
    }, 30_000)
  })

  describe('4) Wager creation with legs', () => {
    it('POST /api/napkinbets/wagers with napkinType pool and legs creates wager', async () => {
      const { headers } = await getDemoAuthHeaders()
      const body = {
        title: 'Integration test pool with legs',
        creatorName: 'Demo User',
        description: 'A friendly group bet for integration testing with multiple legs.',
        napkinType: 'pool',
        boardType: 'community-created',
        format: 'custom-prop',
        sport: 'basketball',
        contextKey: 'community',
        league: '',
        customContextName: 'Test',
        groupId: '',
        sideOptions: 'Side A\nSide B',
        participantNames: 'Alice\nBob',
        participantSeeds: [
          { displayName: 'Demo User', userId: null },
          { displayName: 'Alice', userId: null },
          { displayName: 'Bob', userId: null },
        ],
        shuffleParticipants: true,
        potRules: 'Winner: 100',
        entryFeeDollars: 5,
        paymentService: 'Venmo',
        paymentHandle: '@test',
        venueName: 'Group chat',
        latitude: '',
        longitude: '',
        terms: 'Friendly bets only. Venmo settlement happens manually.',
        legs: [
          {
            questionText: 'Who wins the first round?',
            legType: 'categorical' as const,
            options: ['Team A', 'Team B'],
          },
          {
            questionText: 'Total points?',
            legType: 'numeric' as const,
            options: [],
            numericUnit: 'pts',
          },
        ],
      }
      const data = await apiFetch<{ ok?: boolean; wagerId?: string; slug?: string }>(
        '/api/napkinbets/wagers',
        {
          method: 'POST',
          headers,
          body,
        },
      )
      expect(data).toBeDefined()
      expect(data.ok).toBe(true)
      expect(typeof data.wagerId).toBe('string')
      expect(typeof data.slug).toBe('string')

      const slugData = await apiFetch<{ wager: { slug: string; legs?: unknown[] } }>(
        `/api/napkinbets/wagers/slug/${data.slug}`,
        { headers },
      )
      expect(slugData.wager.slug).toBe(data.slug)
      if (slugData.wager.legs) {
        expect(slugData.wager.legs.length).toBe(2)
      }
    })
  })

  describe('5) AI Settings', () => {
    it('POST /api/napkinbets/admin/ai-settings returns 401/403 without admin', async () => {
      const { headers } = await getDemoAuthHeaders()
      const err = await apiFetch('/api/napkinbets/admin/ai-settings', {
        method: 'POST',
        headers,
        body: {
          aiRecommendationsEnabled: true,
          aiPropSuggestionsEnabled: true,
          aiTermsAssistEnabled: true,
          aiCloseoutAssistEnabled: true,
        },
      }).catch((e: unknown) => e)
      const code = (err as { statusCode?: number }).statusCode
      expect([401, 403]).toContain(code)
    })
  })
})

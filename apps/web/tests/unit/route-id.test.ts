import { describe, expect, it } from 'vitest'
import { encodeRouteId, decodeRouteId } from '../../shared/utils/route-id'

describe('route-id encoding', () => {
  it('roundtrips a simple ID', () => {
    const id = 'abc123'
    expect(decodeRouteId(encodeRouteId(id))).toBe(id)
  })

  it('roundtrips IDs with colons (ESPN format)', () => {
    const id = 'espn:nba:401584721'
    expect(decodeRouteId(encodeRouteId(id))).toBe(id)
  })

  it('roundtrips IDs with brackets', () => {
    const id = 'event[2024]:game{1}'
    expect(decodeRouteId(encodeRouteId(id))).toBe(id)
  })

  it('roundtrips IDs with slashes', () => {
    const id = 'league/season/game/123'
    expect(decodeRouteId(encodeRouteId(id))).toBe(id)
  })

  it('produces URL-safe output (no +, /, or =)', () => {
    // Use IDs that are likely to produce +, /, = in standard base64
    const problematicIds = ['id>with>special', 'id?with?question', 'abc>>>def>>>ghi']
    for (const id of problematicIds) {
      const encoded = encodeRouteId(id)
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
      expect(decodeRouteId(encoded)).toBe(id)
    }
  })

  it('handles empty string', () => {
    expect(decodeRouteId(encodeRouteId(''))).toBe('')
  })

  it('is backward compatible with standard base64 input', () => {
    // A standard base64-encoded string (no URL-safe transform) should still decode
    // since decodeRouteId normalizes the input
    const raw = 'espn:nba:401584721'
    const standardB64 = btoa(raw)
    expect(decodeRouteId(standardB64)).toBe(raw)
  })
})

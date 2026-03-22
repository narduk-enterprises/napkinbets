import { describe, expect, it } from 'vitest'
import {
  displayNameToInitials,
  formatCurrency,
  formatCurrencyAbs,
  getVerificationBadgeColor,
} from '../../app/utils/napkinbets-display'

describe('displayNameToInitials', () => {
  it('returns two-letter initials for a two-word name', () => {
    expect(displayNameToInitials('Demo Host')).toBe('DH')
  })

  it('returns first two letters for a single-word name', () => {
    expect(displayNameToInitials('Bob')).toBe('BO')
  })

  it('returns ?? for an empty string', () => {
    expect(displayNameToInitials('')).toBe('??')
  })
})

describe('formatCurrency', () => {
  it('formats positive cents as dollars', () => {
    expect(formatCurrency(1500)).toBe('$15')
  })

  it('formats zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('formats negative cents as negative dollars', () => {
    expect(formatCurrency(-2000)).toBe('-$20')
  })
})

describe('formatCurrencyAbs', () => {
  it('formats positive cents as positive dollars', () => {
    expect(formatCurrencyAbs(1500)).toBe('$15')
  })

  it('formats negative cents as positive dollars (absolute value)', () => {
    expect(formatCurrencyAbs(-2000)).toBe('$20')
  })

  it('formats zero as $0', () => {
    expect(formatCurrencyAbs(0)).toBe('$0')
  })
})

describe('getVerificationBadgeColor', () => {
  it('returns success for confirmed', () => {
    expect(getVerificationBadgeColor('confirmed')).toBe('success')
  })

  it('returns error for rejected', () => {
    expect(getVerificationBadgeColor('rejected')).toBe('error')
  })

  it('returns warning for submitted', () => {
    expect(getVerificationBadgeColor('submitted')).toBe('warning')
  })

  it('returns neutral for null', () => {
    expect(getVerificationBadgeColor(null)).toBe('neutral')
  })

  it('returns neutral for unknown status', () => {
    expect(getVerificationBadgeColor('pending')).toBe('neutral')
  })
})

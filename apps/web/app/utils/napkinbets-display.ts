/**
 * Two-letter initials from a display name for avatar pills.
 * - "Demo Host" -> "DH", "Other Player" -> "OP"
 * - Single word: first two letters ("Bob" -> "BO")
 * - Empty or missing: "??"
 */
export function displayNameToInitials(displayName: string): string {
  const name = (displayName ?? '').trim()
  if (!name) return '??'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]!.charAt(0)
    const b = parts[1]!.charAt(0)
    return (a + b).toUpperCase()
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return '??'
}

/** Format a cent value as a whole-dollar currency string (e.g. 1500 → "$15"). */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** Absolute-value variant used when sign is rendered separately. */
export function formatCurrencyAbs(cents: number): string {
  return formatCurrency(Math.abs(cents))
}

/** Map a settlement verification status to a UI badge color. */
export function getVerificationBadgeColor(
  status: string | null,
): 'success' | 'error' | 'warning' | 'neutral' {
  if (status === 'confirmed') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'submitted') return 'warning'
  return 'neutral'
}

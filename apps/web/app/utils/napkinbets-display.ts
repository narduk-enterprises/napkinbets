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

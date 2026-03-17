/**
 * Venmo handle verification service.
 *
 * Validates that a Venmo username resolves to a real public profile by
 * checking `https://venmo.com/u/{handle}`. This runs server-side on
 * Cloudflare Workers using the standard `fetch` API — no Node.js deps.
 *
 * Results are cached in memory (per-isolate) for 1 hour to avoid
 * hammering Venmo with repeated lookups.
 */

export interface VenmoVerificationResult {
  valid: boolean
  displayName?: string
  checkedAt: string
}

// Per-isolate cache: handle → result (1-hour TTL)
const CACHE_TTL_MS = 60 * 60 * 1000
const verificationCache = new Map<string, { result: VenmoVerificationResult; expiresAt: number }>()

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, '')
}

/**
 * Check whether a Venmo handle resolves to a real public profile.
 *
 * Fetches `https://venmo.com/u/{handle}` with a standard browser
 * User-Agent. Returns `{ valid: true }` on HTTP 200 and
 * `{ valid: false }` on 404 or any network error.
 */
export async function verifyVenmoHandle(handle: string): Promise<VenmoVerificationResult> {
  const clean = normalizeHandle(handle)
  if (!clean) {
    return { valid: false, checkedAt: new Date().toISOString() }
  }

  // Check per-isolate cache
  const cached = verificationCache.get(clean)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  const now = new Date().toISOString()

  try {
    const response = await fetch(`https://venmo.com/u/${encodeURIComponent(clean)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NapkinbetsBot/1.0; +https://napkinbets.com)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })

    const valid = response.status === 200

    // Try to extract display name from the page title
    // Venmo profile pages have <title>Name - Venmo</title>
    let displayName: string | undefined
    if (valid) {
      try {
        const html = await response.text()
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
        if (titleMatch) {
          const titleText = titleMatch[1]!.trim()
          // Format is typically "FirstName LastName - Venmo"
          const venmoIndex = titleText.search(/\s*[-–—]\s*Venmo$/i)
          if (venmoIndex !== -1) {
            displayName = titleText.slice(0, venmoIndex).trim()
          }
        }
      } catch {
        // Failed to parse — still valid profile, just no display name extraction
      }
    }

    const result: VenmoVerificationResult = { valid, displayName, checkedAt: now }

    // Cache the result
    verificationCache.set(clean, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return result
  } catch {
    // Network error or timeout — treat as unverifiable (not invalid)
    return { valid: false, checkedAt: now }
  }
}

/**
 * Clear the per-isolate verification cache.
 * Useful for testing or when a user changes their handle.
 */
export function clearVenmoVerificationCache(): void {
  verificationCache.clear()
}

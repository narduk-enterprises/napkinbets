/**
 * CSRF and common headers for API integration tests.
 * Layer middleware requires X-Requested-With for mutations (POST/PUT/PATCH/DELETE).
 */
export const CSRF_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
} as const

export function mutationHeaders(cookie?: string): Record<string, string> {
  const headers: Record<string, string> = { ...CSRF_HEADERS }
  if (cookie) {
    headers.Cookie = cookie
  }
  return headers
}

export function getHeaders(cookie?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  if (cookie) {
    headers.Cookie = cookie
  }
  return headers
}

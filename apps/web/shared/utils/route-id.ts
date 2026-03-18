/**
 * Isomorphic helpers to encode/decode route IDs for use in URL segments.
 *
 * Event IDs often contain colons and brackets that break Nitro's file-based
 * routing. These helpers use base64url (URL-safe, no padding) to safely
 * embed arbitrary IDs in route parameters.
 */

/** Encode a raw ID for use in URL route segments (base64url, no padding). */
export function encodeRouteId(raw: string): string {
  const b64 = typeof btoa !== 'undefined' ? btoa(raw) : Buffer.from(raw).toString('base64')
  // Convert standard base64 → base64url (URL-safe alphabet, strip padding)
  return b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** Decode a base64url-encoded route ID back to the raw string. */
export function decodeRouteId(encoded: string): string {
  // Convert base64url → standard base64 and restore padding
  let b64 = encoded.replaceAll('-', '+').replaceAll('_', '/')
  while (b64.length % 4) b64 += '='
  return typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('ascii')
}

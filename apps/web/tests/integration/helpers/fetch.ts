const BASE_URL = process.env.NUXT_TEST_BASE_URL ?? 'http://localhost:3000'

/** Options for apiFetch (subset of fetch). */
type ApiFetchOptions = RequestInit & { body?: unknown }

/**
 * Fetch against the running Nuxt app. Requires server to be running (pnpm run dev).
 * Use in integration tests (node environment). Throws on non-2xx with statusCode.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const { body, headers: optHeaders, ...init } = options
  const bodyStr =
    body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  const headers: HeadersInit = {
    ...(bodyStr && { 'Content-Type': 'application/json' }),
    ...(optHeaders as Record<string, string>),
  }
  const res = await fetch(url, { ...init, headers, body: bodyStr })
  const text = await res.text()
  if (!res.ok) {
    const err = new Error(`[${res.status}] ${res.statusText}`) as Error & { statusCode: number }
    Object.defineProperty(err, 'statusCode', { value: res.status, enumerable: true })
    throw err
  }
  if (text.length === 0) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

import { mutationHeaders } from './headers'

const BASE_URL = process.env.NUXT_TEST_BASE_URL ?? 'http://localhost:3000'

export interface AuthHeaders {
  headers: Record<string, string>
}

/**
 * Log in via demo-login and return headers (Cookie + CSRF) for authenticated API calls.
 * Requires server running (pnpm run dev). Use with apiFetch('/api/...', { ...authHeaders, method: 'POST', body: ... }).
 */
export async function getDemoAuthHeaders(): Promise<AuthHeaders> {
  const url = `${BASE_URL}/api/auth/demo-login`
  const res = await fetch(url, {
    method: 'POST',
    headers: mutationHeaders(),
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie') ?? res.headers.get('Set-Cookie')
  const cookie = setCookie ?? ''
  return {
    headers: mutationHeaders(cookie),
  }
}

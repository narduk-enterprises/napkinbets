import { createError, type H3Event } from 'h3'

const THE_ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4'

export async function fetchTheOddsApi<T>(
  event: H3Event,
  endpoint: string,
  query: Record<string, string> = {},
): Promise<{ data: T; requestsRemaining: number }> {
  const config = useRuntimeConfig(event)
  const apiKey = config.theOddsApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'Missing The Odds API Key' })
  }

  const url = new URL(`${THE_ODDS_API_BASE_URL}${endpoint}`)
  url.searchParams.append('apiKey', apiKey)
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.append(key, value)
  }

  try {
    const response = await fetch(url.toString())
    if (response.status === 429) {
      throw createError({
        statusCode: 429,
        message: 'The Odds API rate limit exceeded (30/sec burst or monthly quota).',
      })
    }
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `The Odds API Error: ${response.statusText}`,
      })
    }

    const remainingHeader = response.headers.get('x-requests-remaining')
    const requestsRemaining = remainingHeader ? Number.parseInt(remainingHeader, 10) : 0

    const data = (await response.json()) as T
    return { data, requestsRemaining }
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from The Odds API' })
  }
}

import { createError, type H3Event } from 'h3'

const MYSPORTSFEEDS_BASE_URL = 'https://api.mysportsfeeds.com/v2.1/pull'

export async function fetchMySportsFeeds<T>(
  event: H3Event,
  league: string,
  endpoint: string,
  query: Record<string, string> = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.mySportsFeedsApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'Missing MySportsFeeds API Key' })
  }

  const url = new URL(`${MYSPORTSFEEDS_BASE_URL}/${league}/${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.append(key, value)
  }

  try {
    // MySportsFeeds expects Basic Auth with encoded apikey:MYSPORTSFEEDS
    const authHeader = `Basic ${btoa(`${apiKey}:MYSPORTSFEEDS`)}`

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    })

    if (response.status === 304) {
      // For caching usage if we implement ETag tracking later
      return null as unknown as T
    }

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `MySportsFeeds Error: ${response.statusText}`,
      })
    }
    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from MySportsFeeds' })
  }
}

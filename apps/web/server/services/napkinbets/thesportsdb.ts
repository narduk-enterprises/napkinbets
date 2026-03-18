import { createError, type H3Event } from 'h3'

const THE_SPORTS_DB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json'

// Endpoints:
// searchteams.php?t={name} -> Teams (capped 2 results)
// searchplayers.php?p={name} -> Players (capped 2)
// searchvenues.php?v={name} -> Venues (capped 2)
// eventsday.php?d=YYYY-MM-DD&s={sport}&l={league} -> Daily events
// eventsnextleague.php?id={league} / eventspastleague.php?id={league}
export async function fetchTheSportsDb<T>(
  event: H3Event,
  endpoint: string,
  query: Record<string, string> = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.theSportsDbApiKey || '123'
  const url = new URL(`${THE_SPORTS_DB_BASE_URL}/${apiKey}/${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.append(key, value)
  }

  try {
    const response = await fetch(url.toString())
    if (response.status === 429) {
      throw createError({ statusCode: 429, message: 'TheSportsDB rate limit exceeded (30/min).' })
    }
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `TheSportsDB Error: ${response.statusText}`,
      })
    }
    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from TheSportsDB' })
  }
}

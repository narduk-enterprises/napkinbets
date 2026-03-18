import { createError, type H3Event } from 'h3'

const BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io'

// Endpoints:
// GET /v1/games (+ dates[], team_ids[], start_date, end_date) -> Events/schedule
// GET /v1/box_scores/live -> Live/in-progress box scores
export async function fetchBallDontLie<T>(
  event: H3Event,
  endpoint: string,
  query: Record<string, string | string[]> = {},
): Promise<T> {
  const config = useRuntimeConfig(event)
  const apiKey = config.ballDontLieApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'Missing BALLDONTLIE API Key' })
  }

  const url = new URL(`${BALLDONTLIE_BASE_URL}${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const val of value) {
        url.searchParams.append(`${key}[]`, val)
      }
    } else if (value) {
      url.searchParams.append(key, value as string)
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    if (response.status === 429) {
      throw createError({ statusCode: 429, message: 'BALLDONTLIE rate limit exceeded (5/min).' })
    }
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `BALLDONTLIE Error: ${response.statusText}`,
      })
    }
    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof Error && 'statusCode' in err) {
      throw err
    }
    throw createError({ statusCode: 500, message: 'Failed to fetch from BALLDONTLIE' })
  }
}

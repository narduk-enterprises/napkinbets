import { createError } from 'h3'
import type { H3Event } from 'h3'
import { useAppDatabase } from '#server/utils/database'
import { napkinbetsPlayers } from '#server/database/schema'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

interface EspnScoreboardResponse {
  events?: Array<{
    competitions?: Array<{
      competitors?: Array<{
        id?: string
        athlete?: {
          fullName?: string
          displayName?: string
          shortName?: string
          flag?: { alt?: string }
        }
      }>
    }>
  }>
}

export async function fetchEspnPgaScoreboard(): Promise<EspnScoreboardResponse> {
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard')
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: `ESPN API returned ${response.status}`,
    })
  }

  const data = await response.json()
  return data as EspnScoreboardResponse
}

export async function syncEspnPgaPlayers(event: H3Event) {
  const db = useAppDatabase(event)
  const scoreboard = await fetchEspnPgaScoreboard()

  let upsertCount = 0
  const now = new Date().toISOString()
  const events = scoreboard.events || []

  for (const espnEvent of events) {
    const competitions = espnEvent.competitions || []
    for (const competition of competitions) {
      const competitors = competition.competitors || []

      for (const competitor of competitors) {
        const athlete = competitor.athlete
        if (!athlete || !competitor.id) continue

        const externalPlayerId = competitor.id
        const id = `espn:pga:player:${externalPlayerId}`
        const displayName = athlete.displayName || athlete.fullName || ''
        const { firstName, lastName } = splitDisplayName(displayName)

        const playerValues: typeof napkinbetsPlayers.$inferInsert = {
          id,
          slug: `${slugify(displayName) || 'player'}-${externalPlayerId}`,
          source: 'espn',
          externalPlayerId,
          sportKey: 'golf',
          currentLeagueKey: 'pga',
          displayName,
          firstName,
          lastName,
          shortName: athlete.shortName || displayName,
          position: '',
          groupLabel: '',
          jerseyNumber: '',
          nationality: athlete.flag?.alt || '',
          age: null,
          birthDate: null,
          height: '',
          weight: '',
          imageUrl: `https://a.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${externalPlayerId}.png`,
          metadataJson: JSON.stringify({}),
          rawPayloadJson: JSON.stringify(competitor),
          sourceUpdatedAt: null,
          lastSyncedAt: now,
          createdAt: now,
          updatedAt: now,
        }

        await db
          .insert(napkinbetsPlayers)
          .values(playerValues)
          .onConflictDoUpdate({
            target: napkinbetsPlayers.id,
            set: {
              slug: playerValues.slug,
              displayName: playerValues.displayName,
              firstName: playerValues.firstName,
              lastName: playerValues.lastName,
              shortName: playerValues.shortName,
              nationality: playerValues.nationality,
              imageUrl: playerValues.imageUrl,
              rawPayloadJson: playerValues.rawPayloadJson,
              lastSyncedAt: playerValues.lastSyncedAt,
              updatedAt: playerValues.updatedAt,
            },
          })
          .run()

        upsertCount++
      }
    }
  }

  return { upsertCount }
}

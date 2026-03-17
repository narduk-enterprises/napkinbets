import type { H3Event } from 'h3'
import { createError } from 'h3'
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsPlayers,
  napkinbetsTaxonomyLeagues,
  napkinbetsTeamRosters,
  napkinbetsTeams,
  napkinbetsVenues,
} from '#server/database/schema'
import {
  fetchApiSportsLeagueMetadata,
  fetchApiSportsPlayersByTeam,
  fetchApiSportsTeams,
  NapkinbetsApiSportsError,
  type NapkinbetsApiSportsLeagueMetadata,
  type NapkinbetsApiSportsProduct,
  type NapkinbetsApiSportsTeamPayload,
  type NapkinbetsApiSportsVenuePayload,
} from '#server/services/napkinbets/api-sports'
import { findNapkinbetsLeagueFromStore } from '#server/services/napkinbets/taxonomy-store'
import { useAppDatabase } from '#server/utils/database'

function nowIso() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

function normalizeLookup(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '')
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function buildProviderEntityId(
  product: NapkinbetsApiSportsProduct,
  kind: 'player' | 'team' | 'venue',
  externalId: string,
) {
  return `api-sports:${product}:${kind}:${externalId}`
}

function buildFallbackVenueExternalId(leagueKey: string, venue: NapkinbetsApiSportsVenuePayload) {
  return `${leagueKey}:${slugify(`${venue.name}-${venue.city}-${venue.stateRegion}`)}`
}

function buildVenueSlug(
  venue: Pick<typeof napkinbetsVenues.$inferInsert, 'name' | 'city' | 'stateRegion' | 'id'>,
) {
  const base = slugify([venue.name, venue.city, venue.stateRegion].filter(Boolean).join(' '))
  const suffix = venue.id.split(':').at(-1) ?? venue.id.slice(-8)
  return `${base || 'venue'}-${suffix}`
}

function buildTeamSlug(team: Pick<typeof napkinbetsTeams.$inferInsert, 'name' | 'externalTeamId'>) {
  return `${slugify(team.name) || 'team'}-${team.externalTeamId}`
}

function buildPlayerSlug(
  player: Pick<typeof napkinbetsPlayers.$inferInsert, 'displayName' | 'externalPlayerId'>,
) {
  return `${slugify(player.displayName) || 'player'}-${player.externalPlayerId}`
}

function buildSeasonCandidates(
  metadata: NapkinbetsApiSportsLeagueMetadata | null,
  preferredSeason?: string,
) {
  const candidates = new Set<string>()

  if (preferredSeason) {
    candidates.add(preferredSeason)
  }

  for (const season of metadata?.seasons?.slice().sort((left, right) => {
    if (left.current !== right.current) {
      return left.current ? -1 : 1
    }

    return right.season.localeCompare(left.season)
  }) ?? []) {
    candidates.add(season.season)
  }

  return [...candidates]
}

function recordToJson(value: unknown) {
  return JSON.stringify(value)
}

async function upsertVenue(
  event: H3Event,
  product: NapkinbetsApiSportsProduct,
  leagueKey: string,
  sportKey: string,
  venue: NapkinbetsApiSportsVenuePayload,
  syncedAt: string,
) {
  const db = useAppDatabase(event)
  const externalVenueId = venue.externalId ?? buildFallbackVenueExternalId(leagueKey, venue)
  const id = buildProviderEntityId(product, 'venue', externalVenueId)
  const values: typeof napkinbetsVenues.$inferInsert = {
    id,
    slug: buildVenueSlug({
      id,
      name: venue.name,
      city: venue.city,
      stateRegion: venue.stateRegion,
    }),
    source: 'api-sports',
    externalVenueId,
    sportKey,
    primaryLeagueKey: leagueKey,
    name: venue.name,
    shortName: venue.name,
    city: venue.city,
    stateRegion: venue.stateRegion,
    country: venue.country,
    address: venue.address,
    postalCode: venue.postalCode,
    timezone: venue.timezone,
    latitude: venue.latitude,
    longitude: venue.longitude,
    capacity: venue.capacity,
    surface: venue.surface,
    roofType: venue.roofType,
    imageUrl: venue.imageUrl,
    metadataJson: recordToJson(venue.metadata),
    rawPayloadJson: recordToJson(venue),
    sourceUpdatedAt: null,
    lastSyncedAt: syncedAt,
    createdAt: syncedAt,
    updatedAt: syncedAt,
  }

  await db
    .insert(napkinbetsVenues)
    .values(values)
    .onConflictDoUpdate({
      target: napkinbetsVenues.id,
      set: {
        slug: values.slug,
        primaryLeagueKey: values.primaryLeagueKey,
        name: values.name,
        shortName: values.shortName,
        city: values.city,
        stateRegion: values.stateRegion,
        country: values.country,
        address: values.address,
        postalCode: values.postalCode,
        timezone: values.timezone,
        latitude: values.latitude,
        longitude: values.longitude,
        capacity: values.capacity,
        surface: values.surface,
        roofType: values.roofType,
        imageUrl: values.imageUrl,
        metadataJson: values.metadataJson,
        rawPayloadJson: values.rawPayloadJson,
        sourceUpdatedAt: values.sourceUpdatedAt,
        lastSyncedAt: values.lastSyncedAt,
        updatedAt: values.updatedAt,
      },
    })
    .run()

  return id
}

function buildTeamLookupValues(team: typeof napkinbetsTeams.$inferSelect) {
  return [team.name, team.shortName, team.abbreviation]
    .filter(Boolean)
    .map((value) => normalizeLookup(value))
}

function buildVenueLookupValues(row: typeof napkinbetsVenues.$inferSelect) {
  return [
    normalizeLookup(`${row.name}:${row.city}:${row.stateRegion}`),
    normalizeLookup(`${row.name}:${row.city}`),
    normalizeLookup(row.name),
  ].filter(Boolean)
}

export async function linkEventsToCanonicalEntities(event: H3Event, leagueKey: string) {
  const db = useAppDatabase(event)
  const [teamRows, venueRows, eventRows] = await Promise.all([
    db.select().from(napkinbetsTeams).where(eq(napkinbetsTeams.primaryLeagueKey, leagueKey)),
    db.select().from(napkinbetsVenues).where(eq(napkinbetsVenues.primaryLeagueKey, leagueKey)),
    db.select().from(napkinbetsEvents).where(eq(napkinbetsEvents.league, leagueKey)),
  ])

  const teamLookup = new Map<string, string>()
  for (const team of teamRows) {
    for (const key of buildTeamLookupValues(team)) {
      teamLookup.set(key, team.id)
    }
  }

  const venueLookup = new Map<string, string>()
  for (const venue of venueRows) {
    for (const key of buildVenueLookupValues(venue)) {
      venueLookup.set(key, venue.id)
    }
  }

  for (const currentEvent of eventRows) {
    let homeName = ''
    let awayName = ''

    try {
      const home = JSON.parse(currentEvent.homeTeamJson) as {
        name?: string
        shortName?: string
        abbreviation?: string
      }
      const away = JSON.parse(currentEvent.awayTeamJson) as {
        name?: string
        shortName?: string
        abbreviation?: string
      }
      homeName = home.name || home.shortName || home.abbreviation || ''
      awayName = away.name || away.shortName || away.abbreviation || ''
    } catch {
      homeName = ''
      awayName = ''
    }

    const homeTeamId = teamLookup.get(normalizeLookup(homeName)) ?? null
    const awayTeamId = teamLookup.get(normalizeLookup(awayName)) ?? null
    const venueId =
      venueLookup.get(normalizeLookup(`${currentEvent.venueName}:${currentEvent.venueLocation}`)) ??
      venueLookup.get(normalizeLookup(currentEvent.venueName)) ??
      null

    if (
      currentEvent.homeTeamId === homeTeamId &&
      currentEvent.awayTeamId === awayTeamId &&
      currentEvent.venueId === venueId
    ) {
      continue
    }

    await db
      .update(napkinbetsEvents)
      .set({
        homeTeamId,
        awayTeamId,
        venueId,
        updatedAt: nowIso(),
      })
      .where(eq(napkinbetsEvents.id, currentEvent.id))
      .run()
  }
}

async function setLeagueSyncState(
  event: H3Event,
  leagueKey: string,
  values: Partial<typeof napkinbetsTaxonomyLeagues.$inferInsert>,
) {
  const db = useAppDatabase(event)

  await db
    .update(napkinbetsTaxonomyLeagues)
    .set({
      ...values,
      updatedAt: nowIso(),
    })
    .where(eq(napkinbetsTaxonomyLeagues.key, leagueKey))
    .run()
}

export async function syncLeagueEntities(event: H3Event, leagueKey: string) {
  const db = useAppDatabase(event)
  const league = await findNapkinbetsLeagueFromStore(event, leagueKey)
  if (!league) {
    throw createError({ statusCode: 404, message: 'League not found.' })
  }

  if (!league.entitySyncEnabled || league.entityProvider !== 'api-sports') {
    throw createError({
      statusCode: 400,
      message: 'Entity sync is not enabled for this league.',
    })
  }

  if (!league.entityProviderSportKey || !league.entityProviderLeagueId) {
    throw createError({
      statusCode: 400,
      message: 'This league is missing API-Sports product or league ID configuration.',
    })
  }

  const syncedAt = nowIso()
  const warnings: string[] = []
  let metadata: NapkinbetsApiSportsLeagueMetadata | null = null

  try {
    metadata = await fetchApiSportsLeagueMetadata(
      event,
      league.entityProviderSportKey,
      league.entityProviderLeagueId,
    )

    const seasonCandidates = buildSeasonCandidates(metadata, league.entityProviderSeason)
    let resolvedSeason = ''
    let teams: NapkinbetsApiSportsTeamPayload[] = []
    let lastPlanError = ''

    for (const candidateSeason of seasonCandidates) {
      try {
        teams = await fetchApiSportsTeams(
          event,
          league.entityProviderSportKey,
          league.entityProviderLeagueId,
          candidateSeason,
        )
        resolvedSeason = candidateSeason
        break
      } catch (error) {
        if (error instanceof NapkinbetsApiSportsError && error.code === 'plan') {
          lastPlanError = error.message
          warnings.push(`${candidateSeason}: ${error.message}`)
          continue
        }

        throw error
      }
    }

    if (!resolvedSeason) {
      throw createError({
        statusCode: 400,
        message: lastPlanError || 'No accessible season was available for this league.',
      })
    }

    let teamCount = 0
    let playerCount = 0
    let rosterCount = 0
    let venueCount = 0
    let rosterEndpointUnavailable = false

    for (const team of teams) {
      const venueId = team.venue
        ? await upsertVenue(
            event,
            league.entityProviderSportKey,
            league.key,
            league.sportKey,
            team.venue,
            syncedAt,
          )
        : null

      if (team.venue) {
        venueCount += 1
      }

      const teamId = buildProviderEntityId(league.entityProviderSportKey, 'team', team.externalId)
      const teamValues: typeof napkinbetsTeams.$inferInsert = {
        id: teamId,
        slug: buildTeamSlug({ name: team.name, externalTeamId: team.externalId }),
        source: 'api-sports',
        externalTeamId: team.externalId,
        sportKey: league.sportKey,
        primaryLeagueKey: league.key,
        venueId,
        name: team.name,
        shortName: team.shortName || team.name,
        abbreviation: team.abbreviation,
        city: team.city,
        country: team.country,
        logoUrl: team.logoUrl,
        isNational: team.isNational,
        foundedYear: team.foundedYear,
        metadataJson: recordToJson(team.metadata),
        rawPayloadJson: JSON.stringify(team.rawPayload),
        sourceUpdatedAt: null,
        lastSyncedAt: syncedAt,
        createdAt: syncedAt,
        updatedAt: syncedAt,
      }

      await db
        .insert(napkinbetsTeams)
        .values(teamValues)
        .onConflictDoUpdate({
          target: napkinbetsTeams.id,
          set: {
            slug: teamValues.slug,
            primaryLeagueKey: teamValues.primaryLeagueKey,
            venueId: teamValues.venueId,
            name: teamValues.name,
            shortName: teamValues.shortName,
            abbreviation: teamValues.abbreviation,
            city: teamValues.city,
            country: teamValues.country,
            logoUrl: teamValues.logoUrl,
            isNational: teamValues.isNational,
            foundedYear: teamValues.foundedYear,
            metadataJson: teamValues.metadataJson,
            rawPayloadJson: teamValues.rawPayloadJson,
            sourceUpdatedAt: teamValues.sourceUpdatedAt,
            lastSyncedAt: teamValues.lastSyncedAt,
            updatedAt: teamValues.updatedAt,
          },
        })
        .run()

      teamCount += 1

      if (rosterEndpointUnavailable) {
        continue
      }

      try {
        const players = await fetchApiSportsPlayersByTeam(
          event,
          league.entityProviderSportKey,
          team.externalId,
          resolvedSeason,
        )

        await db
          .delete(napkinbetsTeamRosters)
          .where(
            and(
              eq(napkinbetsTeamRosters.teamId, teamId),
              eq(napkinbetsTeamRosters.season, resolvedSeason),
              eq(napkinbetsTeamRosters.leagueKey, league.key),
            ),
          )
          .run()

        for (const [index, player] of players.entries()) {
          const playerId = buildProviderEntityId(
            league.entityProviderSportKey,
            'player',
            player.externalId,
          )

          const names = splitDisplayName(player.displayName)
          const playerValues: typeof napkinbetsPlayers.$inferInsert = {
            id: playerId,
            slug: buildPlayerSlug({
              displayName: player.displayName,
              externalPlayerId: player.externalId,
            }),
            source: 'api-sports',
            externalPlayerId: player.externalId,
            sportKey: league.sportKey,
            currentTeamId: teamId,
            currentLeagueKey: league.key,
            displayName: player.displayName,
            firstName: player.firstName || names.firstName,
            lastName: player.lastName || names.lastName,
            shortName: player.shortName || player.displayName,
            position: player.position,
            groupLabel: player.groupLabel,
            jerseyNumber: player.jerseyNumber,
            nationality: player.nationality,
            age: player.age,
            birthDate: player.birthDate,
            height: player.height,
            weight: player.weight,
            imageUrl: player.imageUrl,
            metadataJson: recordToJson(player.metadata),
            rawPayloadJson: JSON.stringify(player.rawPayload),
            sourceUpdatedAt: null,
            lastSyncedAt: syncedAt,
            createdAt: syncedAt,
            updatedAt: syncedAt,
          }

          await db
            .insert(napkinbetsPlayers)
            .values(playerValues)
            .onConflictDoUpdate({
              target: napkinbetsPlayers.id,
              set: {
                slug: playerValues.slug,
                currentTeamId: playerValues.currentTeamId,
                currentLeagueKey: playerValues.currentLeagueKey,
                displayName: playerValues.displayName,
                firstName: playerValues.firstName,
                lastName: playerValues.lastName,
                shortName: playerValues.shortName,
                position: playerValues.position,
                groupLabel: playerValues.groupLabel,
                jerseyNumber: playerValues.jerseyNumber,
                nationality: playerValues.nationality,
                age: playerValues.age,
                birthDate: playerValues.birthDate,
                height: playerValues.height,
                weight: playerValues.weight,
                imageUrl: playerValues.imageUrl,
                metadataJson: playerValues.metadataJson,
                rawPayloadJson: playerValues.rawPayloadJson,
                sourceUpdatedAt: playerValues.sourceUpdatedAt,
                lastSyncedAt: playerValues.lastSyncedAt,
                updatedAt: playerValues.updatedAt,
              },
            })
            .run()

          const rosterValues: typeof napkinbetsTeamRosters.$inferInsert = {
            id: `${league.key}:${resolvedSeason}:${teamId}:${playerId}`,
            leagueKey: league.key,
            teamId,
            playerId,
            season: resolvedSeason,
            jerseyNumber: player.jerseyNumber,
            position: player.position,
            status: player.groupLabel || 'active',
            sortOrder: index,
            metadataJson: recordToJson(player.metadata),
            rawPayloadJson: JSON.stringify(player.rawPayload),
            sourceUpdatedAt: null,
            lastSyncedAt: syncedAt,
            createdAt: syncedAt,
            updatedAt: syncedAt,
          }

          await db.insert(napkinbetsTeamRosters).values(rosterValues).run()
          playerCount += 1
          rosterCount += 1
        }
      } catch (error) {
        if (error instanceof NapkinbetsApiSportsError && error.code === 'endpoint') {
          rosterEndpointUnavailable = true
          warnings.push(error.message)
          continue
        }

        if (error instanceof NapkinbetsApiSportsError && error.code === 'plan') {
          warnings.push(`Roster sync for ${team.name} skipped: ${error.message}`)
          continue
        }

        throw error
      }
    }

    await linkEventsToCanonicalEntities(event, league.key)

    await setLeagueSyncState(event, league.key, {
      entityLastSyncAt: syncedAt,
      entityLastSyncStatus: warnings.length > 0 ? 'partial' : 'success',
      entityLastSyncMessage: warnings.join(' | ') || null,
      entityResolvedSeason: resolvedSeason,
    })

    return {
      ok: true as const,
      league: league.key,
      resolvedSeason,
      teamCount,
      playerCount,
      rosterCount,
      venueCount,
      warnings,
      metadata,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Entity sync failed.'
    await setLeagueSyncState(event, league.key, {
      entityLastSyncAt: syncedAt,
      entityLastSyncStatus: 'error',
      entityLastSyncMessage: message,
    })
    throw error
  }
}

function mapEventRow(row: typeof napkinbetsEvents.$inferSelect) {
  let homeTeam = { name: '', score: '' }
  let awayTeam = { name: '', score: '' }

  try {
    homeTeam = JSON.parse(row.homeTeamJson) as { name: string; score: string }
  } catch {
    // Ignore malformed legacy event payloads and fall back to empty team fields.
  }

  try {
    awayTeam = JSON.parse(row.awayTeamJson) as { name: string; score: string }
  } catch {
    // Ignore malformed legacy event payloads and fall back to empty team fields.
  }

  return {
    id: row.id,
    leagueKey: row.league,
    leagueLabel: row.leagueLabel,
    eventTitle: row.eventTitle,
    startTime: row.startTime,
    state: row.state,
    status: row.status,
    venueName: row.venueName,
    venueLocation: row.venueLocation,
    homeTeam,
    awayTeam,
  }
}

export async function loadLeagueProfile(event: H3Event, key: string) {
  const db = useAppDatabase(event)
  const league = await findNapkinbetsLeagueFromStore(event, key)
  if (!league) {
    return null
  }

  const [teams, recentEvents] = await Promise.all([
    db
      .select()
      .from(napkinbetsTeams)
      .where(eq(napkinbetsTeams.primaryLeagueKey, key))
      .orderBy(asc(napkinbetsTeams.name)),
    db
      .select()
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.league, key))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(16),
  ])

  return {
    league,
    teams: teams.map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      abbreviation: team.abbreviation,
      city: team.city,
      logoUrl: team.logoUrl,
    })),
    recentEvents: recentEvents.map(mapEventRow),
  }
}

export async function loadTeamProfileBySlug(event: H3Event, slug: string) {
  const db = useAppDatabase(event)
  const teamRow = await db
    .select()
    .from(napkinbetsTeams)
    .where(eq(napkinbetsTeams.slug, slug))
    .limit(1)
  const team = teamRow[0]
  if (!team) {
    return null
  }

  const [venueRow, rosterRows, recentEvents] = await Promise.all([
    team.venueId
      ? db.select().from(napkinbetsVenues).where(eq(napkinbetsVenues.id, team.venueId)).limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(napkinbetsTeamRosters)
      .where(eq(napkinbetsTeamRosters.teamId, team.id))
      .orderBy(desc(napkinbetsTeamRosters.lastSyncedAt), asc(napkinbetsTeamRosters.sortOrder)),
    db
      .select()
      .from(napkinbetsEvents)
      .where(or(eq(napkinbetsEvents.homeTeamId, team.id), eq(napkinbetsEvents.awayTeamId, team.id)))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(16),
  ])

  const latestSeason = rosterRows[0]?.season ?? ''
  const activeRoster = rosterRows.filter((row) => row.season === latestSeason)
  const playerIds = activeRoster.map((row) => row.playerId)
  const players =
    playerIds.length > 0
      ? await db.select().from(napkinbetsPlayers).where(inArray(napkinbetsPlayers.id, playerIds))
      : []
  const playerById = new Map(players.map((player) => [player.id, player]))

  return {
    team: {
      ...team,
      venue: venueRow[0] ?? null,
    },
    rosterSeason: latestSeason,
    roster: activeRoster
      .map((entry) => {
        const player = playerById.get(entry.playerId)
        if (!player) {
          return null
        }

        return {
          id: player.id,
          slug: player.slug,
          displayName: player.displayName,
          position: entry.position || player.position,
          jerseyNumber: entry.jerseyNumber || player.jerseyNumber,
          imageUrl: player.imageUrl,
          nationality: player.nationality,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    recentEvents: recentEvents.map(mapEventRow),
  }
}

export async function loadPlayerProfileBySlug(event: H3Event, slug: string) {
  const db = useAppDatabase(event)
  const playerRows = await db
    .select()
    .from(napkinbetsPlayers)
    .where(eq(napkinbetsPlayers.slug, slug))
    .limit(1)
  const player = playerRows[0]
  if (!player) {
    return null
  }

  const rosterRows = await db
    .select()
    .from(napkinbetsTeamRosters)
    .where(eq(napkinbetsTeamRosters.playerId, player.id))
    .orderBy(desc(napkinbetsTeamRosters.lastSyncedAt))

  const teamIds = [...new Set(rosterRows.map((row) => row.teamId))]
  const teams =
    teamIds.length > 0
      ? await db.select().from(napkinbetsTeams).where(inArray(napkinbetsTeams.id, teamIds))
      : []
  const teamById = new Map(teams.map((team) => [team.id, team]))

  const recentEvents = player.currentTeamId
    ? await db
        .select()
        .from(napkinbetsEvents)
        .where(
          or(
            eq(napkinbetsEvents.homeTeamId, player.currentTeamId),
            eq(napkinbetsEvents.awayTeamId, player.currentTeamId),
          ),
        )
        .orderBy(desc(napkinbetsEvents.startTime))
        .limit(12)
    : []

  return {
    player,
    rosterHistory: rosterRows.map((row) => ({
      season: row.season,
      team: teamById.get(row.teamId)
        ? {
            id: teamById.get(row.teamId)?.id ?? '',
            slug: teamById.get(row.teamId)?.slug ?? '',
            name: teamById.get(row.teamId)?.name ?? '',
            logoUrl: teamById.get(row.teamId)?.logoUrl ?? '',
          }
        : null,
      position: row.position,
      jerseyNumber: row.jerseyNumber,
      status: row.status,
    })),
    recentEvents: recentEvents.map(mapEventRow),
  }
}

export async function loadVenueProfileBySlug(event: H3Event, slug: string) {
  const db = useAppDatabase(event)
  const venueRows = await db
    .select()
    .from(napkinbetsVenues)
    .where(eq(napkinbetsVenues.slug, slug))
    .limit(1)
  const venue = venueRows[0]
  if (!venue) {
    return null
  }

  const [teams, recentEvents] = await Promise.all([
    db
      .select()
      .from(napkinbetsTeams)
      .where(eq(napkinbetsTeams.venueId, venue.id))
      .orderBy(asc(napkinbetsTeams.name)),
    db
      .select()
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.venueId, venue.id))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(16),
  ])

  return {
    venue,
    teams: teams.map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      logoUrl: team.logoUrl,
    })),
    recentEvents: recentEvents.map(mapEventRow),
  }
}

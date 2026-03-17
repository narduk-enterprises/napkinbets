import { requireAdmin } from '#layer/server/utils/auth'
import {
  napkinbetsPlayers,
  napkinbetsTeamRosters,
  napkinbetsTeams,
  napkinbetsVenues,
} from '#server/database/schema'
import { findNapkinbetsLeagueFromStore } from '#server/services/napkinbets/taxonomy-store'
import { useAppDatabase } from '#server/utils/database'
import { asc, count, eq } from 'drizzle-orm'
import { createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, message: 'League key required' })
  }

  const db = useAppDatabase(event)
  const league = await findNapkinbetsLeagueFromStore(event, key)
  if (!league) {
    throw createError({ statusCode: 404, message: 'League not found' })
  }

  const [teamsCount, playersCount, venuesCount, rostersCount] = await Promise.all([
    db
      .select({ value: count() })
      .from(napkinbetsTeams)
      .where(eq(napkinbetsTeams.primaryLeagueKey, key)),
    db
      .select({ value: count() })
      .from(napkinbetsPlayers)
      .where(eq(napkinbetsPlayers.currentLeagueKey, key)),
    db
      .select({ value: count() })
      .from(napkinbetsVenues)
      .where(eq(napkinbetsVenues.primaryLeagueKey, key)),
    db
      .select({ value: count() })
      .from(napkinbetsTeamRosters)
      .where(eq(napkinbetsTeamRosters.leagueKey, key)),
  ])

  const teams = await db
    .select()
    .from(napkinbetsTeams)
    .where(eq(napkinbetsTeams.primaryLeagueKey, key))
    .orderBy(asc(napkinbetsTeams.name))

  return {
    league: {
      ...league,
      isActive: true,
    },
    entityCounts: {
      teams: teamsCount[0]?.value ?? 0,
      players: playersCount[0]?.value ?? 0,
      venues: venuesCount[0]?.value ?? 0,
      rosters: rostersCount[0]?.value ?? 0,
    },
    teams: teams.map((team) => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      abbreviation: team.abbreviation,
      city: team.city,
      logoUrl: team.logoUrl,
    })),
  }
})

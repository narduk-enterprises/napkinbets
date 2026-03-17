import { requireAdmin } from '#layer/server/utils/auth'
import {
  napkinbetsPlayers,
  napkinbetsTeamRosters,
  napkinbetsTeams,
  napkinbetsVenues,
} from '#server/database/schema'
import { loadNapkinbetsTaxonomyCatalog } from '#server/services/napkinbets/taxonomy-store'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useAppDatabase(event)
  const taxonomy = await loadNapkinbetsTaxonomyCatalog(event)
  const [teams, players, venues, rosters] = await Promise.all([
    db.select({ id: napkinbetsTeams.id }).from(napkinbetsTeams),
    db.select({ id: napkinbetsPlayers.id }).from(napkinbetsPlayers),
    db.select({ id: napkinbetsVenues.id }).from(napkinbetsVenues),
    db.select({ id: napkinbetsTeamRosters.id }).from(napkinbetsTeamRosters),
  ])

  return {
    sports: taxonomy.sports,
    contexts: taxonomy.contexts,
    leagues: taxonomy.leagues,
    entityCounts: {
      teams: teams.length,
      players: players.length,
      venues: venues.length,
      rosters: rosters.length,
    },
  }
})

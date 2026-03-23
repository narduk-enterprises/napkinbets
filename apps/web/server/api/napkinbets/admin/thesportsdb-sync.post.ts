import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { z } from 'zod'
import {
  searchTheSportsDbTeams,
  searchTheSportsDbPlayers,
} from '#server/services/napkinbets/thesportsdb'

const bodySchema = z.object({
  type: z.enum(['team', 'player']),
  query: z.string().min(2),
})

const RATE_LIMIT = { namespace: 'napkinbets-admin-tsdb-sync', maxRequests: 10, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body }) => {
    if (body.type === 'team') {
      const results = await searchTheSportsDbTeams(event, body.query)
      return {
        status: 'success',
        type: 'team',
        results,
      }
    }

    if (body.type === 'player') {
      const results = await searchTheSportsDbPlayers(event, body.query)
      return {
        status: 'success',
        type: 'player',
        results,
      }
    }

    return { status: 'error', message: 'Unknown type' }
  },
)

import { createError, readBody } from 'h3'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAdmin } from '#layer/server/utils/auth'
import {
  searchTheSportsDbTeams,
  searchTheSportsDbPlayers,
} from '#server/services/napkinbets/thesportsdb'

const bodySchema = z.object({
  type: z.enum(['team', 'player']),
  query: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'napkinbets-admin-tsdb-sync', 10, 60_000)

  const parsed = bodySchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const { type, query } = parsed.data

  if (type === 'team') {
    const results = await searchTheSportsDbTeams(event, query)
    return {
      status: 'success',
      type: 'team',
      results,
    }
  }

  if (type === 'player') {
    const results = await searchTheSportsDbPlayers(event, query)
    return {
      status: 'success',
      type: 'player',
      results,
    }
  }

  return { status: 'error', message: 'Unknown type' }
})

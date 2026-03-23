import { createError } from 'h3'
import { syncEspnPgaPlayers } from '#server/services/napkinbets/espn-golf'
import { defineAdminMutation } from '#layer/server/utils/mutation'

const RATE_LIMIT = { namespace: 'admin-sync-pga-players', maxRequests: 10, windowMs: 60_000 }

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
  },
  async ({ event }) => {
    try {
      const result = await syncEspnPgaPlayers(event)
      return { ok: true, count: result.upsertCount }
    } catch (error) {
      throw createError({
        statusCode: 500,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred syncing PGA players',
      })
    }
  },
)

import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '#layer/server/utils/auth'
import { syncEspnPgaPlayers } from '#server/services/napkinbets/espn-golf'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
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
})

import { createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { defineUserMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsWagerLegs, napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  legId: z.string().min(1),
  outcomeOptionKey: z.string().max(200).optional(),
  outcomeNumericValue: z.number().int().optional(),
})

const RATE_LIMIT = { namespace: 'napkinbets-outcomes', maxRequests: 20, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(bodySchema.parse),
  },
  async ({ event, body, user }) => {
    const wagerId = getRouterParam(event, 'id')
    if (!wagerId) {
      throw createError({ statusCode: 400, message: 'Missing wager ID.' })
    }

    const db = useAppDatabase(event)

    // Verify wager exists and user is owner or admin
    const [wager] = await db
      .select()
      .from(napkinbetsWagers)
      .where(eq(napkinbetsWagers.id, wagerId))
      .limit(1)

    if (!wager) {
      throw createError({ statusCode: 404, message: 'Wager not found.' })
    }

    if (!user.isAdmin && wager.ownerUserId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'Only the bet host or an admin can set outcomes.',
      })
    }

    // Verify leg belongs to this wager
    const [leg] = await db
      .select()
      .from(napkinbetsWagerLegs)
      .where(eq(napkinbetsWagerLegs.id, body.legId))
      .limit(1)

    if (!leg || leg.wagerId !== wagerId) {
      throw createError({ statusCode: 404, message: 'Leg not found on this wager.' })
    }

    // Update the leg with outcome
    const now = new Date().toISOString()
    await db
      .update(napkinbetsWagerLegs)
      .set({
        outcomeStatus: 'settled',
        outcomeOptionKey: body.outcomeOptionKey ?? null,
        outcomeNumericValue: body.outcomeNumericValue ?? null,
        updatedAt: now,
      })
      .where(eq(napkinbetsWagerLegs.id, body.legId))

    return { ok: true, legId: body.legId, outcomeStatus: 'settled' }
  },
)

import { createError, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsWagerLegs, napkinbetsWagers } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const bodySchema = z.object({
  legId: z.string().min(1),
  outcomeOptionKey: z.string().max(200).optional(),
  outcomeNumericValue: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-outcomes', 20, 60_000)

  const wagerId = getRouterParam(event, 'id')
  if (!wagerId) {
    throw createError({ statusCode: 400, message: 'Missing wager ID.' })
  }

  const user = await requireAuth(event)
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

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  // Verify leg belongs to this wager
  const [leg] = await db
    .select()
    .from(napkinbetsWagerLegs)
    .where(eq(napkinbetsWagerLegs.id, parsed.data.legId))
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
      outcomeOptionKey: parsed.data.outcomeOptionKey ?? null,
      outcomeNumericValue: parsed.data.outcomeNumericValue ?? null,
      updatedAt: now,
    })
    .where(eq(napkinbetsWagerLegs.id, parsed.data.legId))

  return { ok: true, legId: parsed.data.legId, outcomeStatus: 'settled' }
})

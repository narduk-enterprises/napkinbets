import { createError, getRouterParam } from 'h3'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { useR2 } from '#layer/server/utils/r2'
import { useAppDatabase } from '#server/utils/database'
import { requireAuth } from '#layer/server/utils/auth'
import { napkinbetsSettlements, napkinbetsParticipants } from '#server/database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'napkinbets-proof-image', 60, 60_000)

  const wagerId = getRouterParam(event, 'id')
  const settlementId = getRouterParam(event, 'settlementId')

  if (!wagerId || !settlementId) {
    throw createError({ statusCode: 400, message: 'Missing required parameters.' })
  }

  const user = await requireAuth(event)
  const db = useAppDatabase(event)

  // Validate the user is a participant in the wager or an admin
  const participantRows = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  if (!user.isAdmin && !participantRows.some((p) => p.userId === user.id)) {
    throw createError({
      statusCode: 403,
      message: 'You must be a participant to view settlement proof.',
    })
  }

  const [settlement] = await db
    .select()
    .from(napkinbetsSettlements)
    .where(
      and(eq(napkinbetsSettlements.id, settlementId), eq(napkinbetsSettlements.wagerId, wagerId)),
    )
    .limit(1)

  if (!settlement || !settlement.proofImageUrl) {
    throw createError({ statusCode: 404, message: 'Proof image not found.' })
  }

  const r2 = useR2(event)
  const object = await r2.get(settlement.proofImageUrl)

  if (!object) {
    throw createError({ statusCode: 404, message: 'Proof image not found in storage.' })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  // Cache strictly — images are immutable (when updated, they get a new UUID key)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})

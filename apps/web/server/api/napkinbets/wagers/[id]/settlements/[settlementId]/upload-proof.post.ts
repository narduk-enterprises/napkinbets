import { createError, getRouterParam, readMultipartFormData } from 'h3'
import { uploadToR2 } from '#layer/server/utils/r2'
import { useAppDatabase } from '#server/utils/database'
import { defineUserMutation } from '#layer/server/utils/mutation'
import { napkinbetsSettlements, napkinbetsParticipants } from '#server/database/schema'
import { eq, and } from 'drizzle-orm'

// 5MB max
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

const RATE_LIMIT = { namespace: 'napkinbets-upload-proof', maxRequests: 10, windowMs: 60_000 }

export default defineUserMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: async (event) => {
      const formData = await readMultipartFormData(event)
      if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'No file uploaded.' })
      }

      const fileInfo = formData.find((part) => part.name === 'file' || part.filename)
      if (!fileInfo || !fileInfo.data) {
        throw createError({ statusCode: 400, message: 'Invalid file data.' })
      }

      return { fileInfo }
    },
  },
  async ({ event, body, user }) => {
    const wagerId = getRouterParam(event, 'id')
    const settlementId = getRouterParam(event, 'settlementId')

    if (!wagerId || !settlementId) {
      throw createError({ statusCode: 400, message: 'Missing required parameters.' })
    }

    const db = useAppDatabase(event)

    const [settlement] = await db
      .select()
      .from(napkinbetsSettlements)
      .where(
        and(eq(napkinbetsSettlements.id, settlementId), eq(napkinbetsSettlements.wagerId, wagerId)),
      )
      .limit(1)

    if (!settlement) {
      throw createError({ statusCode: 404, message: 'Settlement not found.' })
    }

    const [participant] = await db
      .select()
      .from(napkinbetsParticipants)
      .where(eq(napkinbetsParticipants.id, settlement.participantId))
      .limit(1)

    if (
      (!participant || participant.userId !== user.id) && // Only the person who submitted the settlement (the payer) can upload proof for it,
      // unless they're an admin, but for simplicity let's restrict to the payer.
      !user.isAdmin
    ) {
      throw createError({
        statusCode: 403,
        message: 'You can only upload proof for your own settlement.',
      })
    }

    const contentType = body.fileInfo.type || 'application/octet-stream'

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed.',
      })
    }

    if (body.fileInfo.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 413,
        message: 'File too large. Maximum size is 5MB.',
      })
    }

    const extension = contentType.split('/')[1] || 'jpg'
    const objectKey = `settlement-proof/${wagerId}/${settlementId}/${crypto.randomUUID()}.${extension}`
    const proofData = Uint8Array.from(body.fileInfo.data).buffer

    await uploadToR2(event, objectKey, proofData, contentType)

    await db
      .update(napkinbetsSettlements)
      .set({
        proofImageUrl: objectKey,
      })
      .where(eq(napkinbetsSettlements.id, settlementId))
      .run()

    return {
      ok: true,
      proofImageUrl: objectKey,
    }
  },
)

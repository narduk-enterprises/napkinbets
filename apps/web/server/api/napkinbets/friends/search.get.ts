import { getQuery } from 'h3'
import { z } from 'zod'
import { searchNapkinbetsUsers } from '#server/services/napkinbets/social'

const querySchema = z.object({
  q: z.string().max(120).optional(),
})

export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({
      statusCode: 400,
      message: query.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const search = query.data.q ?? ''

  return {
    results: await searchNapkinbetsUsers(event, search),
  }
})

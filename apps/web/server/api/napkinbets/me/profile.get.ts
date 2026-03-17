import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '#layer/server/utils/auth'
import { users } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: sql<string>`avatar_url`.as('avatar_url'),
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found.' })
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    avatarUrl: user.avatarUrl ?? '',
  }
})

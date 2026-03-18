import { sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin } from '#layer/server/utils/auth'
import { users, napkinbetsWagers, napkinbetsParticipants } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import type { NapkinbetsAdminUsersResponse } from '../../../../../types/napkinbets'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export default defineEventHandler(async (event): Promise<NapkinbetsAdminUsersResponse> => {
  await requireAdmin(event)

  const queryResult = querySchema.safeParse(getQuery(event))
  if (!queryResult.success) {
    throw createError({ statusCode: 400, message: 'Invalid query parameters' })
  }
  const { page, limit } = queryResult.data
  const offset = (page - 1) * limit

  const db = useAppDatabase(event)

  // 1. Get total users count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(users)
  const total = countResult[0]?.count ?? 0

  // 2. Fetch paginated users (avatar_url is not in the Drizzle layer schema, use raw SQL)
  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      avatarUrl: sql<string>`avatar_url`.as('avatar_url'),
    })
    .from(users)
    .orderBy(users.createdAt)
    .limit(limit)
    .offset(offset)

  if (userRows.length === 0) {
    return { users: [], total }
  }

  // 3. Batched related wagers data
  const userIds = userRows.map((u) => u.id)

  const [ownedCountRows, joinedCountRows] = await Promise.all([
    db
      .select({
        userId: napkinbetsWagers.ownerUserId,
        count: sql<number>`count(*)`,
      })
      .from(napkinbetsWagers)
      .where(inArray(napkinbetsWagers.ownerUserId, userIds))
      .groupBy(napkinbetsWagers.ownerUserId),
    db
      .select({
        userId: napkinbetsParticipants.userId,
        count: sql<number>`count(*)`,
      })
      .from(napkinbetsParticipants)
      .where(inArray(napkinbetsParticipants.userId, userIds))
      .groupBy(napkinbetsParticipants.userId),
  ])

  // 4. Build response
  const ownedCountByUser = new Map<string, number>()
  for (const row of ownedCountRows) {
    if (row.userId) ownedCountByUser.set(row.userId, row.count)
  }
  const joinedCountByUser = new Map<string, number>()
  for (const row of joinedCountRows) {
    if (row.userId) joinedCountByUser.set(row.userId, row.count)
  }

  return {
    users: userRows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
      isAdmin: Boolean(user.isAdmin),
      createdAt: user.createdAt,
      ownedWagerCount: ownedCountByUser.get(user.id) ?? 0,
      joinedWagerCount: joinedCountByUser.get(user.id) ?? 0,
    })),
    total,
  }
})

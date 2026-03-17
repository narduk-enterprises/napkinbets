import { eq } from 'drizzle-orm'
import { users } from '#server/database/schema'
import { ensureSeedData } from '#server/services/napkinbets/pools'
import { useAppDatabase } from '#server/utils/database'
import { RATE_LIMIT_POLICIES, enforceRateLimitPolicy } from '#layer/server/utils/rateLimit'

const DEMO_USER_EMAIL = 'demo@napkinbets.app'

export default defineEventHandler(async (event) => {
  await enforceRateLimitPolicy(event, RATE_LIMIT_POLICIES.authLogin)
  await ensureSeedData(event)

  const db = useAppDatabase(event)
  const user = await db.select().from(users).where(eq(users.email, DEMO_USER_EMAIL)).get()

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Demo account is unavailable.',
    })
  }

  const cleanUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  }

  await setUserSession(event, { user: cleanUser })

  return { user: cleanUser }
})

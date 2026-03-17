import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '#server/database/schema'
import { hashUserPassword } from '#layer/server/utils/password'
import { RATE_LIMIT_POLICIES, enforceRateLimitPolicy } from '#layer/server/utils/rateLimit'
import { useAppDatabase } from '#server/utils/database'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export default defineEventHandler(async (event) => {
  const log = useLogger(event).child('Auth')
  await enforceRateLimitPolicy(event, RATE_LIMIT_POLICIES.authRegister)

  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const db = useAppDatabase(event)
  const normalizedEmail = parsed.data.email.toLowerCase()

  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()
  if (existingUser) {
    log.warn('Registration rejected — email exists', { email: normalizedEmail })
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already in use',
    })
  }

  const firstUser = await db.select({ id: users.id }).from(users).limit(1)
  const isAdmin = firstUser.length === 0
  const hashedPassword = await hashUserPassword(parsed.data.password)
  const newUserId = crypto.randomUUID()

  await db.insert(users).values({
    id: newUserId,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: parsed.data.name,
    isAdmin,
  })

  const user = {
    id: newUserId,
    name: parsed.data.name,
    email: normalizedEmail,
    isAdmin,
  }

  await setUserSession(event, { user })
  log.info('User registered', { email: normalizedEmail, userId: newUserId, isAdmin })

  return { user }
})

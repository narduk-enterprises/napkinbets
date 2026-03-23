import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '#server/database/schema'
import { hashUserPassword } from '#layer/server/utils/password'
import { RATE_LIMIT_POLICIES } from '#layer/server/utils/rateLimit'
import { definePublicMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { useAppDatabase } from '#server/utils/database'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export default definePublicMutation(
  {
    rateLimit: RATE_LIMIT_POLICIES.authRegister,
    parseBody: withValidatedBody(registerSchema.parse),
  },
  async ({ event, body }) => {
  const log = useLogger(event).child('Auth')

  const db = useAppDatabase(event)
  const normalizedEmail = body.email.toLowerCase()

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
  const hashedPassword = await hashUserPassword(body.password)
  const newUserId = crypto.randomUUID()

  await db.insert(users).values({
    id: newUserId,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: body.name,
    isAdmin,
  })

  const user = {
    id: newUserId,
    name: body.name,
    email: normalizedEmail,
    isAdmin,
  }

  await setUserSession(event, { user })
  log.info('User registered', { email: normalizedEmail, userId: newUserId, isAdmin })

  return { user }
  },
)

import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { users } from '#server/database/schema'
import { ensureSeedData } from '#server/services/napkinbets/pools'
import { useAppDatabase } from '#server/utils/database'

const DEMO_USER_EMAIL = 'demo@napkinbets.app'
const DEFAULT_DEMO_REDIRECT_PATH = '/dashboard'

export interface DemoSessionUser {
  id: string
  email: string
  name: string | null
  isAdmin: boolean | null
}

export async function resolveDemoSessionUser(event: H3Event): Promise<DemoSessionUser> {
  await ensureSeedData(event)

  const db = useAppDatabase(event)
  const user = await db.select().from(users).where(eq(users.email, DEMO_USER_EMAIL)).get()

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Demo account is unavailable.',
    })
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  }
}

export function normalizeDemoRedirectPath(input: unknown): string {
  if (typeof input !== 'string') {
    return DEFAULT_DEMO_REDIRECT_PATH
  }

  const redirectPath = input.trim()
  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    return DEFAULT_DEMO_REDIRECT_PATH
  }

  return redirectPath || DEFAULT_DEMO_REDIRECT_PATH
}

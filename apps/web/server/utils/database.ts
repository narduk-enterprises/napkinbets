/// <reference types="@cloudflare/workers-types" />
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '#server/database/schema'

export function useAppDatabase(event: H3Event): DrizzleD1Database<typeof schema> {
  if (event.context._appDb) {
    return event.context._appDb as DrizzleD1Database<typeof schema>
  }

  const d1 = (event.context.cloudflare?.env as { DB?: D1Database })?.DB
  if (!d1) {
    throw createError({
      statusCode: 500,
      message: 'D1 database binding not available. Ensure DB is configured in wrangler.json.',
    })
  }

  const db = drizzle(d1, { schema })
  event.context._appDb = db
  return db
}

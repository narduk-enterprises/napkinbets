import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './apps/web/server/database/schema.ts'
import fs from 'fs'
import glob from 'glob'

async function main() {
  const files = glob.sync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')
  if (files.length === 0) {
    console.log('No local D1 DB found')
    return
  }
  const client = createClient({ url: `file:${files[0]}` })
  const db = drizzle(client, { schema })
  const wagers = await db
    .select({ slug: schema.napkinbetsWagers.slug })
    .from(schema.napkinbetsWagers)
  console.log(
    'Slugs:',
    wagers.map((w) => w.slug),
  )
}
main()

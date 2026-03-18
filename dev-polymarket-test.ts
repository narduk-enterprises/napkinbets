import { extractEventId } from './apps/web/server/utils/ids' // just mimicking
import { useAppDatabase } from './apps/web/server/utils/database'
import { eq } from 'drizzle-orm'
import { napkinbetsEvents } from './apps/web/server/database/schema'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './apps/web/server/database/schema.ts'

const sqlite = new Database(
  './apps/web/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/6e1919420015520dc95116743b17c5d9ddcd34289dd4ee770c0cde35a6ff1a38.sqlite',
)
const db = drizzle(sqlite, { schema })

async function run() {
  const event = await db
    .select()
    .from(schema.napkinbetsEvents)
    .where(eq(schema.napkinbetsEvents.id, 'espn:mlb:401833248'))
    .limit(1)
    .get()
  if (!event) {
    console.log('Event not found')
    return
  }

  console.log('Event Title:', event.eventTitle)
  console.log('Away Team:', event.awayTeamJson)
  console.log('Home Team:', event.homeTeamJson)
  console.log('Start Time:', event.startTime)
}
run()

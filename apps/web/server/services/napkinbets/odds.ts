import { refreshActivelyTradedOdds as polymarketRefresh } from '#server/services/napkinbets/polymarket'

export async function refreshAllActivelyTradedOdds(
  db: import('drizzle-orm/d1').DrizzleD1Database<typeof import('#server/database/schema')>,
  limit = 15,
) {
  // 1. Refresh Polymarket odds
  const polymarketResult = await polymarketRefresh(db, limit)

  // 2. Refresh The Odds API odds (stubbed until mapped)
  const theOddsApiResult = { attempted: 0, updatedCount: 0 }
  try {
    // TODO: implement and call fetchTheOddsApi and fuzzy match against db events.
    // theOddsApiResult = await theOddsApiRefresh(db, limit)
  } catch (err) {
    console.error('The Odds API refresh failed:', err)
  }

  return {
    polymarket: polymarketResult,
    theOddsApi: theOddsApiResult,
  }
}

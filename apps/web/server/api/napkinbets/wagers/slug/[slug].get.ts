import { getRouterParam } from 'h3'
import { loadPoolData } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing wager slug.' })
  }

  const dashboard = await loadPoolData(event, { slug })
  const wager = dashboard.wagers[0] ?? null

  if (!wager) {
    throw createError({ statusCode: 404, message: 'Wager not found.' })
  }

  return {
    wager,
    refreshedAt: dashboard.refreshedAt,
  }
})

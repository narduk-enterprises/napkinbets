import { getRouterParam } from 'h3'
import { loadPoolData } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing wager slug.' })
  }

  const dashboard = await loadPoolData(event)
  const wager = dashboard.wagers.find((entry) => entry.slug === slug)

  if (!wager) {
    throw createError({ statusCode: 404, message: 'Wager not found.' })
  }

  return {
    wager,
    refreshedAt: dashboard.refreshedAt,
  }
})

import { createError } from 'h3'
import { loadLeagueProfile } from '#server/services/napkinbets/entities'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, message: 'Missing league key.' })
  }

  const league = await loadLeagueProfile(event, key)
  if (!league) {
    throw createError({ statusCode: 404, message: 'League not found.' })
  }

  return league
})

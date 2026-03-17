import { createError } from 'h3'
import { loadTeamProfileBySlug } from '#server/services/napkinbets/entities'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing team slug.' })
  }

  const team = await loadTeamProfileBySlug(event, slug)
  if (!team) {
    throw createError({ statusCode: 404, message: 'Team not found.' })
  }

  return team
})

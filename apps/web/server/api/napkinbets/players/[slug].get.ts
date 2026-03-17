import { createError } from 'h3'
import { loadPlayerProfileBySlug } from '#server/services/napkinbets/entities'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing player slug.' })
  }

  const player = await loadPlayerProfileBySlug(event, slug)
  if (!player) {
    throw createError({ statusCode: 404, message: 'Player not found.' })
  }

  return player
})

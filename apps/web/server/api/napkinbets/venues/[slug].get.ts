import { createError } from 'h3'
import { loadVenueProfileBySlug } from '#server/services/napkinbets/entities'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing venue slug.' })
  }

  const venue = await loadVenueProfileBySlug(event, slug)
  if (!venue) {
    throw createError({ statusCode: 404, message: 'Venue not found.' })
  }

  return venue
})

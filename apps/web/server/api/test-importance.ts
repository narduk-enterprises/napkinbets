import { defineEventHandler } from 'h3'
import { scoreEventsWithAi } from '#server/services/napkinbets/importance'

export default defineEventHandler(async (event) => {
  const result = await scoreEventsWithAi(event, { forceAll: true })
  return result
})

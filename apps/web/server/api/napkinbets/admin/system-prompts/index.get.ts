import { requireAdmin } from '#layer/server/utils/auth'
import { getAllSystemPrompts } from '#server/utils/systemPrompts'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getAllSystemPrompts(event)
})

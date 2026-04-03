import { requireAdmin } from '#layer/server/utils/auth'
import { getAllNapkinbetsSystemPrompts } from '#server/utils/systemPrompts'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getAllNapkinbetsSystemPrompts(event)
})

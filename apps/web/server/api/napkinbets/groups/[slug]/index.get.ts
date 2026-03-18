import { loadNapkinbetsGroup } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  return await loadNapkinbetsGroup(event, String(event.context.params?.slug))
})

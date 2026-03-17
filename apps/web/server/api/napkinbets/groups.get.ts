import { loadNapkinbetsGroupsBundle } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  return await loadNapkinbetsGroupsBundle(event)
})

import { loadNapkinbetsFriendsBundle } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  return await loadNapkinbetsFriendsBundle(event)
})

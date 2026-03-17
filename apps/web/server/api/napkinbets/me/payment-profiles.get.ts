import { loadUserPaymentProfiles } from '#server/services/napkinbets/payments'

export default defineEventHandler(async (event) => {
  return await loadUserPaymentProfiles(event)
})

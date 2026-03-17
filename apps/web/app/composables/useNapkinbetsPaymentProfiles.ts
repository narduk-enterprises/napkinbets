import type { NapkinbetsPaymentProfilesResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_PAYMENT_PROFILES: NapkinbetsPaymentProfilesResponse = {
  profiles: [],
}

export function useNapkinbetsPaymentProfiles() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsPaymentProfilesResponse>(
    'napkinbets-payment-profiles',
    () => api.getPaymentProfiles(),
    {
      default: () => EMPTY_PAYMENT_PROFILES,
    },
  )
}

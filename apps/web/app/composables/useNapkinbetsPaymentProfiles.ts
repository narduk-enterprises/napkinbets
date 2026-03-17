import type { NapkinbetsPaymentProfilesResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_PAYMENT_PROFILES: NapkinbetsPaymentProfilesResponse = {
  profiles: [],
}

type NapkinbetsAsyncOptions = {
  server?: boolean
  lazy?: boolean
}

export function useNapkinbetsPaymentProfiles(options?: NapkinbetsAsyncOptions) {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsPaymentProfilesResponse>(
    'napkinbets-payment-profiles',
    () => api.getPaymentProfiles(),
    {
      default: () => EMPTY_PAYMENT_PROFILES,
      ...options,
    },
  )
}

import type { NapkinbetsDiscoveryResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_DISCOVERY: NapkinbetsDiscoveryResponse = {
  liveEvents: [],
  upcomingEvents: [],
  propIdeas: [],
  refreshedAt: '',
}

export function useNapkinbetsDiscover() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsDiscoveryResponse>('napkinbets-discover', () => api.getDiscover(), {
    default: () => EMPTY_DISCOVERY,
  })
}

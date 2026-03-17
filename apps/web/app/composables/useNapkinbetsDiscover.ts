import type { NapkinbetsDiscoveryResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_DISCOVERY: NapkinbetsDiscoveryResponse = {
  sections: [],
  filters: {
    sports: [],
    contexts: [],
    leagues: [],
    states: [],
  },
  propIdeas: [],
  refreshedAt: '',
  stale: false,
}

export function useNapkinbetsDiscover() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsDiscoveryResponse>('napkinbets-discover', () => api.getDiscover(), {
    default: () => EMPTY_DISCOVERY,
  })
}

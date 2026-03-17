import type { NapkinbetsAdminResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_ADMIN: NapkinbetsAdminResponse = {
  metrics: [],
  users: [],
  wagers: [],
  totalCachedEvents: 0,
  featuredBetCount: 0,
  ingestRuns: [],
  tierSummaries: {},
  aiSettings: {
    aiRecommendationsEnabled: false,
    aiPropSuggestionsEnabled: false,
    aiTermsAssistEnabled: false,
    aiCloseoutAssistEnabled: false,
    xaiConfigured: false,
  },
  refreshedAt: '',
}

export function useNapkinbetsAdmin() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsAdminResponse>('napkinbets-admin', () => api.getAdminOverview(), {
    default: () => EMPTY_ADMIN,
  })
}

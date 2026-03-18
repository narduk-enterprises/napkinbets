import type { NapkinbetsAdminResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_ADMIN: NapkinbetsAdminResponse = {
  metrics: [],
  totalCachedEvents: 0,
  featuredBetCount: 0,
  ingestRuns: [],
  tierSummaries: {},
  aiSettings: {
    chatModel: 'grok-3-mini',
    aiRecommendationsEnabled: false,
    aiPropSuggestionsEnabled: false,
    aiTermsAssistEnabled: false,
    aiCloseoutAssistEnabled: false,
    xaiConfigured: false,
    theSportsDbConfigured: false,
  },
  refreshedAt: '',
}

export function useNapkinbetsAdmin() {
  const api = useNapkinbetsApi()

  return useLazyAsyncData<NapkinbetsAdminResponse>(
    'napkinbets-admin',
    () => api.getAdminOverview(),
    {
      default: () => EMPTY_ADMIN,
    },
  )
}

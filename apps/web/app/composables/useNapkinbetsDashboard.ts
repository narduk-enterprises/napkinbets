import type { NapkinbetsDashboardResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_DASHBOARD: NapkinbetsDashboardResponse = {
  concept: {
    summary: '',
    featureRequirements: [],
    architectureSuggestions: [],
    implementationPlan: [],
    compliance: [],
  },
  metrics: [],
  liveGames: [],
  weather: [],
  wagers: [],
  refreshedAt: '',
}

export function useNapkinbetsDashboard() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsDashboardResponse>('napkinbets-dashboard', () => api.getLanding(), {
    default: () => EMPTY_DASHBOARD,
  })
}

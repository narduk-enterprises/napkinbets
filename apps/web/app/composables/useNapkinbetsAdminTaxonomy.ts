import type { NapkinbetsAdminTaxonomyResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_ADMIN_TAXONOMY: NapkinbetsAdminTaxonomyResponse = {
  sports: [],
  contexts: [],
  leagues: [],
  entityCounts: {
    teams: 0,
    players: 0,
    venues: 0,
    rosters: 0,
  },
}

export function useNapkinbetsAdminTaxonomy() {
  const api = useNapkinbetsApi()

  return useLazyAsyncData<NapkinbetsAdminTaxonomyResponse>(
    'napkinbets-admin-taxonomy',
    () => api.getAdminTaxonomy(),
    {
      default: () => EMPTY_ADMIN_TAXONOMY,
    },
  )
}

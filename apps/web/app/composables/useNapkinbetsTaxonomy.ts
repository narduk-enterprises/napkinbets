import type { NapkinbetsTaxonomyResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_TAXONOMY: NapkinbetsTaxonomyResponse = {
  sports: [],
  contexts: [],
  leagues: [],
}

export function useNapkinbetsTaxonomy() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsTaxonomyResponse>('napkinbets-taxonomy', () => api.getTaxonomy(), {
    default: () => EMPTY_TAXONOMY,
  })
}

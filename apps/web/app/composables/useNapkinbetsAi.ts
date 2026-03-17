import type {
  NapkinbetsAiCloseoutSummaryInput,
  NapkinbetsAiTermsInput,
} from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

export function useNapkinbetsAi() {
  const api = useNapkinbetsApi()
  const config = useRuntimeConfig()

  return {
    enabled: computed(() => Boolean(config.public.aiRecommendationsEnabled)),
    rewriteTerms(payload: NapkinbetsAiTermsInput) {
      return api.rewriteTermsWithAi(payload)
    },
    draftCloseoutSummary(payload: NapkinbetsAiCloseoutSummaryInput) {
      return api.draftCloseoutSummary(payload)
    },
  }
}

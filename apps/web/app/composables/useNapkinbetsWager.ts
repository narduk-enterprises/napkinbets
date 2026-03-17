import type { MaybeRefOrGetter } from 'vue'
import type { NapkinbetsWagerResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_WAGER_RESPONSE: NapkinbetsWagerResponse = {
  wager: null,
  refreshedAt: '',
}

export function useNapkinbetsWager(slug: MaybeRefOrGetter<string>) {
  const api = useNapkinbetsApi()
  const resolvedSlug = computed(() => toValue(slug))

  return useAsyncData<NapkinbetsWagerResponse>(
    () => `napkinbets-wager:${resolvedSlug.value}`,
    () => api.getWager(resolvedSlug.value),
    {
      watch: [resolvedSlug],
      default: () => EMPTY_WAGER_RESPONSE,
    },
  )
}

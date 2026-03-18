import type { MaybeRefOrGetter } from 'vue'
import type { NapkinbetsGroupDetailResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

export function useNapkinbetsGroupDetail(slug: MaybeRefOrGetter<string>) {
  const api = useNapkinbetsApi()
  const resolvedSlug = computed(() => toValue(slug))

  return useAsyncData<NapkinbetsGroupDetailResponse>(
    () => `napkinbets-group-detail:${resolvedSlug.value}`,
    () => api.getGroup(resolvedSlug.value),
    {
      watch: [resolvedSlug],
    },
  )
}

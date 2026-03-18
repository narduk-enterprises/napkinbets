import { useNapkinbetsApi } from '../services/napkinbets-api'

export function useNapkinbetsGroupWagers(slug: string) {
  const api = useNapkinbetsApi()

  const { data, status, error, refresh } = useAsyncData(`napkinbets-group-wagers-${slug}`, () =>
    api.getGroupWagers(slug),
  )

  return {
    data,
    status,
    error,
    refresh,
  }
}

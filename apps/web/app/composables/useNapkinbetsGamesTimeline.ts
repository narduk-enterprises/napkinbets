import type { NapkinbetsEventCard } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const DEFAULT_LIMIT = 25

export function useNapkinbetsGamesTimeline() {
  const api = useNapkinbetsApi()
  const events = useState<NapkinbetsEventCard[]>('napkinbets-games-events', () => [])
  const nextCursor = useState<string | null>('napkinbets-games-next-cursor', () => null)
  const loadMorePending = useState<boolean>('napkinbets-games-load-more-pending', () => false)
  const selectedSport = useState<string>('napkinbets-games-sport', () => 'all')
  const selectedLeague = useState<string>('napkinbets-games-league', () => 'all')
  const selectedState = useState<string>('napkinbets-games-state', () => 'all')

  const fetchKey = computed(
    () => `napkinbets-games-${selectedSport.value}-${selectedLeague.value}-${selectedState.value}`,
  )

  const initialFetch = useAsyncData<NapkinbetsEventCard[]>(
    // eslint-disable-next-line narduk/valid-useAsyncData -- stable dynamic key
    fetchKey,
    async () => {
      const res = await api.getGames({
        limit: DEFAULT_LIMIT,
        sport: selectedSport.value === 'all' ? undefined : selectedSport.value,
        league: selectedLeague.value === 'all' ? undefined : selectedLeague.value,
        state: selectedState.value === 'all' ? undefined : (selectedState.value as 'pre' | 'in'),
      })
      events.value = res.events
      nextCursor.value = res.nextCursor
      return res.events
    },
    { default: () => [], server: true },
  )

  async function loadMore() {
    if (loadMorePending.value) return
    loadMorePending.value = true
    try {
      const res = await api.getGames({
        limit: DEFAULT_LIMIT,
        after: nextCursor.value ?? undefined,
        sport: selectedSport.value === 'all' ? undefined : selectedSport.value,
        league: selectedLeague.value === 'all' ? undefined : selectedLeague.value,
        state: selectedState.value === 'all' ? undefined : (selectedState.value as 'pre' | 'in'),
      })
      events.value = events.value.concat(res.events)
      nextCursor.value = res.nextCursor
    } finally {
      loadMorePending.value = false
    }
  }

  return {
    events,
    nextCursor,
    loadMorePending,
    loadMore,
    initialFetch,
    selectedSport,
    selectedLeague,
    selectedState,
  }
}

import type { ComputedRef } from 'vue'
import type {
  NapkinbetsDiscoverFilterOption,
  NapkinbetsDiscoveryResponse,
  NapkinbetsDiscoverySection,
} from '../../types/napkinbets'

interface DiscoverMetric {
  label: string
  value: string
  hint: string
  icon: string
}

function withAllOption(
  label: string,
  options: NapkinbetsDiscoverFilterOption[],
): NapkinbetsDiscoverFilterOption[] {
  return [{ label, value: 'all' }, ...options]
}

export function useNapkinbetsDiscoverPresentation(
  discovery: ComputedRef<NapkinbetsDiscoveryResponse>,
) {
  const selectedSport = ref('all')
  const selectedLeague = ref('all')
  const selectedState = ref('all')

  const sportOptions = computed(() => withAllOption('All sports', discovery.value.filters.sports))
  const leagueOptions = computed(() => {
    const filters = discovery.value.filters
    const leagues =
      selectedSport.value === 'all'
        ? filters.leagues
        : (filters.leaguesBySport?.[selectedSport.value] ?? [])
    return withAllOption('All leagues', leagues)
  })
  const stateOptions = computed(() => withAllOption('All statuses', discovery.value.filters.states))

  watch(selectedSport, (sport) => {
    if (sport === 'all') return
    const leaguesForSport = discovery.value.filters.leaguesBySport?.[sport] ?? []
    const leagueValues = new Set(leaguesForSport.map((o) => o.value))
    if (selectedLeague.value !== 'all' && !leagueValues.has(selectedLeague.value)) {
      selectedLeague.value = 'all'
    }
  })

  const filteredSections = computed<NapkinbetsDiscoverySection[]>(() =>
    discovery.value.sections
      .map((section) => ({
        ...section,
        events: section.events.filter((event) => {
          if (selectedSport.value !== 'all' && event.sport !== selectedSport.value) {
            return false
          }

          if (selectedLeague.value !== 'all' && event.league !== selectedLeague.value) {
            return false
          }

          if (selectedState.value !== 'all' && event.state !== selectedState.value) {
            return false
          }

          return true
        }),
      }))
      .filter((section) => section.events.length > 0),
  )

  const metrics = computed<DiscoverMetric[]>(() => {
    const liveCount = discovery.value.sections
      .flatMap((section) => section.events)
      .filter((event) => event.state === 'in').length
    const upcomingCount = discovery.value.sections
      .flatMap((section) => section.events)
      .filter((event) => event.state === 'pre').length

    return [
      {
        label: 'Live now',
        value: String(liveCount),
        hint: 'events already running',
        icon: 'i-lucide-activity',
      },
      {
        label: 'On deck',
        value: String(upcomingCount),
        hint: 'games coming up',
        icon: 'i-lucide-calendar-range',
      },
      {
        label: 'Leagues',
        value: String(discovery.value.filters.leagues.length),
        hint: 'worth a look this week',
        icon: 'i-lucide-panels-top-left',
      },
    ]
  })

  const hasFilteredResults = computed(() => filteredSections.value.length > 0)

  return {
    selectedSport,
    selectedLeague,
    selectedState,
    sportOptions,
    leagueOptions,
    stateOptions,
    filteredSections,
    spotlights: computed(() => discovery.value.spotlights),
    metrics,
    hasFilteredResults,
  }
}

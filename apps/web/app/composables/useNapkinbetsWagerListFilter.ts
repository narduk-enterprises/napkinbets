import type { NapkinbetsWager } from '../../types/napkinbets'

export type NapkinbetsWagerStage = 'upcoming' | 'live' | 'finished'

export type NapkinbetsWagerListFilterValue =
  | 'all'
  | 'upcoming'
  | 'live'
  | 'finished'
  | 'settled'
  | 'unsettled'

export interface NapkinbetsWagerFilterChip {
  value: NapkinbetsWagerListFilterValue
  label: string
  icon: string
}

const FINISHED_STATUSES = new Set(['settling', 'settled', 'closed', 'archived'])

function getWagerStage(
  wager: Pick<NapkinbetsWager, 'status' | 'eventState'>,
): NapkinbetsWagerStage {
  if (FINISHED_STATUSES.has(wager.status)) {
    return 'finished'
  }
  if (wager.eventState === 'in' || wager.status === 'live' || wager.status === 'locked') {
    return 'live'
  }
  return 'upcoming'
}

function isWagerFinished(wager: Pick<NapkinbetsWager, 'status'>): boolean {
  return FINISHED_STATUSES.has(wager.status)
}

function isWagerFullySettled(wager: NapkinbetsWager): boolean {
  if (!isWagerFinished(wager)) return false
  const settlements = wager.settlements ?? []
  return settlements.length > 0 && settlements.every((s) => s.verificationStatus === 'confirmed')
}

const BASE_CHIPS: NapkinbetsWagerFilterChip[] = [
  { value: 'all', label: 'All', icon: 'i-lucide-layers' },
  { value: 'upcoming', label: 'Upcoming', icon: 'i-lucide-calendar-clock' },
  { value: 'live', label: 'Live', icon: 'i-lucide-zap' },
  { value: 'finished', label: 'Finished', icon: 'i-lucide-flag-triangle-right' },
]

const EXTENDED_CHIPS: NapkinbetsWagerFilterChip[] = [
  ...BASE_CHIPS,
  { value: 'settled', label: 'Settled', icon: 'i-lucide-check-circle-2' },
  { value: 'unsettled', label: 'Unsettled', icon: 'i-lucide-circle-alert' },
]

export interface WagersByStage {
  upcoming: NapkinbetsWager[]
  live: NapkinbetsWager[]
  finished: NapkinbetsWager[]
}

function groupWagersByStage(wagers: NapkinbetsWager[]): WagersByStage {
  const upcoming: NapkinbetsWager[] = []
  const live: NapkinbetsWager[] = []
  const finished: NapkinbetsWager[] = []
  for (const w of wagers) {
    const stage = getWagerStage(w)
    if (stage === 'upcoming') upcoming.push(w)
    else if (stage === 'live') live.push(w)
    else finished.push(w)
  }
  return { upcoming, live, finished }
}

function filterWagers(
  wagers: NapkinbetsWager[],
  activeFilter: NapkinbetsWagerListFilterValue,
  options?: { extended?: boolean },
): NapkinbetsWager[] {
  return wagers.filter((wager) => {
    switch (activeFilter) {
      case 'upcoming':
        return getWagerStage(wager) === 'upcoming'
      case 'live':
        return getWagerStage(wager) === 'live'
      case 'finished':
        return getWagerStage(wager) === 'finished'
      case 'settled':
        return options?.extended && isWagerFullySettled(wager)
      case 'unsettled':
        return options?.extended && isWagerFinished(wager) && !isWagerFullySettled(wager)
      default:
        return true
    }
  })
}

export function useNapkinbetsWagerListFilter(options?: { extended?: boolean }) {
  const activeFilter = ref<NapkinbetsWagerListFilterValue>('all')
  const filterChips = options?.extended ? EXTENDED_CHIPS : BASE_CHIPS

  function filterWagerList(wagers: NapkinbetsWager[]) {
    return filterWagers(wagers, activeFilter.value, options)
  }

  return {
    filterChips,
    activeFilter,
    filterWagerList,
    groupWagersByStage,
    getWagerStage,
  }
}

import type { CreateWagerInput } from '../../types/napkinbets'

interface NapkinbetsCreateEventPreview {
  source: string
  eventId: string
  title: string
  startTime: string
  status: string
  sport: string
  contextKey: string
  league: string
  venueName: string
  homeTeamName: string
  awayTeamName: string
}

export const NAPKINBETS_DEFAULT_CREATE_INPUT: CreateWagerInput = {
  title: 'Tonight’s bet',
  creatorName: '',
  description:
    'A friendly one-on-one bet with a clear side, one stake, and manual settle-up after the result is official.',
  napkinType: 'simple-bet',
  boardType: 'community-created',
  format: 'head-to-head',
  sport: 'basketball',
  contextKey: 'pro',
  league: 'nba',
  customContextName: '',
  groupId: '',
  sideOptions: 'Side A\nSide B',
  participantNames: '',
  potRules: 'Winner: 100',
  entryFeeDollars: 20,
  paymentService: 'Venmo',
  paymentHandle: '',
  venueName: 'Group chat or watch party',
  latitude: '',
  longitude: '',
  terms:
    'Friendly bets only. Napkinbets tracks the bet, reminders, and payment proof, but all transfers happen manually through your preferred payment app.',
}

const NAPKINBETS_PRESET_CREATE_INPUTS: Record<string, Partial<CreateWagerInput>> = {
  'masters-week': {
    title: 'Masters week group bet',
    description:
      'A golf-first group bet for Masters week with featured golfer lanes, low-round sweats, and manual settle-up after the final round is official.',
    napkinType: 'pool',
    boardType: 'manual-curated',
    format: 'golf-draft',
    sport: 'golf',
    contextKey: 'tournament',
    league: 'pga',
    customContextName: '',
    groupId: '',
    sideOptions: 'Green Jacket winner\nLow Thursday round\nPlayoff yes/no',
    potRules: 'Champion: 50\nLow round: 25\nWeekend charge: 25',
    venueName: 'Augusta watch party or clubhouse',
    terms:
      'Friendly bets only. Masters week group bets settle manually after the official result posts, and payment proof still lives outside the app.',
  },
}

function getQueryString(value: QueryValue) {
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string') ?? ''
  }

  return value ?? ''
}

function buildSideOptions(homeTeamName: string, awayTeamName: string) {
  if (!homeTeamName || !awayTeamName) {
    return NAPKINBETS_DEFAULT_CREATE_INPUT.sideOptions
  }

  return `${awayTeamName}\n${homeTeamName}`
}

function buildTitle(eventTitle: string, homeTeamName: string, awayTeamName: string) {
  if (homeTeamName && awayTeamName) {
    return `${awayTeamName} at ${homeTeamName} bet`
  }

  return eventTitle || NAPKINBETS_DEFAULT_CREATE_INPUT.title
}

export function useNapkinbetsCreatePrefill() {
  const route = useRoute()
  const preset = computed(() => getQueryString(route.query.preset))
  const requestedNapkinType = computed(() =>
    getQueryString(route.query.napkinType) === 'pool' ? 'pool' : 'simple-bet',
  )
  const requestedGroupId = computed(() => getQueryString(route.query.groupId))

  const eventPreview = computed<NapkinbetsCreateEventPreview | null>(() => {
    const source = getQueryString(route.query.source)
    const eventId = getQueryString(route.query.eventId)
    const title = getQueryString(route.query.eventTitle)
    const startTime = getQueryString(route.query.eventStartsAt)
    const status = getQueryString(route.query.eventStatus)
    const sport = getQueryString(route.query.sport)
    const contextKey = getQueryString(route.query.contextKey)
    const league = getQueryString(route.query.league)
    const venueName = getQueryString(route.query.venueName)
    const homeTeamName = getQueryString(route.query.homeTeamName)
    const awayTeamName = getQueryString(route.query.awayTeamName)

    if (!title && !homeTeamName && !awayTeamName) {
      return null
    }

    return {
      source,
      eventId,
      title,
      startTime,
      status,
      sport,
      contextKey,
      league,
      venueName,
      homeTeamName,
      awayTeamName,
    }
  })

  const createMode = computed<'event' | 'manual'>(() => {
    const requestedMode = getQueryString(route.query.createMode)
    if (requestedMode === 'manual') {
      return 'manual'
    }

    if (eventPreview.value || requestedMode === 'event') {
      return 'event'
    }

    return 'manual'
  })

  const prefill = computed<CreateWagerInput>(() => {
    const preview = eventPreview.value
    const presetDefaults = NAPKINBETS_PRESET_CREATE_INPUTS[preset.value] ?? {}

    if (!preview) {
      return {
        ...NAPKINBETS_DEFAULT_CREATE_INPUT,
        ...presetDefaults,
        napkinType: requestedNapkinType.value,
        groupId: requestedGroupId.value,
      }
    }

    return {
      ...NAPKINBETS_DEFAULT_CREATE_INPUT,
      ...presetDefaults,
      title: buildTitle(preview.title, preview.homeTeamName, preview.awayTeamName),
      description:
        preview.homeTeamName && preview.awayTeamName
          ? `Friendly bet for ${preview.awayTeamName} at ${preview.homeTeamName}, with one clear side and manual payment confirmation after the result is official.`
          : NAPKINBETS_DEFAULT_CREATE_INPUT.description,
      napkinType: requestedNapkinType.value,
      boardType: 'event-backed',
      format:
        requestedNapkinType.value === 'simple-bet'
          ? 'head-to-head'
          : getQueryString(route.query.format) || 'sports-game',
      sport: preview.sport || NAPKINBETS_DEFAULT_CREATE_INPUT.sport,
      contextKey: preview.contextKey || NAPKINBETS_DEFAULT_CREATE_INPUT.contextKey,
      league: preview.league || NAPKINBETS_DEFAULT_CREATE_INPUT.league,
      groupId: requestedGroupId.value,
      sideOptions:
        getQueryString(route.query.sideOptions) ||
        buildSideOptions(preview.homeTeamName, preview.awayTeamName),
      venueName: preview.venueName || NAPKINBETS_DEFAULT_CREATE_INPUT.venueName,
      eventSource: preview.source || 'espn',
      eventId: preview.eventId,
      eventTitle: preview.title,
      eventStartsAt: preview.startTime,
      eventStatus: preview.status || 'open',
      homeTeamName: preview.homeTeamName,
      awayTeamName: preview.awayTeamName,
    }
  })

  return {
    createMode,
    eventPreview,
    prefill,
  }
}
type QueryValue = string | null | Array<string | null> | undefined

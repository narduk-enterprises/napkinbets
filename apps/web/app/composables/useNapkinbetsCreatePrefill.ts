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
  title: 'Wednesday watch party pool',
  creatorName: '',
  description:
    'A friendly pool for tonight with a clean side market, manual payment proof, and one fast prop that settles off the broadcast.',
  boardType: 'community-created',
  format: 'sports-game',
  sport: 'basketball',
  contextKey: 'pro',
  league: 'nba',
  customContextName: '',
  sideOptions: 'Home side\nAway side\nFeatured prop',
  participantNames: '',
  potRules: 'Winner: 70\nCloser call: 30',
  entryFeeDollars: 20,
  paymentService: 'Venmo',
  paymentHandle: '',
  venueName: 'Group chat or watch party',
  latitude: '',
  longitude: '',
  terms:
    'Friendly bets only. Napkinbets tracks the pool, reminders, and payment proof, but all transfers happen manually through your preferred payment app.',
}

const NAPKINBETS_PRESET_CREATE_INPUTS: Record<string, Partial<CreateWagerInput>> = {
  'masters-week': {
    title: 'Masters week pool',
    description:
      'A golf-first pool for Masters week with featured golfer lanes, low-round sweats, and manual settle-up after the final round is official.',
    boardType: 'manual-curated',
    format: 'golf-draft',
    sport: 'golf',
    contextKey: 'tournament',
    league: 'pga',
    customContextName: '',
    sideOptions: 'Green Jacket winner\nLow Thursday round\nPlayoff yes/no',
    potRules: 'Champion: 50\nLow round: 25\nWeekend charge: 25',
    venueName: 'Augusta watch party or clubhouse',
    terms:
      'Friendly bets only. Masters week pools settle manually after the official result posts, and payment proof still lives outside the app.',
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

  return `${awayTeamName} wins\n${homeTeamName} wins\nFirst featured prop`
}

function buildTitle(eventTitle: string, homeTeamName: string, awayTeamName: string) {
  if (homeTeamName && awayTeamName) {
    return `${awayTeamName} at ${homeTeamName} pool`
  }

  return eventTitle || NAPKINBETS_DEFAULT_CREATE_INPUT.title
}

export function useNapkinbetsCreatePrefill() {
  const route = useRoute()
  const preset = computed(() => getQueryString(route.query.preset))

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
      return { ...NAPKINBETS_DEFAULT_CREATE_INPUT, ...presetDefaults }
    }

    return {
      ...NAPKINBETS_DEFAULT_CREATE_INPUT,
      ...presetDefaults,
      title: buildTitle(preview.title, preview.homeTeamName, preview.awayTeamName),
      description:
        preview.homeTeamName && preview.awayTeamName
          ? `Friendly pool for ${preview.awayTeamName} at ${preview.homeTeamName}, with a simple side market, one prop lane, and manual payment confirmation after the result is official.`
          : NAPKINBETS_DEFAULT_CREATE_INPUT.description,
      boardType: 'event-backed',
      format: getQueryString(route.query.format) || NAPKINBETS_DEFAULT_CREATE_INPUT.format,
      sport: preview.sport || NAPKINBETS_DEFAULT_CREATE_INPUT.sport,
      contextKey: preview.contextKey || NAPKINBETS_DEFAULT_CREATE_INPUT.contextKey,
      league: preview.league || NAPKINBETS_DEFAULT_CREATE_INPUT.league,
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

import type { CreateWagerInput } from '../../types/napkinbets'

interface NapkinbetsCreateEventPreview {
  source: string
  eventId: string
  title: string
  startTime: string
  status: string
  sport: string
  league: string
  venueName: string
  homeTeamName: string
  awayTeamName: string
}

export const NAPKINBETS_DEFAULT_CREATE_INPUT: CreateWagerInput = {
  title: 'Wednesday watch party board',
  creatorName: '',
  description:
    'A friendly board for tonight with a clean side market, manual payment proof, and one fast prop that settles off the broadcast.',
  format: 'sports-game',
  sport: 'basketball',
  league: 'nba',
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
    'Friendly wagers only. Napkinbets tracks the board, reminders, and payment proof, but all transfers happen manually through your preferred payment app.',
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
    return `${awayTeamName} at ${homeTeamName} board`
  }

  return eventTitle || NAPKINBETS_DEFAULT_CREATE_INPUT.title
}

export function useNapkinbetsCreatePrefill() {
  const route = useRoute()

  const eventPreview = computed<NapkinbetsCreateEventPreview | null>(() => {
    const source = getQueryString(route.query.source)
    const eventId = getQueryString(route.query.eventId)
    const title = getQueryString(route.query.eventTitle)
    const startTime = getQueryString(route.query.eventStartsAt)
    const status = getQueryString(route.query.eventStatus)
    const sport = getQueryString(route.query.sport)
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
    if (!preview) {
      return { ...NAPKINBETS_DEFAULT_CREATE_INPUT }
    }

    return {
      ...NAPKINBETS_DEFAULT_CREATE_INPUT,
      title: buildTitle(preview.title, preview.homeTeamName, preview.awayTeamName),
      description:
        preview.homeTeamName && preview.awayTeamName
          ? `Friendly board for ${preview.awayTeamName} at ${preview.homeTeamName}, with a simple side market, one prop lane, and manual payment confirmation after the result is official.`
          : NAPKINBETS_DEFAULT_CREATE_INPUT.description,
      format: getQueryString(route.query.format) || NAPKINBETS_DEFAULT_CREATE_INPUT.format,
      sport: preview.sport || NAPKINBETS_DEFAULT_CREATE_INPUT.sport,
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

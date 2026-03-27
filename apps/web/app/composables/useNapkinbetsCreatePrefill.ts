import type { CreateWagerInput } from '../../types/napkinbets'
import {
  findNapkinbetsGameTemplate,
  getNapkinbetsDefaultTemplateKey,
  getNapkinbetsTemplateCreatePrefill,
} from '../utils/napkinbets-game-templates'

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

const NAPKINBETS_PRESET_TEMPLATE_KEYS: Record<string, string> = {
  'masters-week': 'golf-major-challenge',
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
  const requestedNapkinType = computed(() => getQueryString(route.query.napkinType))
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

  const rawRequestedTemplate = computed(
    () =>
      getQueryString(route.query.template) ||
      NAPKINBETS_PRESET_TEMPLATE_KEYS[preset.value] ||
      getQueryString(route.query.format),
  )

  const templateKey = computed(() =>
    getNapkinbetsDefaultTemplateKey({
      sport: eventPreview.value?.sport,
      templateKey: rawRequestedTemplate.value,
      napkinType:
        requestedNapkinType.value === 'simple-bet'
          ? 'simple-bet'
          : requestedNapkinType.value === 'pool'
            ? 'pool'
            : undefined,
      createMode: createMode.value,
    }),
  )

  const template = computed(() =>
    findNapkinbetsGameTemplate(templateKey.value, eventPreview.value?.sport),
  )

  const templateDefaults = computed(() =>
    getNapkinbetsTemplateCreatePrefill(templateKey.value, eventPreview.value?.sport),
  )

  const resolvedNapkinType = computed<'simple-bet' | 'pool'>(() => {
    if (requestedNapkinType.value === 'simple-bet') {
      return 'simple-bet'
    }

    if (requestedNapkinType.value === 'pool') {
      return 'pool'
    }

    return templateDefaults.value.napkinType === 'pool' ? 'pool' : 'simple-bet'
  })

  const prefill = computed<CreateWagerInput>(() => {
    const preview = eventPreview.value
    const basePrefill = {
      ...NAPKINBETS_DEFAULT_CREATE_INPUT,
      ...templateDefaults.value,
      groupId: requestedGroupId.value,
      napkinType: resolvedNapkinType.value,
      format: resolvedNapkinType.value === 'simple-bet' ? 'head-to-head' : templateKey.value,
    }

    if (!preview) {
      return {
        ...basePrefill,
      }
    }

    const eventModeFormat =
      resolvedNapkinType.value === 'simple-bet' ? 'head-to-head' : templateKey.value
    const eventTitle =
      templateKey.value === 'head-to-head' || templateKey.value === 'winner-pool'
        ? buildTitle(preview.title, preview.homeTeamName, preview.awayTeamName)
        : basePrefill.title
    const sideOptions =
      getQueryString(route.query.sideOptions) ||
      (eventModeFormat === 'head-to-head' || eventModeFormat === 'winner-pool'
        ? buildSideOptions(preview.homeTeamName, preview.awayTeamName)
        : basePrefill.sideOptions)

    return {
      ...basePrefill,
      title: eventTitle,
      boardType: 'event-backed',
      format: eventModeFormat,
      sport: preview.sport || basePrefill.sport,
      contextKey: preview.contextKey || basePrefill.contextKey,
      league: preview.league || basePrefill.league,
      sideOptions,
      venueName: preview.venueName || basePrefill.venueName,
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
    template,
    templateKey,
  }
}
type QueryValue = string | null | Array<string | null> | undefined

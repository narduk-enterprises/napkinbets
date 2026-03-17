import type { ComputedRef } from 'vue'
import type { CreateWagerInput, NapkinbetsTaxonomyResponse } from '../../types/napkinbets'

interface UseNapkinbetsCreateBuilderOptions {
  prefill: ComputedRef<CreateWagerInput>
  mode: ComputedRef<'event' | 'manual'>
  taxonomy: ComputedRef<NapkinbetsTaxonomyResponse>
}

interface PotTemplateOption {
  label: string
  value: string
  rules: string[]
  formats?: string[]
}

interface SideTemplateOption {
  label: string
  value: string
  options: string[]
  formats?: string[]
}

const POT_TEMPLATE_OPTIONS: PotTemplateOption[] = [
  {
    label: 'Winner takes all',
    value: 'winner-take-all',
    rules: ['Winner: 100'],
  },
  {
    label: 'Main plus sweat',
    value: 'main-plus-sweat',
    rules: ['Winner: 70', 'Closer call: 30'],
  },
  {
    label: 'Golf weekend',
    value: 'golf-weekend',
    rules: ['Champion: 50', 'Low round: 25', 'Weekend charge: 25'],
    formats: ['golf-draft'],
  },
]

const VENUE_PRESET_OPTIONS = [
  { label: 'Group chat', value: 'Group chat' },
  { label: 'Living room watch party', value: 'Living room watch party' },
  { label: 'Sports bar table', value: 'Sports bar table' },
  { label: 'Clubhouse', value: 'Clubhouse' },
  { label: 'Course patio', value: 'Course patio' },
  { label: 'Custom', value: '__custom__' },
] as const

const SIDE_TEMPLATE_OPTIONS: SideTemplateOption[] = [
  {
    label: 'Winner lane',
    value: 'winner-lane',
    options: ['Side A wins', 'Side B wins', 'Closer call'],
    formats: ['sports-game', 'sports-race', 'custom-prop'],
  },
  {
    label: 'Yes / no',
    value: 'yes-no',
    options: ['Yes', 'No', 'Bonus sweat'],
    formats: ['sports-prop', 'custom-prop'],
  },
  {
    label: 'Golf finish',
    value: 'golf-finish',
    options: ['Champion', 'Low round', 'Weekend charge'],
    formats: ['golf-draft'],
  },
]

const SEAT_PRESET_OPTIONS = [
  { label: '4 seats', value: 4 },
  { label: '6 seats', value: 6 },
  { label: '8 seats', value: 8 },
] as const

type VenuePresetValue = (typeof VENUE_PRESET_OPTIONS)[number]['value']

const DEFAULT_POT_RULES = POT_TEMPLATE_OPTIONS[0]?.rules ?? ['Winner: 100']

function parseLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function inferPotTemplate(format: string, rules: string) {
  const normalizedRules = parseLines(rules)

  return (
    POT_TEMPLATE_OPTIONS.find((template) => {
      if (template.formats && !template.formats.includes(format)) {
        return false
      }

      return normalizedRules.join('|') === template.rules.join('|')
    })?.value || (format === 'golf-draft' ? 'golf-weekend' : 'main-plus-sweat')
  )
}

export function useNapkinbetsCreateBuilder(options: UseNapkinbetsCreateBuilderOptions) {
  const formState = reactive<CreateWagerInput>({
    ...options.prefill.value,
  })

  const sideOptionList = ref<string[]>(parseLines(options.prefill.value.sideOptions))
  const participantList = ref<string[]>(parseLines(options.prefill.value.participantNames))
  const sideOptionDraft = ref('')
  const participantDraft = ref('')
  const selectedPotTemplate = ref(inferPotTemplate(formState.format, formState.potRules))
  const selectedVenuePreset = ref<VenuePresetValue>(
    VENUE_PRESET_OPTIONS.find((option) => option.value === formState.venueName)?.value ||
      'Group chat',
  )

  const selectedSport = computed(
    () => options.taxonomy.value.sports.find((sport) => sport.value === formState.sport) ?? null,
  )
  const selectedContext = computed(
    () =>
      options.taxonomy.value.contexts.find((context) => context.value === formState.contextKey) ??
      null,
  )
  const selectedLeague = computed(
    () =>
      options.taxonomy.value.leagues.find((league) => league.value === formState.league) ?? null,
  )

  const sportOptions = computed(() =>
    options.taxonomy.value.sports.map((sport) => ({
      label: sport.label,
      value: sport.value,
    })),
  )

  const contextOptions = computed(() => {
    const allContexts = options.taxonomy.value.contexts

    switch (formState.sport) {
      case 'entertainment':
        return allContexts.filter((context) =>
          ['entertainment', 'community'].includes(context.value),
        )
      case 'track-field':
        return allContexts.filter((context) =>
          ['high-school', 'college', 'community', 'tournament'].includes(context.value),
        )
      case 'other':
        return allContexts.filter((context) =>
          ['community', 'high-school', 'tournament', 'international'].includes(context.value),
        )
      default:
        return allContexts.filter((context) => context.value !== 'entertainment')
    }
  })

  const leagueOptions = computed(() =>
    options.taxonomy.value.leagues
      .filter(
        (league) =>
          league.sport === formState.sport && league.contextKeys.includes(formState.contextKey),
      )
      .map((league) => ({
        label: league.label,
        value: league.value,
      })),
  )

  const venueOptions = computed(() =>
    VENUE_PRESET_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  )

  const seatPresetOptions = computed(() =>
    SEAT_PRESET_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  )

  const showCustomContextName = computed(
    () =>
      options.mode.value === 'manual' &&
      (leagueOptions.value.length === 0 ||
        formState.contextKey === 'community' ||
        formState.contextKey === 'high-school'),
  )

  const showCustomVenue = computed(
    () => options.mode.value === 'manual' && selectedVenuePreset.value === '__custom__',
  )

  const suggestedSideOptions = computed(() => parseLines(options.prefill.value.sideOptions))

  const sideTemplateOptions = computed(() =>
    SIDE_TEMPLATE_OPTIONS.filter(
      (template) => !template.formats || template.formats.includes(formState.format),
    ).map((template) => ({
      label: template.label,
      value: template.value,
    })),
  )

  const potTemplateOptions = computed(() =>
    POT_TEMPLATE_OPTIONS.filter(
      (template) => !template.formats || template.formats.includes(formState.format),
    ).map((template) => ({
      label: template.label,
      value: template.value,
    })),
  )

  const selectedPotRules = computed(
    () =>
      POT_TEMPLATE_OPTIONS.find((template) => template.value === selectedPotTemplate.value)
        ?.rules ?? DEFAULT_POT_RULES,
  )

  const boardSummary = computed(() => {
    if (options.mode.value === 'event') {
      return `Friendly ${formState.format.replaceAll('-', ' ')} for ${formState.title}, with a clean board and manual settlement after the official result.`
    }

    return `Friendly ${formState.format.replaceAll('-', ' ')} for ${selectedLeague.value?.label || selectedSport.value?.label || 'the room'}, with quick side lanes and manual settlement outside the app.`
  })

  const closeoutTerms = computed(() => {
    const provider = formState.paymentService || 'your payment app'

    if (formState.format === 'golf-draft') {
      return `Friendly wagers only. ${provider} settlement happens manually after the official leaderboard posts, and the board owner confirms the final result before the room closes out.`
    }

    return `Friendly wagers only. ${provider} settlement happens manually after the official result posts, and Napkinbets records the board, reminders, and proof instead of moving money.`
  })

  const payload = computed<CreateWagerInput>(() => ({
    ...formState,
    description: boardSummary.value,
    sideOptions: sideOptionList.value.join('\n'),
    participantNames: participantList.value.join('\n'),
    potRules: selectedPotRules.value.join('\n'),
    terms: closeoutTerms.value,
    venueName:
      options.mode.value === 'event'
        ? formState.venueName
        : selectedVenuePreset.value === '__custom__'
          ? formState.venueName
          : selectedVenuePreset.value,
  }))

  function syncFromPrefill(prefill: CreateWagerInput) {
    Object.assign(formState, prefill)
    sideOptionList.value = parseLines(prefill.sideOptions)
    participantList.value = parseLines(prefill.participantNames)
    selectedPotTemplate.value = inferPotTemplate(prefill.format, prefill.potRules)
    selectedVenuePreset.value =
      VENUE_PRESET_OPTIONS.find((option) => option.value === prefill.venueName)?.value ||
      '__custom__'
  }

  function addParticipant() {
    const value = participantDraft.value.trim()
    if (!value || participantList.value.includes(value)) {
      participantDraft.value = ''
      return
    }

    participantList.value = [...participantList.value, value]
    participantDraft.value = ''
  }

  function removeParticipant(name: string) {
    participantList.value = participantList.value.filter((participant) => participant !== name)
  }

  function applySeatPreset(count: number) {
    participantList.value = Array.from({ length: count }, (_, index) => `Seat ${index + 1}`)
  }

  function addSideOption() {
    const value = sideOptionDraft.value.trim()
    if (!value || sideOptionList.value.includes(value)) {
      sideOptionDraft.value = ''
      return
    }

    sideOptionList.value = [...sideOptionList.value, value]
    sideOptionDraft.value = ''
  }

  function removeSideOption(option: string) {
    sideOptionList.value = sideOptionList.value.filter((item) => item !== option)
  }

  function applySideTemplate(templateValue: string) {
    const template = SIDE_TEMPLATE_OPTIONS.find((item) => item.value === templateValue)
    if (!template) {
      return
    }

    sideOptionList.value = [...template.options]
  }

  function resetSideOptions() {
    sideOptionList.value = suggestedSideOptions.value.length ? [...suggestedSideOptions.value] : []
  }

  watch(
    () => options.prefill.value,
    (prefill) => {
      syncFromPrefill(prefill)
    },
    { immediate: true },
  )

  watch(
    () => options.mode.value,
    (mode) => {
      formState.boardType = mode === 'event' ? 'event-backed' : 'community-created'
    },
    { immediate: true },
  )

  watch(
    [() => formState.sport, () => formState.contextKey, leagueOptions],
    ([sport, contextKey, availableLeagues]) => {
      if (options.mode.value === 'event' || !sport) {
        return
      }

      const contextIsValid = contextOptions.value.some((context) => context.value === contextKey)
      if (!contextIsValid) {
        formState.contextKey = contextOptions.value[0]?.value || 'community'
        return
      }

      if (!availableLeagues.some((league) => league.value === formState.league)) {
        formState.league = availableLeagues[0]?.value || ''
      }
    },
    { immediate: true },
  )

  watch(
    () => formState.format,
    (format) => {
      if (format === 'golf-draft' && selectedPotTemplate.value === 'main-plus-sweat') {
        selectedPotTemplate.value = 'golf-weekend'
      }
    },
  )

  watch(selectedVenuePreset, (value) => {
    if (options.mode.value === 'manual' && value !== '__custom__') {
      formState.venueName = value
    }
  })

  return {
    formState,
    selectedSport,
    selectedContext,
    selectedLeague,
    sportOptions,
    contextOptions,
    leagueOptions,
    venueOptions,
    potTemplateOptions,
    seatPresetOptions,
    showCustomContextName,
    showCustomVenue,
    sideOptionList,
    participantList,
    sideTemplateOptions,
    sideOptionDraft,
    participantDraft,
    selectedPotTemplate,
    selectedVenuePreset,
    suggestedSideOptions,
    boardSummary,
    closeoutTerms,
    payload,
    addParticipant,
    removeParticipant,
    applySeatPreset,
    addSideOption,
    removeSideOption,
    applySideTemplate,
    resetSideOptions,
  }
}

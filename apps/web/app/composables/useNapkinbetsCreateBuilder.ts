import type { ComputedRef } from 'vue'
import type {
  CreateWagerInput,
  NapkinbetsFriend,
  NapkinbetsGroup,
  NapkinbetsTaxonomyResponse,
} from '../../types/napkinbets'

interface UseNapkinbetsCreateBuilderOptions {
  prefill: ComputedRef<CreateWagerInput>
  mode: ComputedRef<'event' | 'manual'>
  taxonomy: ComputedRef<NapkinbetsTaxonomyResponse>
  friends: ComputedRef<NapkinbetsFriend[]>
  groups: ComputedRef<NapkinbetsGroup[]>
  initialFriendId: ComputedRef<string>
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
}

interface ParticipantSeedDraft {
  displayName: string
  userId: string | null
}

const POOL_FORMAT_OPTIONS = [
  { label: 'Pick a winner', value: 'sports-game' },
  { label: 'Prop pool', value: 'sports-prop' },
  { label: 'Golf draft', value: 'golf-draft' },
  { label: 'Custom room', value: 'custom-prop' },
]

const PAYMENT_OPTIONS = [
  { label: 'Venmo', value: 'Venmo' },
  { label: 'PayPal', value: 'PayPal' },
  { label: 'Cash App', value: 'Cash App' },
  { label: 'Zelle', value: 'Zelle' },
]

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

const SIDE_TEMPLATE_OPTIONS: SideTemplateOption[] = [
  {
    label: 'Winner / winner',
    value: 'winner',
    options: ['Side A', 'Side B'],
  },
  {
    label: 'Yes / no',
    value: 'yes-no',
    options: ['Yes', 'No'],
  },
  {
    label: 'Golf lanes',
    value: 'golf',
    options: ['Champion', 'Low round', 'Weekend charge'],
  },
]

const VENUE_PRESET_OPTIONS = [
  { label: 'Group chat', value: 'Group chat' },
  { label: 'Watch party', value: 'Watch party' },
  { label: 'Sports bar', value: 'Sports bar' },
  { label: 'Clubhouse', value: 'Clubhouse' },
  { label: 'Course patio', value: 'Course patio' },
  { label: 'Custom', value: '__custom__' },
] as const

const SEAT_PRESET_OPTIONS = [
  { label: '4 seats', value: 4 },
  { label: '6 seats', value: 6 },
  { label: '8 seats', value: 8 },
] as const

type VenuePresetValue = (typeof VENUE_PRESET_OPTIONS)[number]['value']

function parseLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueParticipants(participants: ParticipantSeedDraft[]) {
  const seen = new Set<string>()
  const deduped: ParticipantSeedDraft[] = []

  for (const participant of participants) {
    const key = participant.displayName.trim().toLowerCase()
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push({
      displayName: participant.displayName.trim(),
      userId: participant.userId,
    })
  }

  return deduped
}

function inferPotTemplate(format: string, rules: string) {
  const normalizedRules = parseLines(rules)

  return (
    POT_TEMPLATE_OPTIONS.find((template) => {
      if (template.formats && !template.formats.includes(format)) {
        return false
      }

      return normalizedRules.join('|') === template.rules.join('|')
    })?.value || (format === 'golf-draft' ? 'golf-weekend' : 'winner-take-all')
  )
}

export function useNapkinbetsCreateBuilder(options: UseNapkinbetsCreateBuilderOptions) {
  const formState = reactive<CreateWagerInput>({
    ...options.prefill.value,
  })

  const selectedOpponentId = ref(options.initialFriendId.value)
  const manualOpponentName = ref('')
  const simpleSideA = ref('Side A')
  const simpleSideB = ref('Side B')
  const selectedSimpleSide = ref(0)
  const participantDraft = ref('')
  const poolParticipants = ref<ParticipantSeedDraft[]>([])
  const sideOptionList = ref<string[]>(parseLines(options.prefill.value.sideOptions))
  const sideOptionDraft = ref('')
  const selectedPotTemplate = ref(inferPotTemplate(formState.format, formState.potRules))
  const selectedVenuePreset = ref<VenuePresetValue>('Group chat')

  const selectedSport = computed(
    () => options.taxonomy.value.sports.find((sport) => sport.value === formState.sport) ?? null,
  )
  const selectedLeague = computed(
    () =>
      options.taxonomy.value.leagues.find((league) => league.value === formState.league) ?? null,
  )
  const selectedGroup = computed(
    () => options.groups.value.find((group) => group.id === formState.groupId) ?? null,
  )
  const selectedOpponent = computed(
    () => options.friends.value.find((friend) => friend.id === selectedOpponentId.value) ?? null,
  )
  const isSimpleBet = computed(() => formState.napkinType === 'simple-bet')

  const sportOptions = computed(() =>
    options.taxonomy.value.sports.map((sport) => ({
      label: sport.label,
      value: sport.value,
    })),
  )

  const contextOptions = computed(() =>
    options.taxonomy.value.contexts.map((context) => ({
      label: context.label,
      value: context.value,
    })),
  )

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

  const groupOptions = computed(() =>
    options.groups.value.map((group) => ({
      label: group.name,
      value: group.id,
    })),
  )

  const friendOptions = computed(() =>
    options.friends.value.map((friend) => ({
      label: friend.displayName,
      value: friend.id,
    })),
  )

  const poolFormatOptions = computed(() =>
    POOL_FORMAT_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  )

  const paymentOptions = computed(() =>
    PAYMENT_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  )

  const venueOptions = computed(() =>
    VENUE_PRESET_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
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

  const sideTemplateOptions = computed(() =>
    SIDE_TEMPLATE_OPTIONS.map((template) => ({
      label: template.label,
      value: template.value,
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
        ['community', 'high-school'].includes(formState.contextKey)),
  )

  const showCustomVenue = computed(
    () => options.mode.value === 'manual' && selectedVenuePreset.value === '__custom__',
  )

  const attachedEventSides = computed(() =>
    parseLines(options.prefill.value.sideOptions).slice(0, 2),
  )

  const resolvedSimpleSides = computed(() => {
    if (options.mode.value === 'event' && attachedEventSides.value.length >= 2) {
      return attachedEventSides.value
    }

    return [simpleSideA.value.trim() || 'Side A', simpleSideB.value.trim() || 'Side B']
  })

  const simpleBetOpponentName = computed(
    () => selectedOpponent.value?.displayName || manualOpponentName.value.trim(),
  )

  const selectedPotRules = computed(
    () =>
      POT_TEMPLATE_OPTIONS.find((template) => template.value === selectedPotTemplate.value)
        ?.rules ?? ['Winner: 100'],
  )

  const boardSummary = computed(() => {
    if (isSimpleBet.value) {
      const opponent = simpleBetOpponentName.value || 'one opponent'
      const eventLabel =
        options.mode.value === 'event'
          ? formState.eventTitle || formState.title
          : selectedLeague.value?.label || selectedSport.value?.label || 'the room'

      return `One-on-one napkin for ${eventLabel}, set against ${opponent}, with one stake and manual settle-up after the result is official.`
    }

    return `Group napkin for ${formState.title}, with shared sides, tracked entries, and manual settle-up outside the app.`
  })

  const closeoutTerms = computed(() => {
    const provider = formState.paymentService || 'your payment app'

    return `Friendly bets only. ${provider} settlement happens manually after the official result posts, and Napkinbets records the napkin, reminders, and proof instead of moving money.`
  })

  const payload = computed<CreateWagerInput>(() => {
    const creatorName = formState.creatorName.trim() || options.prefill.value.creatorName
    const basePayload = {
      ...formState,
      creatorName,
      boardType: options.mode.value === 'event' ? 'event-backed' : 'community-created',
      customContextName: formState.customContextName.trim(),
      groupId: formState.groupId.trim(),
      paymentHandle: formState.paymentHandle.trim(),
      venueName:
        options.mode.value === 'event'
          ? formState.venueName
          : selectedVenuePreset.value === '__custom__'
            ? formState.venueName.trim()
            : selectedVenuePreset.value,
      terms: closeoutTerms.value,
    } satisfies CreateWagerInput

    if (isSimpleBet.value) {
      const baseSides = resolvedSimpleSides.value.slice(0, 2)
      const orderedSides =
        selectedSimpleSide.value === 0 ? baseSides : [baseSides[1]!, baseSides[0]!]
      const participantSeeds = uniqueParticipants([
        {
          displayName: creatorName,
          userId: null,
        },
        {
          displayName: simpleBetOpponentName.value,
          userId: selectedOpponent.value?.id ?? null,
        },
      ])

      return {
        ...basePayload,
        napkinType: 'simple-bet',
        format: 'head-to-head',
        description: boardSummary.value,
        sideOptions: orderedSides.join('\n'),
        participantNames: participantSeeds.map((participant) => participant.displayName).join('\n'),
        participantSeeds,
        shuffleParticipants: false,
        potRules: 'Winner: 100',
      }
    }

    const participantSeeds = uniqueParticipants(poolParticipants.value)

    return {
      ...basePayload,
      napkinType: 'pool',
      description: boardSummary.value,
      sideOptions: sideOptionList.value.join('\n'),
      participantNames: participantSeeds.map((participant) => participant.displayName).join('\n'),
      participantSeeds,
      shuffleParticipants: true,
      potRules: selectedPotRules.value.join('\n'),
    }
  })

  function syncFromPrefill(prefill: CreateWagerInput) {
    Object.assign(formState, prefill)
    selectedOpponentId.value = options.initialFriendId.value
    manualOpponentName.value = ''
    selectedSimpleSide.value = 0
    sideOptionList.value = parseLines(prefill.sideOptions)
    const defaultSides = parseLines(prefill.sideOptions)
    simpleSideA.value = defaultSides[0] ?? 'Side A'
    simpleSideB.value = defaultSides[1] ?? 'Side B'
    poolParticipants.value =
      prefill.participantSeeds?.map((participant) => ({
        displayName: participant.displayName,
        userId: participant.userId ?? null,
      })) ??
      parseLines(prefill.participantNames).map((displayName) => ({
        displayName,
        userId: null,
      }))
    selectedPotTemplate.value = inferPotTemplate(prefill.format, prefill.potRules)
    selectedVenuePreset.value =
      VENUE_PRESET_OPTIONS.find((option) => option.value === prefill.venueName)?.value ||
      'Group chat'
  }

  function addPoolParticipant() {
    const value = participantDraft.value.trim()
    if (!value) {
      participantDraft.value = ''
      return
    }

    poolParticipants.value = uniqueParticipants([
      ...poolParticipants.value,
      { displayName: value, userId: null },
    ])
    participantDraft.value = ''
  }

  function addFriendToPool(friendId: string) {
    const friend = options.friends.value.find((item) => item.id === friendId)
    if (!friend) {
      return
    }

    poolParticipants.value = uniqueParticipants([
      ...poolParticipants.value,
      { displayName: friend.displayName, userId: friend.id },
    ])
  }

  function removePoolParticipant(displayName: string) {
    poolParticipants.value = poolParticipants.value.filter(
      (participant) => participant.displayName !== displayName,
    )
  }

  function applySeatPreset(count: number) {
    poolParticipants.value = Array.from({ length: count }, (_, index) => ({
      displayName: `Seat ${index + 1}`,
      userId: null,
    }))
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
    () => formState.napkinType,
    (napkinType) => {
      if (napkinType === 'simple-bet') {
        formState.format = 'head-to-head'
        selectedPotTemplate.value = 'winner-take-all'
      } else if (formState.format === 'head-to-head') {
        formState.format = options.mode.value === 'event' ? 'sports-game' : 'custom-prop'
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
    isSimpleBet,
    selectedSport,
    selectedLeague,
    selectedGroup,
    selectedOpponent,
    selectedOpponentId,
    manualOpponentName,
    simpleSideA,
    simpleSideB,
    selectedSimpleSide,
    resolvedSimpleSides,
    sportOptions,
    contextOptions,
    leagueOptions,
    groupOptions,
    friendOptions,
    poolFormatOptions,
    paymentOptions,
    venueOptions,
    potTemplateOptions,
    sideTemplateOptions,
    seatPresetOptions,
    selectedPotTemplate,
    selectedVenuePreset,
    showCustomContextName,
    showCustomVenue,
    poolParticipants,
    participantDraft,
    sideOptionList,
    sideOptionDraft,
    boardSummary,
    payload,
    addPoolParticipant,
    addFriendToPool,
    removePoolParticipant,
    applySeatPreset,
    addSideOption,
    removeSideOption,
    applySideTemplate,
  }
}

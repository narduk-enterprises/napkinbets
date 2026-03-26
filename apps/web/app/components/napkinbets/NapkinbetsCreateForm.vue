<script setup lang="ts">
import type {
  CreateWagerInput,
  NapkinbetsFriend,
  NapkinbetsGroup,
  NapkinbetsTaxonomyResponse,
  NapkinbetsGeneratedNapkin,
} from '../../../types/napkinbets'
import { useNapkinbetsApi } from '../../services/napkinbets-api'

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

const emit = defineEmits<{
  create: [payload: CreateWagerInput]
}>()

const props = defineProps<{
  loading: boolean
  prefill: CreateWagerInput
  mode: 'event' | 'manual'
  eventPreview: NapkinbetsCreateEventPreview | null
  taxonomy: NapkinbetsTaxonomyResponse
  friends: NapkinbetsFriend[]
  groups: NapkinbetsGroup[]
  initialFriendId: string
  isAuthenticated: boolean
}>()

const {
  formState,
  isSimpleBet,
  selectedSport: _selectedSport,
  selectedLeague: _selectedLeague,
  selectedGroup: _selectedGroup,
  selectedOpponent,
  selectedOpponentId,
  manualOpponentName,
  simpleSideA,
  simpleSideB,
  selectedSimpleSide,
  resolvedSimpleSides,
  sportOptions: _sportOptions,
  contextOptions: _contextOptions,
  leagueOptions: _leagueOptions,
  groupOptions: _groupOptions,
  friendOptions,
  poolFormatOptions,
  paymentOptions,
  venueOptions: _venueOptions,
  potTemplateOptions,
  sideTemplateOptions,
  seatPresetOptions,
  selectedPotTemplate,
  selectedVenuePreset: _selectedVenuePreset,
  showCustomContextName: _showCustomContextName,
  showCustomVenue: _showCustomVenue,
  poolParticipants,
  participantDraft,
  sideOptionList,
  sideOptionDraft,
  legList,
  boardSummary,
  payload,
  addPoolParticipant,
  addFriendToPool,
  removePoolParticipant,
  applySeatPreset,
  addSideOption,
  removeSideOption,
  applySideTemplate,
  addLeg,
  removeLeg,
  addLegOption,
  removeLegOption,
} = useNapkinbetsCreateBuilder({
  prefill: computed(() => props.prefill),
  mode: computed(() => props.mode),
  taxonomy: computed(() => props.taxonomy),
  friends: computed(() => props.friends),
  groups: computed(() => props.groups),
  initialFriendId: computed(() => props.initialFriendId),
})

const aiEnabled = useNapkinbetsAi().enabled
const api = useNapkinbetsApi()
const suggestingLegs = ref(false)
const toast = useToast()

async function handleSuggestLegs() {
  if (suggestingLegs.value || !formState.title.trim()) return
  suggestingLegs.value = true
  try {
    const eventContext = props.eventPreview
      ? {
          eventTitle: props.eventPreview.title,
          sport: props.eventPreview.sport,
          league: props.eventPreview.league,
          homeTeamName: props.eventPreview.homeTeamName,
          awayTeamName: props.eventPreview.awayTeamName,
        }
      : undefined
    const result = await api.suggestLegs({
      title: formState.title,
      format: formState.format,
      existingLegs: legList.value
        .filter((leg) => leg.questionText.trim())
        .map((leg) => ({ questionText: leg.questionText })),
      eventContext,
    })
    for (const suggested of result.legs) {
      addLeg()
      const newLeg = legList.value.at(-1)
      if (newLeg) {
        newLeg.questionText = suggested.questionText
        newLeg.legType = suggested.legType || 'categorical'
        newLeg.options = suggested.options || []
        newLeg.numericUnit = suggested.numericUnit || ''
      }
    }
    toast.add({
      title: 'Suggestions added',
      description: `${result.legs.length} questions added`,
      color: 'success',
    })
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    toast.add({
      title: 'AI Error',
      description: e.data?.message || e.message || 'Failed to suggest legs',
      color: 'error',
    })
  } finally {
    suggestingLegs.value = false
  }
}

function applyGeneratedNapkin(napkin: Partial<NapkinbetsGeneratedNapkin>) {
  if (napkin.title) {
    formState.title = napkin.title
  }
  if (napkin.description) {
    formState.description = napkin.description
  }
  if (napkin.format) {
    formState.format = napkin.format
  }
  if (napkin.category) {
    formState.customContextName = napkin.category
  }

  if (napkin.terms) {
    formState.terms = napkin.terms
  }

  // Set simple sides if it's head-to-head and there are 2 sides
  if (napkin.sideOptions && napkin.sideOptions.length >= 2 && isSimpleBet.value) {
    simpleSideA.value = napkin.sideOptions[0] || ''
    simpleSideB.value = napkin.sideOptions[1] || ''
  }

  // Apply AI-generated legs
  if (napkin.legs && napkin.legs.length > 0) {
    legList.value = napkin.legs.map((leg) => ({
      questionText: leg.questionText || '',
      legType: leg.legType || 'categorical',
      options: leg.options || [],
      numericUnit: leg.numericUnit || '',
      optionDraft: '',
    }))
  }

  // Auto-match participants against friends list
  if (napkin.participants && napkin.participants.length > 0) {
    const creatorName = formState.creatorName.trim() || props.prefill.creatorName
    const matched = napkin.participants
      .filter((name) => name.toLowerCase() !== creatorName.toLowerCase())
      .map((name) => {
        const friend = props.friends.find((f) => f.displayName.toLowerCase() === name.toLowerCase())
        return {
          displayName: friend?.displayName || name,
          userId: friend?.id || null,
        }
      })

    if (matched.length > 1) {
      // Multiple participants → auto-switch to Group Pool
      formState.napkinType = 'pool'
      poolParticipants.value = matched
    } else if (matched.length === 1) {
      // Single participant → head-to-head opponent
      const opponent = matched[0]!
      if (opponent.userId) {
        selectedOpponentId.value = opponent.userId
      } else {
        selectedOpponentId.value = ''
        manualOpponentName.value = opponent.displayName
      }
    }
  }
}
const _showMoreOptions = ref(false)

const _showEventQuickFlow = computed(
  () => props.mode === 'event' && Boolean(props.eventPreview) && isSimpleBet.value,
)

const canSubmit = computed(() => {
  if (!payload.value.title.trim()) {
    return false
  }

  if (!payload.value.creatorName.trim()) {
    return false
  }

  if (!payload.value.paymentService.trim()) {
    return false
  }

  if (isSimpleBet.value) {
    return Boolean(
      resolvedSimpleSides.value[0]?.trim() &&
      resolvedSimpleSides.value[1]?.trim() &&
      (selectedOpponent.value?.displayName || manualOpponentName.value.trim()),
    )
  }

  return Boolean(sideOptionList.value.length > 1)
})

const quickEventLabel = computed(() => {
  if (!props.eventPreview) {
    return formState.eventTitle || formState.title
  }

  if (props.eventPreview.awayTeamName && props.eventPreview.homeTeamName) {
    return `${props.eventPreview.awayTeamName} at ${props.eventPreview.homeTeamName}`
  }

  return props.eventPreview.title
})

const quickOpponentLabel = computed(
  () => selectedOpponent.value?.displayName || manualOpponentName.value.trim() || 'your friend',
)

const quickSelectionLabel = computed(
  () => resolvedSimpleSides.value[selectedSimpleSide.value] || 'your side',
)

const _quickSummary = computed(() => {
  const amount = Number(formState.entryFeeDollars) || 0
  const amountLabel = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

  return `${quickOpponentLabel.value} on ${quickEventLabel.value}, ${quickSelectionLabel.value}, ${amountLabel} stake.`
})

function _switchToGroupBet() {
  formState.napkinType = 'pool'
  _showMoreOptions.value = false
}

const selectedSideTemplate = ref('')
const stakeChips = [1, 5, 10, 20, 50, 100]

function handleSideTemplateChange(value: string) {
  selectedSideTemplate.value = value
  applySideTemplate(value)
}

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('create', payload.value)
}
</script>

<template>
  <UCard id="napkinbets-create" class="napkinbets-panel">
    <!-- AI Generator -->
    <div v-if="aiEnabled" class="mb-6">
      <NapkinbetsAiGenerator
        :event-context="
          eventPreview ? { ...eventPreview, eventTitle: eventPreview.title } : undefined
        "
        :friend-names="friendOptions.map((f) => f.label)"
        @use-napkin="applyGeneratedNapkin"
      />
    </div>

    <UForm :state="formState" class="space-y-6" @submit.prevent="submit">
      <!-- Step 1: Game attachment -->
      <div class="space-y-3">
        <p class="napkinbets-kicker">Step 1</p>
        <h3 class="napkinbets-subsection-title">
          {{ mode === 'event' && eventPreview ? "What's the game?" : "What's the bet?" }}
        </h3>

        <div
          v-if="mode === 'event' && eventPreview"
          class="napkinbets-surface flex flex-wrap items-center justify-between gap-3"
        >
          <div class="min-w-0 space-y-1">
            <p class="napkinbets-surface-label">Game attached</p>
            <p class="truncate font-semibold text-default">
              {{
                eventPreview.awayTeamName && eventPreview.homeTeamName
                  ? `${eventPreview.awayTeamName} at ${eventPreview.homeTeamName}`
                  : eventPreview.title
              }}
            </p>
            <p class="text-sm text-muted">
              {{ eventPreview.status || 'Scheduled' }}
              {{ eventPreview.venueName ? ` · ${eventPreview.venueName}` : '' }}
            </p>
          </div>
          <UButton to="/events" color="neutral" variant="ghost" size="sm" icon="i-lucide-repeat">
            Change
          </UButton>
        </div>

        <div v-else class="space-y-3">
          <UButton to="/events" color="primary" variant="soft" icon="i-lucide-search">
            Find a game
          </UButton>
          <UFormField name="title" label="Bet title">
            <UInput
              v-model="formState.title"
              class="w-full"
              placeholder="e.g. Will it rain on Saturday?, Who eats first?"
            />
          </UFormField>
        </div>
      </div>

      <USeparator />

      <!-- Step 2: Bet type -->
      <div class="space-y-3">
        <p class="napkinbets-kicker">Step 2</p>
        <h3 class="napkinbets-subsection-title">What kind of bet?</h3>

        <div class="grid gap-3 sm:grid-cols-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="napkinbets-choice-panel h-auto"
            :class="{ 'napkinbets-choice-panel-active': formState.napkinType === 'simple-bet' }"
            @click="formState.napkinType = 'simple-bet'"
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-swords" class="size-5" />
              <span class="font-semibold text-default">Head-to-Head</span>
            </span>
            <span class="text-sm text-muted">One opponent, one winner.</span>
          </UButton>

          <UButton
            color="neutral"
            variant="ghost"
            class="napkinbets-choice-panel h-auto"
            :class="{ 'napkinbets-choice-panel-active': formState.napkinType === 'pool' }"
            @click="formState.napkinType = 'pool'"
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="size-5" />
              <span class="font-semibold text-default">Group Pool</span>
            </span>
            <span class="text-sm text-muted">Multiple people, multiple outcomes.</span>
          </UButton>
        </div>
      </div>

      <USeparator />

      <!-- Step 3: Simple bet setup (opponent + side) -->
      <div v-if="isSimpleBet" class="space-y-4">
        <p class="napkinbets-kicker">Step 3</p>
        <h3 class="napkinbets-subsection-title">Set up your bet</h3>

        <!-- Opponent -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Who are you betting against?</p>

          <div v-if="friendOptions.length" class="napkinbets-chip-grid">
            <UButton
              :color="selectedOpponentId ? 'neutral' : 'primary'"
              :variant="selectedOpponentId ? 'ghost' : 'soft'"
              size="sm"
              @click="selectedOpponentId = ''"
            >
              Type a name
            </UButton>
            <UButton
              v-for="friend in friendOptions"
              :key="friend.value"
              :color="selectedOpponentId === friend.value ? 'primary' : 'neutral'"
              :variant="selectedOpponentId === friend.value ? 'soft' : 'ghost'"
              size="sm"
              @click="selectedOpponentId = friend.value"
            >
              {{ friend.label }}
            </UButton>
          </div>

          <UFormField v-if="!selectedOpponent" name="manualOpponentName" label="Opponent name">
            <UInput v-model="manualOpponentName" class="w-full" placeholder="Pat Donnelly" />
          </UFormField>
        </div>

        <!-- Side selection -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Pick your side</p>

          <div v-if="mode === 'manual' && !eventPreview" class="grid gap-3 sm:grid-cols-2">
            <UFormField name="simpleSideA" label="Side A">
              <UInput v-model="simpleSideA" class="w-full" placeholder="Yes" />
            </UFormField>
            <UFormField name="simpleSideB" label="Side B">
              <UInput v-model="simpleSideB" class="w-full" placeholder="No" />
            </UFormField>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UButton
              v-for="(side, index) in resolvedSimpleSides"
              :key="side"
              color="neutral"
              variant="ghost"
              class="napkinbets-choice-panel h-auto"
              :class="{ 'napkinbets-choice-panel-active': selectedSimpleSide === index }"
              @click="selectedSimpleSide = index"
            >
              <span class="font-semibold text-default">{{ side }}</span>
              <span class="text-sm text-muted">
                {{ index === selectedSimpleSide ? '✓ Your side' : 'Tap to pick' }}
              </span>
            </UButton>
          </div>
        </div>
      </div>

      <!-- Step 3: Pool setup (participants, format, sides) -->
      <div v-else class="space-y-4">
        <p class="napkinbets-kicker">Step 3</p>
        <h3 class="napkinbets-subsection-title">Set up your pool</h3>

        <!-- Pool format -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Pool format</p>
          <USelect v-model="formState.format" :items="poolFormatOptions" class="w-full" />
        </div>

        <!-- Participants -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Who's in?</p>

          <!-- Seat presets -->
          <div class="napkinbets-chip-grid">
            <UButton
              v-for="preset in seatPresetOptions"
              :key="preset.value"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="applySeatPreset(preset.value)"
            >
              {{ preset.label }}
            </UButton>
          </div>

          <!-- Friend chips -->
          <div v-if="friendOptions.length" class="napkinbets-chip-grid">
            <UButton
              v-for="friend in friendOptions"
              :key="friend.value"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="addFriendToPool(friend.value)"
            >
              <UIcon name="i-lucide-user-plus" class="size-3.5" />
              {{ friend.label }}
            </UButton>
          </div>

          <!-- Manual add -->
          <div class="flex gap-2">
            <UInput
              v-model="participantDraft"
              class="w-full"
              placeholder="Add participant name"
              @keydown.prevent.enter="addPoolParticipant"
            />
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              :disabled="!participantDraft.trim()"
              @click="addPoolParticipant"
            >
              Add
            </UButton>
          </div>

          <!-- Participant list -->
          <div v-if="poolParticipants.length" class="space-y-1">
            <div
              v-for="(participant, index) in poolParticipants"
              :key="`participant-${index}`"
              class="napkinbets-surface flex items-center justify-between py-2"
            >
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted font-mono">{{ index + 1 }}</span>
                <span class="text-sm text-default">{{ participant.displayName }}</span>
                <UBadge v-if="participant.userId" color="primary" variant="subtle" size="xs">
                  Linked
                </UBadge>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-x"
                @click="removePoolParticipant(participant.displayName)"
              />
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            No participants yet. Add from friends or type a name above.
          </p>
        </div>

        <!-- Side options -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Side options</p>

          <!-- Side templates -->
          <USelect
            :model-value="selectedSideTemplate"
            :items="sideTemplateOptions"
            class="w-full"
            placeholder="Pick a template..."
            @update:model-value="handleSideTemplateChange"
          />

          <!-- Manual add -->
          <div class="flex gap-2">
            <UInput
              v-model="sideOptionDraft"
              class="w-full"
              placeholder="Add a side option"
              @keydown.prevent.enter="addSideOption"
            />
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-plus"
              :disabled="!sideOptionDraft.trim()"
              @click="addSideOption"
            >
              Add
            </UButton>
          </div>

          <!-- Current sides -->
          <div v-if="sideOptionList.length" class="napkinbets-chip-grid">
            <UBadge
              v-for="side in sideOptionList"
              :key="`side-${side}`"
              color="primary"
              variant="subtle"
              size="md"
              class="cursor-pointer"
              @click="removeSideOption(side)"
            >
              {{ side }}
              <UIcon name="i-lucide-x" class="size-3 ml-1" />
            </UBadge>
          </div>
          <p v-else class="text-sm text-muted">
            Add at least 2 sides for participants to pick from.
          </p>
        </div>

        <!-- Pot template -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-default">Payout rules</p>
          <USelect v-model="selectedPotTemplate" :items="potTemplateOptions" class="w-full" />
        </div>
      </div>

      <USeparator />

      <!-- Step 4: Questions / Legs (optional, available for both types) -->
      <div class="space-y-4">
        <p class="napkinbets-kicker">Step {{ isSimpleBet ? 4 : 4 }}</p>
        <h3 class="napkinbets-subsection-title">Questions (optional)</h3>
        <p class="text-sm text-muted">
          Add questions for participants to answer. Each question is a separate leg of the bet.
        </p>

        <!-- Existing legs -->
        <div v-if="legList.length" class="space-y-4">
          <UCard
            v-for="(leg, legIndex) in legList"
            :key="`leg-${legIndex}`"
            class="napkinbets-panel"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-default">Question {{ legIndex + 1 }}</p>
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="removeLeg(legIndex)"
                />
              </div>

              <UFormField :name="`leg-${legIndex}-question`" label="Question">
                <UInput
                  v-model="leg.questionText"
                  class="w-full"
                  placeholder="e.g. Who scores first?"
                />
              </UFormField>

              <UFormField :name="`leg-${legIndex}-type`" label="Answer type">
                <USelect
                  v-model="leg.legType"
                  :items="[
                    { label: 'Pick from options', value: 'categorical' },
                    { label: 'Enter a number', value: 'numeric' },
                  ]"
                  class="w-full"
                />
              </UFormField>

              <!-- Categorical options -->
              <div v-if="leg.legType === 'categorical'" class="space-y-2">
                <div class="flex gap-2">
                  <UInput
                    v-model="leg.optionDraft"
                    class="w-full"
                    placeholder="Add an answer option"
                    @keydown.prevent.enter="addLegOption(legIndex)"
                  />
                  <UButton
                    color="primary"
                    variant="soft"
                    icon="i-lucide-plus"
                    size="sm"
                    :disabled="!leg.optionDraft.trim()"
                    @click="addLegOption(legIndex)"
                  >
                    Add
                  </UButton>
                </div>
                <div v-if="leg.options.length" class="napkinbets-chip-grid">
                  <UBadge
                    v-for="option in leg.options"
                    :key="`leg-${legIndex}-opt-${option}`"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    class="cursor-pointer"
                    @click="removeLegOption(legIndex, option)"
                  >
                    {{ option }}
                    <UIcon name="i-lucide-x" class="size-3 ml-1" />
                  </UBadge>
                </div>
              </div>

              <!-- Numeric unit -->
              <div v-else class="space-y-2">
                <UFormField :name="`leg-${legIndex}-unit`" label="Unit (optional)">
                  <UInput
                    v-model="leg.numericUnit"
                    class="w-full"
                    placeholder="e.g. points, inches, dollars"
                  />
                </UFormField>
              </div>
            </div>
          </UCard>
        </div>

        <div class="flex gap-2">
          <UButton color="neutral" variant="soft" icon="i-lucide-plus-circle" @click="addLeg">
            Add a question
          </UButton>
          <UButton
            v-if="aiEnabled"
            color="primary"
            variant="soft"
            icon="i-lucide-sparkles"
            :loading="suggestingLegs"
            :disabled="!formState.title.trim()"
            @click="handleSuggestLegs"
          >
            Suggest questions
          </UButton>
        </div>
      </div>

      <USeparator />

      <!-- Step 5: Stake + Payment -->
      <div class="space-y-4">
        <p class="napkinbets-kicker">Step {{ isSimpleBet ? 5 : 5 }}</p>
        <h3 class="napkinbets-subsection-title">Stake &amp; payment</h3>

        <div class="napkinbets-form-grid">
          <UFormField name="entryFeeDollars" label="Stake ($)">
            <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
          </UFormField>

          <UFormField name="paymentService" label="Settle-up app">
            <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
          </UFormField>
        </div>

        <div class="napkinbets-chip-grid">
          <UButton
            v-for="chip in stakeChips"
            :key="`stake-${chip}`"
            :color="Number(formState.entryFeeDollars) === chip ? 'primary' : 'neutral'"
            :variant="Number(formState.entryFeeDollars) === chip ? 'soft' : 'ghost'"
            size="sm"
            @click="formState.entryFeeDollars = chip"
          >
            ${{ chip }}
          </UButton>
        </div>
      </div>

      <USeparator />

      <!-- Summary + Submit -->
      <div class="napkinbets-surface space-y-3">
        <p class="napkinbets-surface-label">Ready</p>
        <p class="text-sm leading-6 text-default">{{ boardSummary }}</p>
        <UButton
          type="submit"
          color="primary"
          size="lg"
          :loading="loading"
          :disabled="!canSubmit"
          class="w-full justify-center"
        >
          {{ isAuthenticated ? 'Send the bet' : 'Create account to publish' }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  CreateWagerInput,
  NapkinbetsFriend,
  NapkinbetsGroup,
  NapkinbetsTaxonomyResponse,
} from '../../../types/napkinbets'

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
  poolFormatOptions: _poolFormatOptions,
  paymentOptions,
  venueOptions: _venueOptions,
  potTemplateOptions: _potTemplateOptions,
  sideTemplateOptions: _sideTemplateOptions,
  seatPresetOptions: _seatPresetOptions,
  selectedPotTemplate: _selectedPotTemplate,
  selectedVenuePreset: _selectedVenuePreset,
  showCustomContextName: _showCustomContextName,
  showCustomVenue: _showCustomVenue,
  poolParticipants: _poolParticipants,
  participantDraft: _participantDraft,
  sideOptionList,
  sideOptionDraft: _sideOptionDraft,
  boardSummary,
  payload,
  addPoolParticipant: _addPoolParticipant,
  addFriendToPool: _addFriendToPool,
  removePoolParticipant: _removePoolParticipant,
  applySeatPreset: _applySeatPreset,
  addSideOption: _addSideOption,
  removeSideOption: _removeSideOption,
  applySideTemplate: _applySideTemplate,
} = useNapkinbetsCreateBuilder({
  prefill: computed(() => props.prefill),
  mode: computed(() => props.mode),
  taxonomy: computed(() => props.taxonomy),
  friends: computed(() => props.friends),
  groups: computed(() => props.groups),
  initialFriendId: computed(() => props.initialFriendId),
})

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

const _formSummary = computed(() =>
  props.mode === 'event'
    ? 'Start from the attached game, then only choose the people, side, and stake.'
    : 'Keep it light: one-on-one first, group only when you actually need it.',
)

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

function submit() {
  if (!canSubmit.value) {
    return
  }

  emit('create', payload.value)
}
</script>

<template>
  <UCard id="napkinbets-create" class="napkinbets-panel">
    <UForm :state="formState" class="space-y-6" @submit.prevent="submit">
      <!-- Step 1: Game attachment -->
      <div class="space-y-3">
        <p class="napkinbets-kicker">Step 1</p>
        <h3 class="napkinbets-subsection-title">What's the game?</h3>

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
          <UFormField name="title" label="Or type a custom bet title">
            <UInput v-model="formState.title" class="w-full" placeholder="e.g. Will it rain on Saturday?" />
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
            disabled
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="size-5" />
              <span class="font-semibold text-default">Group Pool</span>
              <UBadge color="neutral" variant="subtle" size="xs">Soon</UBadge>
            </span>
            <span class="text-sm text-muted">Multiple people, multiple outcomes.</span>
          </UButton>
        </div>
      </div>

      <USeparator />

      <!-- Step 3: Opponent + Side + Stake -->
      <div class="space-y-4">
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
              <UInput v-model="simpleSideA" class="w-full" placeholder="Cowboys" />
            </UFormField>
            <UFormField name="simpleSideB" label="Side B">
              <UInput v-model="simpleSideB" class="w-full" placeholder="Eagles" />
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

        <!-- Stake + Payment -->
        <div class="napkinbets-form-grid">
          <UFormField name="entryFeeDollars" label="Stake ($)">
            <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
          </UFormField>

          <UFormField name="paymentService" label="Settle-up app">
            <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
          </UFormField>
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

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
} = useNapkinbetsCreateBuilder({
  prefill: computed(() => props.prefill),
  mode: computed(() => props.mode),
  taxonomy: computed(() => props.taxonomy),
  friends: computed(() => props.friends),
  groups: computed(() => props.groups),
  initialFriendId: computed(() => props.initialFriendId),
})

const showMoreOptions = ref(false)

const showEventQuickFlow = computed(
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

const formSummary = computed(() =>
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

const quickSummary = computed(() => {
  const amount = Number(formState.entryFeeDollars) || 0
  const amountLabel = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

  return `${quickOpponentLabel.value} on ${quickEventLabel.value}, ${quickSelectionLabel.value}, ${amountLabel} stake.`
})

function switchToGroupBet() {
  formState.napkinType = 'pool'
  showMoreOptions.value = false
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
    <template #header>
      <div class="space-y-2">
        <p class="napkinbets-kicker">Start a bet</p>
        <h2 class="napkinbets-section-title">
          {{
            showEventQuickFlow
              ? 'Make the bet in under a minute'
              : mode === 'event'
                ? 'Keep the setup tight'
                : 'Choose the simplest setup that works'
          }}
        </h2>
        <p class="napkinbets-support-copy">
          {{
            showEventQuickFlow
              ? 'Pick one friend, pick your side, set the stake, and send it.'
              : formSummary
          }}
        </p>
      </div>
    </template>

    <UForm :state="formState" class="space-y-6" @submit.prevent="submit">
      <template v-if="showEventQuickFlow">
        <div class="space-y-4">
          <div class="napkinbets-surface space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="napkinbets-surface-label">Who&apos;s in it?</p>
                <p class="font-semibold text-default">You and one friend.</p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-users-round"
                @click="switchToGroupBet"
              >
                Need a group bet?
              </UButton>
            </div>

            <div v-if="friendOptions.length" class="space-y-2">
              <p class="text-sm text-muted">Start with a saved friend if you have one.</p>
              <div class="napkinbets-chip-grid">
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
            </div>

            <UFormField v-if="!selectedOpponent" name="manualOpponentName" label="Friend name">
              <UInput v-model="manualOpponentName" class="w-full" placeholder="Pat Donnelly" />
            </UFormField>

            <UAlert
              v-if="!friendOptions.length && isAuthenticated"
              color="info"
              variant="soft"
              icon="i-lucide-user-round-plus"
              title="No saved friends yet"
              description="Type one name now, or save friends first so this gets faster next time."
            >
              <template #actions>
                <UButton to="/friends" color="primary" variant="soft" size="sm">
                  Open friends
                </UButton>
              </template>
            </UAlert>
          </div>

          <div class="napkinbets-surface space-y-3">
            <div class="space-y-1">
              <p class="napkinbets-surface-label">Who do you have?</p>
              <p class="text-sm text-muted">Win or lose. Pick your side and move on.</p>
            </div>

            <div class="grid gap-3">
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
                  {{
                    index === selectedSimpleSide
                      ? 'This is your side.'
                      : 'Tap here if this is your side instead.'
                  }}
                </span>
              </UButton>
            </div>
          </div>

          <div class="napkinbets-form-grid">
            <UFormField name="entryFeeDollars" label="Stake ($)">
              <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
            </UFormField>

            <UFormField name="paymentService" label="Settle-up app">
              <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
            </UFormField>
          </div>

          <div class="napkinbets-surface space-y-2">
            <p class="napkinbets-surface-label">Ready</p>
            <p class="font-semibold text-default">{{ quickSummary }}</p>
            <p class="text-sm leading-6 text-muted">
              Napkinbets keeps the bet organized. Money still moves in
              {{ formState.paymentService || 'your payment app' }}.
            </p>
          </div>

          <div class="space-y-2">
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!canSubmit"
              class="w-full justify-center"
            >
              {{ isAuthenticated ? 'Create bet' : 'Create account to publish' }}
            </UButton>

            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              class="w-full justify-center"
              @click="showMoreOptions = !showMoreOptions"
            >
              {{ showMoreOptions ? 'Hide more options' : 'More options' }}
            </UButton>
          </div>

          <div v-if="showMoreOptions" class="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
            <div class="napkinbets-surface space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-surface-label">Optional details</p>
                <p class="text-sm text-muted">Only touch these if you need to.</p>
              </div>

              <UFormField name="title" label="Bet title">
                <UInput v-model="formState.title" class="w-full" />
              </UFormField>

              <UFormField name="paymentHandle" label="Handle or destination">
                <UInput
                  v-model="formState.paymentHandle"
                  class="w-full"
                  :placeholder="
                    formState.paymentService === 'Venmo'
                      ? '@your-handle'
                      : 'Where people should send it'
                  "
                />
              </UFormField>

              <div v-if="groupOptions.length" class="space-y-2">
                <p class="napkinbets-surface-label">Saved group</p>
                <div class="napkinbets-chip-grid">
                  <UButton
                    :color="!formState.groupId ? 'primary' : 'neutral'"
                    :variant="!formState.groupId ? 'soft' : 'ghost'"
                    size="sm"
                    @click="formState.groupId = ''"
                  >
                    No group
                  </UButton>
                  <UButton
                    v-for="group in groupOptions"
                    :key="group.value"
                    :color="formState.groupId === group.value ? 'primary' : 'neutral'"
                    :variant="formState.groupId === group.value ? 'soft' : 'ghost'"
                    size="sm"
                    @click="formState.groupId = group.value"
                  >
                    {{ group.label }}
                  </UButton>
                </div>
              </div>
            </div>

            <div class="napkinbets-surface space-y-3">
              <p class="napkinbets-surface-label">Why it stays simple</p>
              <p class="text-sm leading-6 text-default">
                The game, the teams, and the event context are already attached. You only need the
                opponent, the side, and the stake to get a clean one-on-one bet live.
              </p>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid gap-3 md:grid-cols-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="napkinbets-choice-panel h-auto"
            :class="{ 'napkinbets-choice-panel-active': formState.napkinType === 'simple-bet' }"
            @click="formState.napkinType = 'simple-bet'"
          >
            <span class="napkinbets-surface-label">One-on-one</span>
            <span class="font-semibold text-default">One opponent, one stake, one clear side.</span>
            <span class="text-sm text-muted">This is the default for quick win-or-lose bets.</span>
          </UButton>

          <UButton
            color="neutral"
            variant="ghost"
            class="napkinbets-choice-panel h-auto"
            :class="{ 'napkinbets-choice-panel-active': formState.napkinType === 'pool' }"
            @click="formState.napkinType = 'pool'"
          >
            <span class="napkinbets-surface-label">Group bet</span>
            <span class="font-semibold text-default">
              Use this when there are several people or multiple outcomes.
            </span>
            <span class="text-sm text-muted">
              Keep this for a room, draft, or shared watch party.
            </span>
          </UButton>
        </div>

        <div
          v-if="mode === 'event' && eventPreview"
          class="napkinbets-event-preview napkinbets-surface"
        >
          <div class="space-y-1">
            <p class="napkinbets-surface-label">Attached game</p>
            <p class="font-semibold text-default">
              {{
                eventPreview.awayTeamName && eventPreview.homeTeamName
                  ? `${eventPreview.awayTeamName} at ${eventPreview.homeTeamName}`
                  : eventPreview.title
              }}
            </p>
            <p class="text-sm text-muted">
              {{ eventPreview.status || 'Scheduled' }} •
              {{ eventPreview.venueName || 'Venue pending' }}
            </p>
          </div>

          <div class="napkinbets-chip-grid">
            <span class="napkinbets-choice-chip">{{
              selectedSport?.label || 'Attached sport'
            }}</span>
            <span class="napkinbets-choice-chip">{{
              selectedLeague?.label || 'Attached league'
            }}</span>
            <span class="napkinbets-choice-chip">
              {{ formState.napkinType === 'simple-bet' ? 'One-on-one' : 'Group bet' }}
            </span>
          </div>
        </div>

        <div class="napkinbets-form-grid">
          <UFormField
            name="title"
            :label="formState.napkinType === 'simple-bet' ? 'Bet title' : 'Group bet title'"
          >
            <UInput v-model="formState.title" class="w-full" />
          </UFormField>

          <UFormField name="creatorName" label="You">
            <UInput v-model="formState.creatorName" class="w-full" />
          </UFormField>

          <UFormField name="entryFeeDollars" label="Stake ($)">
            <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
          </UFormField>

          <UFormField name="paymentService" label="Settle-up app">
            <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Context</p>
              <h3 class="napkinbets-subsection-title">Where this bet lives</h3>
            </div>

            <div class="napkinbets-form-grid">
              <template v-if="mode === 'event'">
                <div class="napkinbets-surface space-y-2">
                  <p class="napkinbets-surface-label">Sport</p>
                  <p class="font-semibold text-default">{{ selectedSport?.label }}</p>
                </div>

                <div class="napkinbets-surface space-y-2">
                  <p class="napkinbets-surface-label">League</p>
                  <p class="font-semibold text-default">{{ selectedLeague?.label }}</p>
                </div>
              </template>

              <template v-else>
                <UFormField name="sport" label="Sport">
                  <USelect v-model="formState.sport" :items="sportOptions" class="w-full" />
                </UFormField>

                <UFormField name="contextKey" label="Level">
                  <USelect v-model="formState.contextKey" :items="contextOptions" class="w-full" />
                </UFormField>

                <UFormField v-if="leagueOptions.length" name="league" label="League">
                  <USelect v-model="formState.league" :items="leagueOptions" class="w-full" />
                </UFormField>

                <UFormField
                  v-if="showCustomContextName"
                  name="customContextName"
                  label="Room or circuit name"
                >
                  <UInput
                    v-model="formState.customContextName"
                    class="w-full"
                    placeholder="District 4B meet"
                  />
                </UFormField>
              </template>

              <div v-if="groupOptions.length" class="space-y-2">
                <p class="napkinbets-surface-label">Saved group</p>
                <div class="napkinbets-chip-grid">
                  <UButton
                    :color="!formState.groupId ? 'primary' : 'neutral'"
                    :variant="!formState.groupId ? 'soft' : 'ghost'"
                    size="sm"
                    @click="formState.groupId = ''"
                  >
                    No group
                  </UButton>
                  <UButton
                    v-for="group in groupOptions"
                    :key="group.value"
                    :color="formState.groupId === group.value ? 'primary' : 'neutral'"
                    :variant="formState.groupId === group.value ? 'soft' : 'ghost'"
                    size="sm"
                    @click="formState.groupId = group.value"
                  >
                    {{ group.label }}
                  </UButton>
                </div>
              </div>

              <UFormField v-if="mode === 'manual'" name="venuePreset" label="Where it starts">
                <USelect v-model="selectedVenuePreset" :items="venueOptions" class="w-full" />
              </UFormField>

              <UFormField
                v-if="showCustomVenue || mode === 'event'"
                name="venueName"
                :label="mode === 'event' ? 'Venue' : 'Custom venue'"
              >
                <UInput v-model="formState.venueName" class="w-full" />
              </UFormField>
            </div>

            <div v-if="selectedGroup" class="napkinbets-surface space-y-1">
              <p class="napkinbets-surface-label">Selected group</p>
              <p class="font-semibold text-default">{{ selectedGroup.name }}</p>
              <p class="text-sm text-muted">
                {{ selectedGroup.description || 'No group note yet.' }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">People and sides</p>
              <h3 class="napkinbets-subsection-title">
                {{ isSimpleBet ? 'Pick the opponent and your side' : 'Set up the group bet' }}
              </h3>
            </div>

            <template v-if="isSimpleBet">
              <div class="napkinbets-surface space-y-4">
                <div v-if="friendOptions.length" class="space-y-2">
                  <p class="napkinbets-surface-label">Opponent from friends</p>
                  <div class="napkinbets-chip-grid">
                    <UButton
                      :color="selectedOpponentId ? 'neutral' : 'primary'"
                      :variant="selectedOpponentId ? 'ghost' : 'soft'"
                      size="sm"
                      @click="selectedOpponentId = ''"
                    >
                      Choose manually
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
                </div>

                <UFormField
                  v-if="!selectedOpponent"
                  name="manualOpponentName"
                  label="Opponent name"
                >
                  <UInput v-model="manualOpponentName" class="w-full" placeholder="Marcus Lee" />
                </UFormField>

                <div v-if="mode === 'manual'" class="grid gap-4 sm:grid-cols-2">
                  <UFormField name="simpleSideA" label="Your side">
                    <UInput v-model="simpleSideA" class="w-full" />
                  </UFormField>

                  <UFormField name="simpleSideB" label="Other side">
                    <UInput v-model="simpleSideB" class="w-full" />
                  </UFormField>
                </div>

                <div class="space-y-2">
                  <p class="napkinbets-surface-label">Which side are you taking?</p>
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
                        {{ index === 0 ? 'You take this side.' : 'Your opponent gets this side.' }}
                      </span>
                    </UButton>
                  </div>
                </div>

                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Bet summary</p>
                  <p class="text-sm leading-6 text-default">{{ boardSummary }}</p>
                </div>

                <UAlert
                  v-if="!friendOptions.length && isAuthenticated"
                  color="info"
                  variant="soft"
                  icon="i-lucide-user-round-plus"
                  title="No saved friends yet"
                  description="You can still type one opponent name, or save friends first to make this faster next time."
                >
                  <template #actions>
                    <UButton to="/friends" color="primary" variant="soft" size="sm">
                      Open friends
                    </UButton>
                  </template>
                </UAlert>
              </div>
            </template>

            <template v-else>
              <div class="napkinbets-surface space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField name="format" label="Group style">
                    <USelect v-model="formState.format" :items="poolFormatOptions" class="w-full" />
                  </UFormField>

                  <UFormField name="potTemplate" label="Payout split">
                    <USelect
                      v-model="selectedPotTemplate"
                      :items="potTemplateOptions"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="napkinbets-surface-label">Side options</p>
                    <USelect
                      :items="sideTemplateOptions"
                      class="w-44"
                      placeholder="Template"
                      @update:model-value="applySideTemplate"
                    />
                  </div>

                  <div class="napkinbets-chip-grid">
                    <span
                      v-for="option in sideOptionList"
                      :key="option"
                      class="napkinbets-choice-chip"
                    >
                      {{ option }}
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        icon="i-lucide-x"
                        @click="removeSideOption(option)"
                      />
                    </span>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <UInput
                      v-model="sideOptionDraft"
                      class="w-full"
                      placeholder="Add another side"
                    />
                    <UButton color="neutral" variant="soft" @click="addSideOption">
                      Add side
                    </UButton>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="napkinbets-surface-label">People</p>
                    <div class="flex flex-wrap gap-2">
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
                  </div>

                  <div v-if="friendOptions.length" class="space-y-2">
                    <p class="napkinbets-surface-label">Quick add from friends</p>
                    <div class="napkinbets-chip-grid">
                      <UButton
                        v-for="friend in friendOptions"
                        :key="friend.value"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @click="addFriendToPool(friend.value)"
                      >
                        {{ friend.label }}
                      </UButton>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <UInput
                      v-model="participantDraft"
                      class="w-full"
                      placeholder="Add a one-off participant"
                    />
                    <UButton color="neutral" variant="soft" @click="addPoolParticipant">
                      Add person
                    </UButton>
                  </div>

                  <div class="napkinbets-chip-grid">
                    <span
                      v-for="participant in poolParticipants"
                      :key="participant.displayName"
                      class="napkinbets-choice-chip"
                    >
                      {{ participant.displayName }}
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        icon="i-lucide-x"
                        @click="removePoolParticipant(participant.displayName)"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div class="napkinbets-surface space-y-3">
            <p class="napkinbets-surface-label">Settle-up details</p>

            <UFormField name="paymentHandle" label="Handle or destination">
              <UInput
                v-model="formState.paymentHandle"
                class="w-full"
                :placeholder="
                  formState.paymentService === 'Venmo'
                    ? '@your-handle'
                    : 'Where people should send it'
                "
              />
            </UFormField>

            <p class="text-sm leading-6 text-muted">
              Napkinbets records who owes what and who confirmed proof. Money still moves in the
              payment app itself.
            </p>
          </div>

          <div class="napkinbets-surface space-y-3">
            <p class="napkinbets-surface-label">Ready to publish</p>
            <p class="text-sm leading-6 text-default">{{ boardSummary }}</p>
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!canSubmit"
              class="w-full justify-center"
            >
              {{ isAuthenticated ? 'Create bet' : 'Create account to publish' }}
            </UButton>
          </div>
        </div>
      </template>
    </UForm>
  </UCard>
</template>

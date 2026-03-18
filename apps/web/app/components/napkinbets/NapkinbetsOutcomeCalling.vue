<script setup lang="ts">
import type {
  NapkinbetsWager,
  NapkinbetsWagerLeg,
  NapkinbetsParticipant,
} from '../../../types/napkinbets'

const props = defineProps<{
  wager: NapkinbetsWager
  canManage: boolean
  isAuthenticated: boolean
  currentUserId: string | null
  activeAction: string | null
}>()

const emit = defineEmits<{
  callResult: [
    wagerId: string,
    payload: {
      outcomes: Array<{ legId: string; outcomeOptionKey?: string; outcomeNumericValue?: number }>
      note?: string
    },
  ]
  acceptResult: [wagerId: string]
  disputeResult: [wagerId: string, reason: string]
}>()

// ─── State ─────────────────────────────

const outcomeSelections = ref<Record<string, string | number | null>>({})
const outcomeNote = ref('')
const disputeReason = ref('')
const showDisputeForm = ref(false)

// Initialize selections from legs
watch(
  () => props.wager.legs,
  (legs) => {
    for (const leg of legs) {
      if (!(leg.id in outcomeSelections.value)) {
        outcomeSelections.value[leg.id] = leg.outcomeOptionKey ?? leg.outcomeNumericValue ?? null
      }
    }
  },
  { immediate: true },
)

// ─── Computed ──────────────────────────

const myParticipant = computed<NapkinbetsParticipant | null>(() =>
  props.currentUserId
    ? (props.wager.participants.find((p) => p.userId === props.currentUserId) ?? null)
    : null,
)

const isHost = computed(() =>
  Boolean(props.currentUserId && props.wager.ownerUserId === props.currentUserId),
)

const isCustomBet = computed(
  () => !props.wager.eventSource || props.wager.boardType === 'community-created',
)

const needsOutcomeCalling = computed(() => {
  if (!isCustomBet.value) return false
  if (!props.wager.legs.length) return false
  const status = props.wager.status
  return ['open', 'locked', 'calling', 'disputed'].includes(status)
})

const isCalling = computed(() => props.wager.status === 'calling')
const isDisputed = computed(() => props.wager.status === 'disputed')
const isPreCall = computed(() => ['open', 'locked'].includes(props.wager.status))

const allLegsSelected = computed(() => {
  return props.wager.legs.every((leg) => {
    const val = outcomeSelections.value[leg.id]
    return val !== null && val !== undefined && val !== ''
  })
})

const acknowledgedParticipants = computed(() =>
  props.wager.participants.filter((p) => p.joinStatus === 'accepted' && p.outcomeAcknowledged),
)

const totalAcceptedParticipants = computed(
  () => props.wager.participants.filter((p) => p.joinStatus === 'accepted').length,
)

const myAcknowledged = computed(() => myParticipant.value?.outcomeAcknowledged ?? false)

const reviewTimeRemaining = computed(() => {
  // Find outcomeReviewExpiresAt from any known source — since we don't expose it directly on the wager type,
  // we rely on status being 'calling' as a signal the review is active
  return isCalling.value ? 'Within 24 hours' : null
})

const disputedByName = computed(() => {
  if (!isDisputed.value) return null
  // Find the participant who disputed
  const participant = props.wager.participants.find((p) =>
    props.wager.notifications.some(
      (n) =>
        n.kind === 'system' && n.title === 'Results disputed' && n.body.includes(p.displayName),
    ),
  )
  return participant?.displayName ?? 'A participant'
})

function isBusy(key: string) {
  return props.activeAction === key
}

// ─── Actions ──────────────────────────

function submitCallResult() {
  const outcomes = props.wager.legs.map((leg) => {
    const val = outcomeSelections.value[leg.id]
    if (leg.legType === 'numeric') {
      return { legId: leg.id, outcomeNumericValue: Number(val) }
    }
    return { legId: leg.id, outcomeOptionKey: String(val) }
  })

  emit('callResult', props.wager.id, {
    outcomes,
    note: outcomeNote.value.trim() || undefined,
  })
}

function submitAcceptResult() {
  emit('acceptResult', props.wager.id)
}

function submitDispute() {
  if (!disputeReason.value.trim()) return
  emit('disputeResult', props.wager.id, disputeReason.value.trim())
  showDisputeForm.value = false
}

function getLegOutcomeLabel(leg: NapkinbetsWagerLeg): string {
  if (leg.outcomeStatus !== 'settled') return 'Pending'
  if (leg.legType === 'numeric' && leg.outcomeNumericValue !== null) {
    return `${leg.outcomeNumericValue}${leg.numericUnit ? ` ${leg.numericUnit}` : ''}`
  }
  return leg.outcomeOptionKey ?? 'Settled'
}

function getNumericSelection(legId: string): string {
  return String(outcomeSelections.value[legId] ?? '')
}
</script>

<template>
  <UCard v-if="needsOutcomeCalling" class="napkinbets-panel">
    <!-- Host: Call the Result Form (pre-call or re-call after dispute) -->
    <div v-if="canManage && (isPreCall || isDisputed)" class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">
            {{ isDisputed ? 'Result Disputed' : 'Call the Result' }}
          </p>
          <h3 class="napkinbets-subsection-title">
            {{ isDisputed ? 'Review and re-call' : 'Declare the outcome' }}
          </h3>
        </div>
        <UBadge :color="isDisputed ? 'error' : 'warning'" variant="soft">
          {{ isDisputed ? 'Disputed' : 'Awaiting call' }}
        </UBadge>
      </div>

      <!-- Dispute context banner -->
      <UAlert
        v-if="isDisputed"
        color="error"
        variant="soft"
        icon="i-lucide-message-circle-warning"
        title="A participant disputed your result"
        :description="`${disputedByName} contested the declared outcome. Review and re-call the result, or the previous call still stands after the review window.`"
      />

      <p class="napkinbets-support-copy">
        Select the correct outcome for each question below, then submit. Participants will have 24
        hours to review.
      </p>

      <!-- Leg outcome form -->
      <div class="space-y-3">
        <div v-for="leg in wager.legs" :key="leg.id" class="napkinbets-surface space-y-2">
          <p class="font-semibold text-default">{{ leg.questionText }}</p>

          <!-- Categorical: radio-style buttons -->
          <div v-if="leg.legType === 'categorical'" class="flex flex-wrap gap-2">
            <UButton
              v-for="option in leg.options"
              :key="option"
              :color="outcomeSelections[leg.id] === option ? 'primary' : 'neutral'"
              :variant="outcomeSelections[leg.id] === option ? 'solid' : 'outline'"
              size="sm"
              @click="outcomeSelections[leg.id] = option"
            >
              {{ option }}
            </UButton>
          </div>

          <!-- Numeric: number input -->
          <div v-else class="flex items-center gap-2">
            <UInput
              :model-value="getNumericSelection(leg.id)"
              type="number"
              :placeholder="`Enter ${leg.numericUnit || 'value'}`"
              class="w-full max-w-48"
              @update:model-value="outcomeSelections[leg.id] = $event"
            />
            <span v-if="leg.numericUnit" class="text-sm text-muted">{{ leg.numericUnit }}</span>
          </div>
        </div>
      </div>

      <!-- Note -->
      <UFormField label="Evidence note (optional)">
        <UInput
          v-model="outcomeNote"
          class="w-full"
          placeholder="Checked Weather.com — it rained 0.3 inches"
        />
      </UFormField>

      <UButton
        color="primary"
        icon="i-lucide-gavel"
        :disabled="!allLegsSelected"
        :loading="isBusy(`outcome:call:${wager.id}`)"
        @click="submitCallResult"
      >
        {{ isDisputed ? 'Re-call the result' : 'Call the result' }}
      </UButton>
    </div>

    <!-- Participant or non-host view: Review / Accept / Dispute -->
    <div v-else-if="isCalling" class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Results Under Review</p>
          <h3 class="napkinbets-subsection-title">The host declared outcomes</h3>
        </div>
        <UBadge color="info" variant="soft">
          {{ reviewTimeRemaining }}
        </UBadge>
      </div>

      <!-- Results summary -->
      <div class="space-y-2">
        <div v-for="leg in wager.legs" :key="leg.id" class="napkinbets-list-row">
          <div>
            <p class="font-semibold text-default">{{ leg.questionText }}</p>
            <p class="text-sm text-muted">{{ leg.legType }}</p>
          </div>
          <UBadge :color="leg.outcomeStatus === 'settled' ? 'success' : 'neutral'" variant="soft">
            {{ getLegOutcomeLabel(leg) }}
          </UBadge>
        </div>
      </div>

      <!-- Acknowledgement progress -->
      <div class="napkinbets-surface space-y-2">
        <p class="text-sm font-semibold text-default">
          Participant review: {{ acknowledgedParticipants.length }} /
          {{ totalAcceptedParticipants }} accepted
        </p>
        <UProgress
          :value="
            totalAcceptedParticipants > 0
              ? (acknowledgedParticipants.length / totalAcceptedParticipants) * 100
              : 0
          "
          color="primary"
        />
        <div v-if="acknowledgedParticipants.length" class="flex flex-wrap gap-1">
          <UBadge
            v-for="p in acknowledgedParticipants"
            :key="p.id"
            color="success"
            variant="soft"
            size="xs"
          >
            {{ p.displayName }} ✓
          </UBadge>
        </div>
      </div>

      <!-- Accept / Dispute actions (only for non-host participants) -->
      <div
        v-if="
          isAuthenticated && myParticipant && myParticipant.joinStatus === 'accepted' && !isHost
        "
        class="space-y-3"
      >
        <div v-if="myAcknowledged">
          <UAlert
            color="success"
            variant="soft"
            icon="i-lucide-check-circle-2"
            title="You accepted these results"
            description="Waiting for other participants to respond or the review window to expire."
          />
        </div>

        <div v-else class="space-y-3">
          <div class="flex flex-wrap gap-3">
            <UButton
              color="success"
              icon="i-lucide-check"
              :loading="isBusy(`outcome:accept:${wager.id}`)"
              @click="submitAcceptResult"
            >
              Accept results
            </UButton>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-message-circle-warning"
              @click="showDisputeForm = !showDisputeForm"
            >
              Dispute
            </UButton>
          </div>

          <!-- Inline dispute form -->
          <div v-if="showDisputeForm" class="space-y-2">
            <UInput
              v-model="disputeReason"
              class="w-full"
              placeholder="Explain why you think the result is wrong..."
            />
            <UButton
              color="error"
              size="sm"
              icon="i-lucide-send"
              :disabled="disputeReason.trim().length < 3"
              :loading="isBusy(`outcome:dispute:${wager.id}`)"
              @click="submitDispute"
            >
              Submit dispute
            </UButton>
          </div>
        </div>
      </div>

      <!-- Host view during calling -->
      <div v-else-if="canManage">
        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-clock"
          title="Waiting for participant review"
          description="Results will auto-finalize when all participants accept or the 24-hour window expires."
        />
      </div>
    </div>

    <!-- Disputed: non-host participant view -->
    <div v-else-if="isDisputed && !canManage" class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Result Disputed</p>
          <h3 class="napkinbets-subsection-title">Waiting for host to re-call</h3>
        </div>
        <UBadge color="error" variant="soft">Disputed</UBadge>
      </div>
      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-timer-reset"
        title="The host is reviewing a dispute"
        description="A participant contested the called result. The host will review and re-declare the outcome."
      />
    </div>
  </UCard>
</template>

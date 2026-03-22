<script setup lang="ts">
import { reactive, watch } from 'vue'
import type {
  JoinWagerInput,
  NapkinbetsWager,
  WagerSettlementInput,
} from '../../../types/napkinbets'
import { displayNameToInitials, formatCurrency } from '../../utils/napkinbets-display'
import { getNapkinbetsWagerSettlementStage } from '../../utils/napkinbets-wager-detail'

const props = defineProps<{
  wager: NapkinbetsWager
  activeAction: string | null
  canManage: boolean
  isAuthenticated: boolean
  currentUserId: string | null
}>()

const isLightboxOpen = ref(false)
const lightboxImageUrl = ref('')

function openLightbox(url: string) {
  lightboxImageUrl.value = url
  isLightboxOpen.value = true
}

const emit = defineEmits<{
  join: [wagerId: string, payload: JoinWagerInput]
  confirmSettlement: [wagerId: string, settlementId: string]
  rejectSettlement: [wagerId: string, settlementId: string]
  acknowledgeSettlement: [wagerId: string, settlementId: string]
  shuffle: [wagerId: string]
  remind: [wagerId: string]
  clear: [wagerId: string]
  decline: [wagerId: string]
}>()

const { buildLinks, buildPaymentNote } = useNapkinbetsPaymentLinks()

const joinState = reactive<JoinWagerInput>({
  displayName: '',
  sideLabel: '',
})

const settlementState = reactive<WagerSettlementInput>({
  participantId: '',
  participantName: '',
  amountDollars: 0,
  method: '',
  handle: '',
  confirmationCode: '',
  note: '',
  proofImage: null,
})

watch(
  () => [props.wager, props.currentUserId] as const,
  ([wager]) => {
    joinState.displayName = ''
    joinState.sideLabel = wager.sideOptions[0] ?? ''

    // For one-on-one: pre-fill with current user's data
    const me = props.currentUserId
      ? wager.participants.find((p) => p.userId === props.currentUserId)
      : null

    settlementState.participantId = me?.id ?? wager.participants[0]?.id ?? ''
    settlementState.participantName = me?.displayName ?? wager.participants[0]?.displayName ?? ''
    settlementState.amountDollars = wager.entryFeeCents / 100
    settlementState.method = wager.paymentService
    settlementState.handle = wager.paymentHandle
  },
  { immediate: true },
)

const myParticipant = computed(() =>
  props.currentUserId
    ? (props.wager.participants.find((p) => p.userId === props.currentUserId) ?? null)
    : null,
)

const isInvited = computed(
  () =>
    myParticipant.value !== null &&
    (myParticipant.value.joinStatus === 'invited' || myParticipant.value.joinStatus === 'pending'),
)

const isAlreadyAccepted = computed(
  () => myParticipant.value !== null && myParticipant.value.joinStatus === 'accepted',
)

const isOneOnOne = computed(() => props.wager.napkinType === 'simple-bet')

type NapkinbetsBadgeColor =
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'neutral'

interface NapkinbetsNextStepCard {
  badgeLabel: string
  badgeColor: NapkinbetsBadgeColor
  icon: string
  title: string
  description: string
  emphasis: string
  primaryLabel: string
  primaryValue: string
  primaryHint: string
  secondaryLabel: string
  secondaryValue: string
  secondaryHint: string
  supportCopy: string
}

const paymentRoute = computed(() => {
  const parts = [props.wager.paymentService, props.wager.paymentHandle].filter(Boolean)
  return parts.length ? parts.join(' • ') : 'Payment route pending'
})

const participantNames = computed(
  () =>
    new Map(
      props.wager.participants.map((participant) => [participant.id, participant.displayName]),
    ),
)

const selectedSettlementParticipant = computed(
  () =>
    props.wager.participants.find(
      (participant) => participant.id === settlementState.participantId,
    ) ?? null,
)

const paymentNote = computed(() =>
  buildPaymentNote(
    props.wager.slug,
    selectedSettlementParticipant.value?.displayName || 'participant',
    settlementState.amountDollars,
  ),
)

const paymentLinks = computed(() =>
  buildLinks(
    props.wager.paymentService,
    props.wager.paymentHandle,
    settlementState.amountDollars,
    paymentNote.value,
  ),
)

const mySettlement = computed(() =>
  myParticipant.value
    ? (props.wager.settlements.find(
        (settlement) => settlement.participantId === myParticipant.value!.id,
      ) ?? null)
    : null,
)

const settlementStage = computed(() =>
  getNapkinbetsWagerSettlementStage(props.wager, myParticipant.value?.id ?? null),
)

const showPaymentActions = computed(
  () =>
    props.isAuthenticated &&
    (myParticipant.value !== null || props.canManage) &&
    (settlementStage.value === 'ready' || settlementStage.value === 'rejected'),
)

const showCloseoutShortcut = computed(
  () => props.canManage && settlementStage.value !== 'upcoming' && settlementStage.value !== 'live',
)

const paymentAmountCents = computed(() => Math.round(settlementState.amountDollars * 100))

const activeProgressStep = computed(() => {
  switch (settlementStage.value) {
    case 'upcoming':
      return 1
    case 'live':
      return 2
    default:
      return 3
  }
})

const settlementSummary = computed(() => {
  if (!mySettlement.value) {
    return null
  }

  if (mySettlement.value.verificationStatus === 'rejected') {
    return 'Proof needs to be resubmitted'
  }

  if (mySettlement.value.verificationStatus === 'confirmed') {
    return mySettlement.value.recipientAcknowledged
      ? 'Confirmed and acknowledged'
      : 'Confirmed in the ledger'
  }

  return 'Waiting on ledger confirmation'
})

const nextStepCard = computed<NapkinbetsNextStepCard>(() => {
  const participantContext = myParticipant.value
    ? `Locked in as ${myParticipant.value.displayName}${myParticipant.value.sideLabel ? ` on ${myParticipant.value.sideLabel}` : ''}.`
    : props.isAuthenticated
      ? 'Follow the game here and settle up once the result is official.'
      : 'This bet stays shareable, but settlement still waits until the final result.'
  const recordedAmount = mySettlement.value
    ? formatCurrency(mySettlement.value.amountCents)
    : formatCurrency(paymentAmountCents.value)

  switch (settlementStage.value) {
    case 'upcoming':
      return {
        badgeLabel: 'Pregame',
        badgeColor: 'warning' as const,
        icon: 'i-lucide-hourglass',
        title: 'No payment due yet',
        description: 'This bet is locked in, but nobody should send money until the game is final.',
        emphasis: participantContext,
        primaryLabel: 'Winner paid via',
        primaryValue: paymentRoute.value,
        primaryHint: 'The loser pays after the result is official.',
        secondaryLabel: 'Stake each',
        secondaryValue: formatCurrency(props.wager.entryFeeCents),
        secondaryHint: props.wager.eventStatus || 'Waiting for first pitch.',
        supportCopy: 'Payment shortcuts stay hidden until the result is official.',
      }
    case 'calling':
      return {
        badgeLabel: 'Results under review',
        badgeColor: 'info' as const,
        icon: 'i-lucide-eye',
        title: 'Outcome declared — awaiting review',
        description:
          'The host has called the result. Participants have 24 hours to accept or dispute before it becomes final.',
        emphasis: participantContext,
        primaryLabel: 'Winner paid via',
        primaryValue: paymentRoute.value,
        primaryHint: 'Financial settlement opens after all participants accept.',
        secondaryLabel: 'Stake each',
        secondaryValue: formatCurrency(props.wager.entryFeeCents),
        secondaryHint: 'Review the called outcomes in the panel above.',
        supportCopy: 'Payment shortcuts appear once the outcome is finalized.',
      }
    case 'live':
      return {
        badgeLabel: 'Live game',
        badgeColor: 'primary' as const,
        icon: 'i-lucide-timer-reset',
        title: 'Track it now, settle later',
        description:
          'The game is underway. Keep the bet here, but wait for the final result before paying anyone.',
        emphasis: participantContext,
        primaryLabel: 'Winner paid via',
        primaryValue: paymentRoute.value,
        primaryHint: 'Settle-up opens once the game goes final.',
        secondaryLabel: 'Stake each',
        secondaryValue: formatCurrency(props.wager.entryFeeCents),
        secondaryHint: props.wager.eventStatus || 'Game in progress.',
        supportCopy: 'Use the game context below to follow the score until settlement opens.',
      }
    case 'ready':
      return {
        badgeLabel: 'Ready to settle',
        badgeColor: 'success' as const,
        icon: 'i-lucide-wallet-cards',
        title: 'Result is in. Settle this bet.',
        description: props.isAuthenticated
          ? 'Use the saved payment route below, then log proof in the settlement ledger once the transfer is sent.'
          : 'The result is official. Sign in to unlock payment shortcuts and record proof in the settlement ledger.',
        emphasis: participantContext,
        primaryLabel: 'Pay to',
        primaryValue: paymentRoute.value,
        primaryHint: `Amount due: ${formatCurrency(paymentAmountCents.value)}.`,
        secondaryLabel: 'Suggested note',
        secondaryValue: paymentNote.value,
        secondaryHint: 'Keep the slug in the note so both sides can match the transfer.',
        supportCopy: props.isAuthenticated
          ? 'Open the payment app directly or copy the details to settle manually.'
          : 'Sign in to unlock payment shortcuts and upload proof once the transfer is complete.',
      }
    case 'rejected':
      return {
        badgeLabel: 'Proof sent back',
        badgeColor: 'error' as const,
        icon: 'i-lucide-refresh-ccw',
        title: 'Update the payment proof',
        description:
          'A previous proof was rejected. Re-send the transfer if needed, then upload a fresh receipt in the ledger below.',
        emphasis: settlementSummary.value || participantContext,
        primaryLabel: 'Pay to',
        primaryValue: paymentRoute.value,
        primaryHint: `Amount due: ${formatCurrency(paymentAmountCents.value)}.`,
        secondaryLabel: 'Suggested note',
        secondaryValue: paymentNote.value,
        secondaryHint: 'Reuse the note so the replacement transfer is easy to trace.',
        supportCopy:
          'The settlement ledger below will show the rejection note and the replacement proof once it is logged.',
      }
    case 'submitted':
      return {
        badgeLabel: mySettlement.value ? 'Proof logged' : 'Settlement in motion',
        badgeColor: mySettlement.value?.verificationStatus === 'confirmed' ? 'success' : 'info',
        icon:
          mySettlement.value?.verificationStatus === 'confirmed'
            ? 'i-lucide-badge-check'
            : 'i-lucide-receipt',
        title:
          mySettlement.value?.verificationStatus === 'confirmed'
            ? 'Payment confirmed'
            : mySettlement.value
              ? 'Payment proof submitted'
              : 'Settlement proof logged',
        description: mySettlement.value
          ? mySettlement.value.verificationStatus === 'confirmed'
            ? 'Your transfer is already in the ledger. Use this page to confirm the closeout status.'
            : 'Your payment proof is on file. Wait for the other side to acknowledge it or for the host to confirm it.'
          : 'A payment proof has already been logged in the ledger. Review or follow up there instead of sending another transfer here.',
        emphasis: settlementSummary.value || participantContext,
        primaryLabel: 'Payment route',
        primaryValue: paymentRoute.value,
        primaryHint: `Logged amount: ${recordedAmount}.`,
        secondaryLabel: 'Ledger status',
        secondaryValue: settlementSummary.value || 'Review the ledger below',
        secondaryHint: 'Need to double-check it? Scroll down to the settlement ledger.',
        supportCopy:
          'Payment shortcuts are hidden here because the ledger already has a proof record.',
      }
    case 'settled':
      return {
        badgeLabel: 'Settled',
        badgeColor: 'success' as const,
        icon: 'i-lucide-check-circle-2',
        title: 'This bet is closed out',
        description:
          'The wager has moved past game time and the settlement ledger reflects the final state.',
        emphasis: settlementSummary.value || participantContext,
        primaryLabel: 'Payout route',
        primaryValue: paymentRoute.value,
        primaryHint: `Stake was ${formatCurrency(props.wager.entryFeeCents)} per person.`,
        secondaryLabel: 'Ledger entries',
        secondaryValue: `${props.wager.settlements.length} payment record${props.wager.settlements.length === 1 ? '' : 's'}`,
        secondaryHint: 'Use the ledger below if you need to review receipts or acknowledgements.',
        supportCopy: 'No payment shortcut is shown because the closeout is already complete.',
      }
    default:
      return {
        badgeLabel: 'Bet detail',
        badgeColor: 'neutral' as const,
        icon: 'i-lucide-scroll-text',
        title: 'Review the current state',
        description: 'Check the scoreboard and settlement ledger for the latest bet status.',
        emphasis: participantContext,
        primaryLabel: 'Payment route',
        primaryValue: paymentRoute.value,
        primaryHint: `Stake is ${formatCurrency(props.wager.entryFeeCents)} per person.`,
        secondaryLabel: 'Ledger',
        secondaryValue: `${props.wager.settlements.length} payment record${props.wager.settlements.length === 1 ? '' : 's'}`,
        secondaryHint: 'Open the ledger below for the current closeout state.',
        supportCopy: 'Refresh the page if the event or settlement status looks stale.',
      }
  }
})

function statusBadgeColor(status: string) {
  switch (status) {
    case 'live':
      return 'success'
    case 'locked':
      return 'primary'
    case 'open':
      return 'info'
    case 'calling':
      return 'warning'
    case 'disputed':
      return 'error'
    case 'settling':
      return 'warning'
    case 'settled':
      return 'success'
    case 'closed':
      return 'neutral'
    case 'archived':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function acceptInvite() {
  if (!myParticipant.value) {
    return
  }

  emit('join', props.wager.id, {
    displayName: myParticipant.value.displayName,
    sideLabel: myParticipant.value.sideLabel || props.wager.sideOptions[0] || 'Open side',
  })
}

function isBusy(key: string) {
  return props.activeAction === key
}

function settlementBadgeColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'warning'
  }
}

function submitJoin() {
  if (!joinState.displayName.trim()) {
    return
  }

  emit('join', props.wager.id, {
    displayName: joinState.displayName.trim(),
    sideLabel: joinState.sideLabel.trim(),
  })
}

const emitAcknowledge = (wagerId: string, settlementId: string) => {
  // Pass up to parent view
  emit('acknowledgeSettlement', wagerId, settlementId)
}

async function copyPaymentToClipboard() {
  const { copyPaymentDetails } = useNapkinbetsPaymentLinks()
  await copyPaymentDetails(
    props.wager.paymentService,
    props.wager.paymentHandle,
    settlementState.amountDollars,
    paymentNote.value,
  )
}

function progressBadgeColor(step: number): NapkinbetsBadgeColor {
  if (step < activeProgressStep.value) {
    return 'success'
  }

  if (step === activeProgressStep.value) {
    switch (settlementStage.value) {
      case 'upcoming':
        return 'warning'
      case 'live':
        return 'primary'
      default:
        return 'success'
    }
  }

  return 'neutral'
}
</script>

<template>
  <!-- eslint-disable narduk/no-template-complex-expressions -- pre-existing pattern ignores component refactoring -->
  <div>
    <UCard class="napkinbets-panel napkinbets-wager-card">
      <template #header>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="statusBadgeColor(wager.status)" variant="soft">
                {{ wager.status }}
              </UBadge>
              <UBadge color="neutral" variant="subtle">
                {{ wager.format }}
              </UBadge>
              <UBadge v-if="wager.league" color="info" variant="soft">
                {{ wager.league.toUpperCase() }}
              </UBadge>
            </div>

            <div class="space-y-2">
              <h2 class="napkinbets-section-title">{{ wager.title }}</h2>
              <p class="napkinbets-support-copy">
                {{ wager.description }}
              </p>
              <div class="napkinbets-meta-row">
                <ULink
                  v-if="wager.eventId"
                  :to="`/events/${encodeURIComponent(wager.eventId)}`"
                  class="text-inherit hover:underline"
                >
                  {{ wager.eventTitle }}
                </ULink>
                <span v-else>{{ wager.eventTitle || 'Custom bet' }}</span>
                <span v-if="wager.groupName">{{ wager.groupName }}</span>
                <span>{{ wager.venueName || 'Remote group' }}</span>
                <span>Host: {{ wager.creatorName }}</span>
              </div>
            </div>
          </div>

          <div v-if="canManage" class="flex flex-wrap gap-2">
            <UButton
              v-if="!isOneOnOne"
              color="neutral"
              variant="soft"
              icon="i-lucide-shuffle"
              :loading="isBusy(`shuffle:${wager.id}`)"
              @click="emit('shuffle', wager.id)"
            >
              Reroll order
            </UButton>
            <UButton
              v-if="!isOneOnOne"
              color="info"
              variant="soft"
              icon="i-lucide-bell-ring"
              :loading="isBusy(`reminder:${wager.id}`)"
              @click="emit('remind', wager.id)"
            >
              Queue reminder
            </UButton>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              :loading="isBusy(`clear:${wager.id}`)"
              @click="emit('clear', wager.id)"
            >
              Clear
            </UButton>
          </div>
        </div>
      </template>

      <div class="napkinbets-card-grid">
        <div class="space-y-6">
          <div class="napkinbets-summary-grid">
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Stake</p>
              <p class="napkinbets-surface-value">{{ formatCurrency(wager.entryFeeCents) }}</p>
              <p class="napkinbets-support-copy">
                {{ wager.paymentService
                }}{{ wager.paymentHandle ? ` • ${wager.paymentHandle}` : '' }}
              </p>
            </div>

            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Total payout</p>
              <p class="napkinbets-surface-value">{{ formatCurrency(wager.totalPotCents) }}</p>
              <p class="napkinbets-support-copy">
                {{ wager.pots.length }} payout split{{ wager.pots.length === 1 ? '' : 's' }}
              </p>
            </div>

            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">At a glance</p>
              <p class="napkinbets-surface-value">{{ wager.participants.length }} players</p>
              <p class="napkinbets-support-copy">
                {{ wager.notifications.length }} recent reminders
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Payout breakdown</h3>
            <div v-if="wager.pots.length" class="napkinbets-chip-grid">
              <div v-for="pot in wager.pots" :key="pot.id" class="napkinbets-chip-card">
                <span class="font-semibold text-default">{{ pot.label }}</span>
                <span class="text-sm text-muted">{{ formatCurrency(pot.amountCents) }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-muted">No payout breakdown yet.</p>
          </div>

          <USeparator />
          <div :class="isOneOnOne ? '' : 'napkinbets-two-column'">
            <div class="space-y-3">
              <h3 class="napkinbets-subsection-title">
                {{ isOneOnOne ? 'Players' : 'Draft order' }}
              </h3>
              <div v-if="wager.participants.length" class="space-y-2">
                <div
                  v-for="participant in wager.participants"
                  :key="participant.id"
                  class="napkinbets-list-row napkinbets-draft-order-row flex items-center justify-between"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span v-if="!isOneOnOne" class="napkinbets-order-pill"
                      >#{{ participant.draftOrder ?? '—' }}</span
                    >
                    <UAvatar
                      :src="participant.avatarUrl || undefined"
                      :alt="participant.displayName"
                      :text="
                        participant.displayName
                          ? participant.displayName.slice(0, 2).toUpperCase()
                          : '?'
                      "
                      size="md"
                      class="shrink-0"
                    />
                    <div>
                      <p class="font-semibold text-default">{{ participant.displayName }}</p>
                      <p class="text-sm text-muted">
                        {{ participant.sideLabel || 'Open side' }}
                      </p>
                    </div>
                  </div>
                  <div class="shrink-0 ml-auto">
                    <UBadge
                      v-if="isOneOnOne"
                      :color="participant.joinStatus === 'accepted' ? 'success' : 'warning'"
                      variant="soft"
                    >
                      {{ participant.joinStatus === 'accepted' ? 'Accepted' : 'Waiting' }}
                    </UBadge>
                    <UBadge
                      v-else
                      :color="
                        participant.paymentStatus === 'confirmed'
                          ? 'success'
                          : participant.paymentStatus === 'submitted'
                            ? 'info'
                            : 'warning'
                      "
                      variant="soft"
                    >
                      {{ participant.paymentStatus }}
                    </UBadge>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-muted">
                {{ isInvited ? 'Accept the bet to see the draft order.' : 'No draft order yet.' }}
              </p>
            </div>

            <div v-if="!isOneOnOne" class="space-y-3">
              <h3 class="napkinbets-subsection-title">Leaderboard</h3>
              <div v-if="wager.leaderboard.length" class="space-y-2">
                <div
                  v-for="row in wager.leaderboard"
                  :key="row.participantId"
                  class="napkinbets-list-row"
                >
                  <div class="flex items-center gap-3">
                    <UAvatar
                      :src="row.avatarUrl || undefined"
                      :alt="row.displayName"
                      :text="row.displayName ? row.displayName.slice(0, 2).toUpperCase() : '?'"
                      size="sm"
                      class="shrink-0"
                    />
                    <div>
                      <p class="font-semibold text-default">{{ row.displayName }}</p>
                      <p class="text-sm text-muted">
                        {{ row.sideLabel }} &bull; {{ row.pickCount }} pick{{
                          row.pickCount === 1 ? '' : 's'
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-default">{{ row.score }} pts</p>
                    <p class="text-sm text-muted">
                      {{ formatCurrency(row.projectedPayoutCents) }} projected
                    </p>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-muted">
                {{ isInvited ? 'Accept the bet to see the leaderboard.' : 'No leaderboard yet.' }}
              </p>
            </div>
          </div>

          <USeparator />

          <div class="napkinbets-two-column">
            <div v-if="wager.picks.length" class="space-y-3">
              <h3 class="napkinbets-subsection-title">Picks</h3>
              <div class="space-y-2">
                <div v-for="pick in wager.picks" :key="pick.id" class="napkinbets-list-row">
                  <div>
                    <p class="font-semibold text-default">{{ pick.pickLabel }}</p>
                    <p class="text-sm text-muted">
                      {{ pick.pickType }}{{ pick.pickValue ? ` • ${pick.pickValue}` : '' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-default">{{ pick.liveScore }} live</p>
                    <p class="text-sm text-muted">{{ pick.outcome }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isOneOnOne && wager.notifications.length" class="space-y-3">
              <h3 class="napkinbets-subsection-title">Activity</h3>
              <div class="space-y-2">
                <div
                  v-for="notification in wager.notifications"
                  :key="notification.id"
                  class="napkinbets-note-row"
                >
                  <div>
                    <p class="font-semibold text-default">{{ notification.title }}</p>
                    <p class="text-sm text-muted">
                      {{ notification.body }}
                    </p>
                  </div>
                  <UBadge color="neutral" variant="subtle">
                    {{ notification.deliveryStatus }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <USeparator />

          <div v-if="isAuthenticated" class="napkinbets-form-section">
            <!-- Invited: show ONLY accept/decline banner -->
            <div v-if="isInvited" class="space-y-4">
              <UAlert
                color="warning"
                variant="soft"
                icon="i-lucide-ticket-check"
                title="You've been challenged"
                :description="`${wager.creatorName} invited you to this bet as ${myParticipant!.displayName}. Accept to lock in your side, or decline to pass.`"
              />
              <div class="flex flex-wrap gap-3">
                <UButton
                  color="primary"
                  icon="i-lucide-check"
                  :loading="isBusy(`join:${wager.id}`)"
                  @click="acceptInvite"
                >
                  Accept bet
                </UButton>
                <UButton
                  color="error"
                  variant="soft"
                  icon="i-lucide-x"
                  :loading="isBusy(`decline:${wager.id}`)"
                  @click="emit('decline', wager.id)"
                >
                  Decline
                </UButton>
              </div>
            </div>

            <!-- Accepted participant -->
            <template v-else-if="isAlreadyAccepted">
              <UAlert
                color="success"
                variant="soft"
                icon="i-lucide-check-circle-2"
                title="You're in this bet"
                :description="`Locked in as ${myParticipant!.displayName} on ${myParticipant!.sideLabel || 'Open side'}.`"
              />
            </template>

            <!-- Not a participant yet: show generic join form (pool bets only) -->
            <template v-else-if="!isOneOnOne">
              <div class="space-y-4">
                <h3 class="napkinbets-subsection-title">Join the bet</h3>
                <div class="napkinbets-chip-grid">
                  <span
                    v-for="option in wager.sideOptions"
                    :key="option"
                    class="napkinbets-choice-chip"
                  >
                    {{ option }}
                  </span>
                </div>
                <UForm :state="joinState" class="space-y-3" @submit.prevent="submitJoin">
                  <UFormField name="displayName" label="Participant name">
                    <UInput v-model="joinState.displayName" class="w-full" />
                  </UFormField>
                  <UFormField name="sideLabel" label="Chosen side">
                    <USelect
                      v-model="joinState.sideLabel"
                      :items="wager.sideOptions.map((option) => ({ label: option, value: option }))"
                      class="w-full"
                    />
                  </UFormField>
                  <UButton
                    type="submit"
                    color="primary"
                    icon="i-lucide-user-plus"
                    :loading="isBusy(`join:${wager.id}`)"
                  >
                    Join bet
                  </UButton>
                </UForm>
              </div>
            </template>
          </div>

          <UAlert
            v-else
            color="warning"
            variant="soft"
            icon="i-lucide-log-in"
            title="Sign in to join, pick, or settle"
            description="Bet detail is shareable, but player actions and payment proof require an account."
          >
            <template #actions>
              <div class="napkinbets-card-actions">
                <UButton to="/login" color="neutral" variant="soft">Sign in</UButton>
                <UButton to="/register" color="primary">Create account</UButton>
              </div>
            </template>
          </UAlert>
        </div>

        <div class="space-y-6">
          <div class="napkinbets-surface space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Next step</p>
                <h3 class="napkinbets-subsection-title">{{ nextStepCard.title }}</h3>
              </div>
              <UBadge :color="nextStepCard.badgeColor" variant="soft">
                {{ nextStepCard.badgeLabel }}
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-2">
              <UBadge :color="progressBadgeColor(1)" variant="soft">1. Locked in</UBadge>
              <UBadge :color="progressBadgeColor(2)" variant="soft">2. Track game</UBadge>
              <UBadge :color="progressBadgeColor(3)" variant="soft">3. Settle after final</UBadge>
            </div>

            <div class="napkinbets-note-row">
              <div class="flex items-start gap-3">
                <UIcon :name="nextStepCard.icon" class="mt-0.5 size-5 text-primary shrink-0" />
                <div class="space-y-1">
                  <p class="font-semibold text-default">{{ nextStepCard.description }}</p>
                  <p class="text-sm text-muted">{{ nextStepCard.emphasis }}</p>
                </div>
              </div>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="napkinbets-note-row">
                <div>
                  <p class="font-semibold text-default">{{ nextStepCard.primaryLabel }}</p>
                  <p class="text-sm text-muted wrap-break-word">{{ nextStepCard.primaryValue }}</p>
                  <p class="text-xs text-muted mt-1">{{ nextStepCard.primaryHint }}</p>
                </div>
              </div>
              <div class="napkinbets-note-row">
                <div>
                  <p class="font-semibold text-default">{{ nextStepCard.secondaryLabel }}</p>
                  <p class="text-sm text-muted wrap-break-word">
                    {{ nextStepCard.secondaryValue }}
                  </p>
                  <p class="text-xs text-muted mt-1">{{ nextStepCard.secondaryHint }}</p>
                </div>
              </div>
            </div>

            <div
              v-if="showPaymentActions || showCloseoutShortcut"
              class="napkinbets-card-actions flex-wrap"
            >
              <UButton
                v-for="link in showPaymentActions ? paymentLinks : []"
                :key="link.href"
                :to="link.href"
                :color="link.isMobileApp ? 'primary' : 'neutral'"
                :variant="link.isMobileApp ? 'solid' : 'soft'"
                :size="link.isMobileApp ? 'lg' : 'md'"
                target="_blank"
                :icon="link.icon"
                class="min-h-[44px]"
              >
                {{ link.label }}
              </UButton>
              <UButton
                v-if="showPaymentActions"
                color="neutral"
                variant="outline"
                icon="i-lucide-copy"
                class="min-h-[44px]"
                @click="copyPaymentToClipboard"
              >
                Copy payment details
              </UButton>
              <UButton
                v-if="showCloseoutShortcut"
                :to="`/napkins/${wager.slug}/closeout`"
                color="neutral"
                variant="soft"
                icon="i-lucide-clipboard-list"
                class="min-h-[44px]"
              >
                Open closeout
              </UButton>
            </div>

            <p class="napkinbets-support-copy">
              {{ nextStepCard.supportCopy }}
            </p>
          </div>

          <div class="napkinbets-surface space-y-4">
            <h3 class="napkinbets-subsection-title">Game context</h3>

            <NapkinbetsWagerScoreboard v-if="wager.eventId" :wager="wager" />

            <div
              v-if="wager.liveGames.length"
              class="space-y-3"
              :class="wager.eventId ? 'pt-2 border-t border-dashed border-default mt-4' : ''"
            >
              <h4 v-if="wager.eventId" class="text-sm font-semibold text-default">
                Other Live Games
              </h4>
              <div
                v-for="game in wager.liveGames.slice(0, 3)"
                :key="game.id"
                class="napkinbets-live-game"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-default">{{ game.shortName }}</p>
                    <p class="text-sm text-muted">{{ game.status }}</p>
                  </div>
                  <UBadge color="primary" variant="soft">
                    {{ game.league.toUpperCase() }}
                  </UBadge>
                </div>
              </div>
            </div>

            <p v-else-if="!wager.eventId" class="napkinbets-support-copy">
              Add a sport, league and event to this bet to see live scoreboard context here.
            </p>
          </div>

          <div class="napkinbets-surface space-y-3">
            <h3 class="napkinbets-subsection-title">Settlement ledger</h3>
            <div v-if="wager.settlements.length" class="space-y-2">
              <div
                v-for="settlement in wager.settlements"
                :key="settlement.id"
                class="napkinbets-list-row"
              >
                <div class="flex gap-4">
                  <div class="shrink-0 -my-1 flex items-center">
                    <ULink
                      v-if="settlement.proofImageUrl"
                      @click="
                        openLightbox(
                          `/api/napkinbets/wagers/${wager.id}/settlements/${settlement.id}/proof-image`,
                        )
                      "
                      class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
                      title="View full payment proof"
                    >
                      <img
                        :src="`/api/napkinbets/wagers/${wager.id}/settlements/${settlement.id}/proof-image`"
                        alt="Payment proof"
                        class="h-16 w-16 hover:opacity-80 transition-opacity rounded object-cover shadow-sm bg-muted border border-default"
                      />
                    </ULink>
                    <UAvatar
                      v-else
                      :alt="participantNames.get(settlement.participantId) || 'No proof'"
                      :text="
                        displayNameToInitials(
                          participantNames.get(settlement.participantId) ?? '',
                        ) ||
                        (settlement.participantId
                          ? settlement.participantId.slice(0, 2).toUpperCase()
                          : '—')
                      "
                      size="lg"
                      class="shrink-0"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-default truncate">
                      {{ participantNames.get(settlement.participantId) || settlement.method }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ settlement.method }} •
                      {{
                        settlement.confirmationCode ||
                        settlement.handle ||
                        'Manual confirmation pending'
                      }}
                    </p>
                    <p v-if="settlement.rejectionNote" class="text-sm text-error mt-1">
                      {{ settlement.rejectionNote }}
                    </p>
                  </div>
                </div>
                <div class="text-right space-y-2 shrink-0">
                  <UBadge
                    :color="settlementBadgeColor(settlement.verificationStatus)"
                    variant="soft"
                  >
                    {{ settlement.verificationStatus }}
                  </UBadge>
                  <UBadge
                    v-if="settlement.recipientAcknowledged"
                    color="success"
                    variant="soft"
                    icon="i-lucide-check-check"
                  >
                    Recipient received
                  </UBadge>
                  <p class="font-semibold text-default">
                    {{ formatCurrency(settlement.amountCents) }}
                  </p>
                  <div class="flex justify-end gap-2">
                    <UButton
                      v-if="
                        !canManage &&
                        myParticipant &&
                        myParticipant.id !== settlement.participantId &&
                        !settlement.recipientAcknowledged
                      "
                      color="success"
                      variant="soft"
                      size="sm"
                      :loading="isBusy(`wager:acknowledge:${settlement.id}`)"
                      @click="emitAcknowledge(wager.id, settlement.id)"
                    >
                      Acknowledge receipt
                    </UButton>
                    <UButton
                      v-if="canManage && settlement.verificationStatus !== 'confirmed'"
                      color="success"
                      variant="soft"
                      size="sm"
                      :loading="isBusy(`settlement-confirm:${settlement.id}`)"
                      @click="emit('confirmSettlement', wager.id, settlement.id)"
                    >
                      Confirm host
                    </UButton>
                    <UButton
                      v-if="canManage && settlement.verificationStatus !== 'confirmed'"
                      color="error"
                      variant="soft"
                      size="sm"
                      :loading="isBusy(`settlement-reject:${settlement.id}`)"
                      @click="emit('rejectSettlement', wager.id, settlement.id)"
                    >
                      Send back
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted">No payment proof logged yet.</p>
          </div>

          <UAlert
            color="warning"
            variant="soft"
            icon="i-lucide-badge-alert"
            title="Compliance rail"
            :description="wager.terms"
          />
        </div>
      </div>
    </UCard>

    <UModal v-model:open="isLightboxOpen">
      <template #content>
        <div
          class="relative flex flex-col items-center justify-center p-2 bg-transparent overflow-hidden"
        >
          <img
            :src="lightboxImageUrl"
            alt="Full payment proof"
            class="max-w-full max-h-[85vh] rounded-lg object-contain"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            class="absolute top-4 right-4 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur"
            @click="isLightboxOpen = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

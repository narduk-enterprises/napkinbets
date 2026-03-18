<script setup lang="ts">
import type { JoinWagerInput, WagerSettlementReviewInput } from '../../../../types/napkinbets'
import type { NapkinbetsWagerSettlementStage } from '../../../utils/napkinbets-wager-detail'
import { getNapkinbetsWagerSettlementStage } from '../../../utils/napkinbets-wager-detail'

/** Stages where the hero "Settle up" button is shown (ready to settle, in progress, or done). Hidden for live/upcoming. */
const SETTLE_UP_VISIBLE_STAGES: NapkinbetsWagerSettlementStage[] = [
  'calling',
  'ready',
  'submitted',
  'rejected',
  'settled',
]

const route = useRoute()
const { user, loggedIn } = useUserSession()
const wagerState = await useNapkinbetsNapkin(() => String(route.params.slug || ''))
const actions = useNapkinbetsActions(wagerState.refresh)

const wager = computed(() => wagerState.data.value.wager)
const canManage = computed(() =>
  Boolean(
    loggedIn.value &&
    wager.value &&
    (user.value?.isAdmin || wager.value.ownerUserId === user.value?.id),
  ),
)

const myParticipant = computed(() =>
  wager.value && user.value?.id
    ? (wager.value.participants.find((p) => p.userId === user.value!.id) ?? null)
    : null,
)

const settlementStage = computed(() =>
  wager.value
    ? getNapkinbetsWagerSettlementStage(wager.value, myParticipant.value?.id ?? null)
    : null,
)

const showSettleUpInHero = computed(() =>
  Boolean(
    canManage.value &&
    settlementStage.value != null &&
    SETTLE_UP_VISIBLE_STAGES.includes(settlementStage.value),
  ),
)

const detailMetaLine = computed(() => {
  if (!wager.value) return ''
  const parts = [
    wager.value.eventTitle || 'Custom bet',
    wager.value.groupName,
    [wager.value.paymentService, wager.value.paymentHandle].filter(Boolean).join(' • ') || null,
    wager.value.venueName || null,
  ].filter(Boolean)
  return parts.join(' · ')
})

const isInvited = computed(
  () =>
    myParticipant.value !== null &&
    (myParticipant.value.joinStatus === 'invited' || myParticipant.value.joinStatus === 'pending'),
)

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

useNapkinbetsAutoRefresh(wagerState.refresh)

const acceptJoinPayload = computed(() => {
  if (!myParticipant.value || !wager.value) return { displayName: '', sideLabel: '' }
  return {
    displayName: myParticipant.value.displayName,
    sideLabel: myParticipant.value.sideLabel || wager.value.sideOptions[0] || 'Open side',
  }
})

async function handleJoin(wagerId: string, payload: JoinWagerInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  await actions.joinWager(wagerId, payload)
}

async function handleConfirmSettlement(wagerId: string, settlementId: string) {
  await actions.confirmSettlement(wagerId, settlementId)
}

async function handleAcknowledgeSettlement(wagerId: string, settlementId: string) {
  await actions.acknowledgeSettlement(wagerId, settlementId)
}

async function handleRejectSettlement(
  wagerId: string,
  settlementId: string,
  payload: WagerSettlementReviewInput = { note: '' },
) {
  await actions.rejectSettlement(wagerId, settlementId, payload)
}

async function handleShuffle(wagerId: string) {
  await actions.shuffleDraftOrder(wagerId)
}

async function handleReminder(wagerId: string) {
  await actions.queueReminder(wagerId)
}

async function handleClear(wagerId: string) {
  await actions.clearWager(wagerId)
  await navigateTo('/dashboard')
}

async function handleDecline(wagerId: string) {
  await actions.declineWager(wagerId)
  await navigateTo('/dashboard')
}

async function handleCallResult(
  wagerId: string,
  payload: {
    outcomes: Array<{ legId: string; outcomeOptionKey?: string; outcomeNumericValue?: number }>
    note?: string
  },
) {
  await actions.callResult(wagerId, payload)
}

async function handleAcceptResult(wagerId: string) {
  await actions.acceptResult(wagerId)
}

async function handleDisputeResult(wagerId: string, reason: string) {
  await actions.disputeResult(wagerId, reason)
}

useSeo({
  title: wager.value?.title || 'Bet',
  description:
    wager.value?.description || 'View the bet, picks, reminders, and payment confirmation.',
  ogImage: {
    title: wager.value?.title || 'Napkinbets bet',
    description: wager.value?.description || 'Bet detail and picks.',
    icon: wager.value?.status === 'settled' ? '🏆' : '🧾',
  },
})

defineOgImage({
  component: 'OgImageDefault',
  tag: [
    wager.value?.napkinType === 'simple-bet' ? 'Head to Head' : 'Pool',
    (wager.value?.status || 'open').charAt(0).toUpperCase() +
      (wager.value?.status || 'open').slice(1),
  ].join(' · '),
  /* eslint-disable narduk/no-inline-hex -- OG tag colors for Takumi WASM */
  tagColor:
    wager.value?.status === 'settled'
      ? '#f59e0b'
      : wager.value?.status === 'closed'
        ? '#ef4444'
        : '#22c55e',
  /* eslint-enable narduk/no-inline-hex -- end OG tag color block */
})

useWebPageSchema({
  name: 'Napkinbets Bet',
  description:
    'A detailed view of a Napkinbets bet including people, picks, reminders, and payment confirmation.',
})
</script>

<template>
  <div class="napkinbets-page napkinbets-detail">
    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="
        actions.feedback.value.type === 'success'
          ? 'i-lucide-check-circle-2'
          : 'i-lucide-circle-alert'
      "
      :title="actions.feedback.value.type === 'success' ? 'Bet updated' : 'Bet action failed'"
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="wagerState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Bet failed to load"
      :description="wagerState.error.value.message"
    />

    <template v-if="wager">
      <!-- One-on-one: invitation card (compact) -->
      <UCard v-if="isInvited" class="napkinbets-panel napkinbets-invitation-card">
        <div class="space-y-3">
          <div class="space-y-1.5">
            <p class="napkinbets-kicker">Invitation</p>
            <h2 class="napkinbets-section-heading">{{ wager.title }}</h2>
            <p class="napkinbets-support-copy">
              {{ wager.creatorName }} challenged you as
              <strong class="text-default">{{ myParticipant!.displayName }}</strong> on
              <strong class="text-default">{{ myParticipant!.sideLabel || 'Open side' }}</strong
              >.
            </p>
          </div>

          <div class="napkinbets-summary-grid">
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Stake</p>
              <p class="napkinbets-surface-value">{{ formatCurrency(wager.entryFeeCents) }}</p>
            </div>
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Payment</p>
              <p class="napkinbets-surface-value">{{ wager.paymentService }}</p>
            </div>
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Event</p>
              <p class="napkinbets-surface-value text-base">{{ wager.eventTitle || 'Custom' }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              color="primary"
              size="md"
              icon="i-lucide-check"
              :loading="actions.activeAction.value === `join:${wager.id}`"
              @click="handleJoin(wager.id, acceptJoinPayload)"
            >
              Accept bet
            </UButton>
            <UButton
              color="error"
              size="md"
              variant="soft"
              icon="i-lucide-x"
              :loading="actions.activeAction.value === `decline:${wager.id}`"
              @click="handleDecline(wager.id)"
            >
              Decline
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Pool bet: compact header (content-first, no hero panel) -->
      <div
        v-if="wager.napkinType !== 'simple-bet'"
        class="napkinbets-detail-header"
        aria-label="Bet overview"
      >
        <div class="napkinbets-detail-header-top">
          <h1 class="napkinbets-detail-title">{{ wager.title }}</h1>
          <div class="napkinbets-detail-header-actions">
            <UBadge :color="wager.status === 'live' ? 'success' : 'info'" variant="soft" size="xs">
              {{ wager.status }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ wager.format }}
            </UBadge>
            <UBadge v-if="wager.league" color="warning" variant="soft" size="xs">
              {{ wager.league.toUpperCase() }}
            </UBadge>
            <UButton
              v-if="showSettleUpInHero"
              :to="`/napkins/${wager.slug}/closeout`"
              color="primary"
              variant="soft"
              size="sm"
              icon="i-lucide-clipboard-list"
              class="napkinbets-detail-settle-btn"
            >
              Settle up
            </UButton>
          </div>
        </div>
        <p v-if="detailMetaLine" class="napkinbets-detail-meta">
          {{ detailMetaLine }}
        </p>
        <p v-if="wager.description" class="napkinbets-detail-description">
          {{ wager.description }}
        </p>
      </div>

      <!-- Custom bet outcome calling (above the main card) -->
      <NapkinbetsOutcomeCalling
        :wager="wager"
        :can-manage="canManage"
        :is-authenticated="loggedIn"
        :current-user-id="user?.id ?? null"
        :active-action="actions.activeAction.value"
        @call-result="handleCallResult"
        @accept-result="handleAcceptResult"
        @dispute-result="handleDisputeResult"
      />

      <NapkinbetsNapkinCard
        :wager="wager"
        :active-action="actions.activeAction.value"
        :can-manage="canManage"
        :is-authenticated="loggedIn"
        :current-user-id="user?.id ?? null"
        @join="handleJoin"
        @confirm-settlement="handleConfirmSettlement"
        @reject-settlement="handleRejectSettlement"
        @acknowledge-settlement="handleAcknowledgeSettlement"
        @shuffle="handleShuffle"
        @remind="handleReminder"
        @clear="handleClear"
        @decline="handleDecline"
      />
    </template>
  </div>
</template>

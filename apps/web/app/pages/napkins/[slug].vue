<script setup lang="ts">
import type {
  JoinWagerInput,
  WagerPickInput,
  WagerSettlementInput,
  WagerSettlementReviewInput,
} from '../../../types/napkinbets'

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

useNapkinbetsAutoRefresh(wagerState.refresh)

async function handleJoin(wagerId: string, payload: JoinWagerInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  await actions.joinWager(wagerId, payload)
}

async function handlePick(wagerId: string, payload: WagerPickInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  await actions.addPick(wagerId, payload)
}

async function handleSettlement(wagerId: string, payload: WagerSettlementInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  await actions.recordSettlement(wagerId, payload)
}

async function handleConfirmSettlement(wagerId: string, settlementId: string) {
  await actions.confirmSettlement(wagerId, settlementId)
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

useSeo({
  title: wager.value?.title || 'Bet',
  description:
    wager.value?.description || 'View the bet, picks, reminders, and payment confirmation.',
  ogImage: {
    title: wager.value?.title || 'Napkinbets bet',
    description: wager.value?.description || 'Bet detail and picks.',
    icon: '🧾',
  },
})

useWebPageSchema({
  name: 'Napkinbets Bet',
  description:
    'A detailed view of a Napkinbets bet including people, picks, reminders, and payment confirmation.',
})
</script>

<template>
  <div class="napkinbets-page">
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
      <div class="napkinbets-hero">
        <div class="napkinbets-hero-grid">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="wager.status === 'live' ? 'success' : 'info'" variant="soft">
                {{ wager.status }}
              </UBadge>
              <UBadge color="neutral" variant="subtle">
                {{ wager.napkinType === 'simple-bet' ? 'simple bet' : wager.format }}
              </UBadge>
              <UBadge v-if="wager.league" color="warning" variant="soft">{{
                wager.league.toUpperCase()
              }}</UBadge>
            </div>

            <div class="space-y-3">
              <p class="napkinbets-kicker">Bet</p>
              <h1 class="napkinbets-section-title">{{ wager.title }}</h1>
              <p class="napkinbets-hero-lede">{{ wager.description }}</p>
            </div>

            <div class="napkinbets-hero-pills">
              <span class="napkinbets-hero-pill">{{ wager.eventTitle || 'Custom bet' }}</span>
              <span v-if="wager.groupName" class="napkinbets-hero-pill">{{ wager.groupName }}</span>
              <span class="napkinbets-hero-pill"
                >{{ wager.paymentService
                }}{{ wager.paymentHandle ? ` • ${wager.paymentHandle}` : '' }}</span
              >
              <span class="napkinbets-hero-pill">{{ wager.venueName || 'Remote group' }}</span>
            </div>

            <div v-if="canManage" class="napkinbets-card-actions">
              <UButton
                :to="`/napkins/${wager.slug}/closeout`"
                color="primary"
                variant="soft"
                icon="i-lucide-clipboard-list"
              >
                Settle up
              </UButton>
            </div>
          </div>

          <UCard class="napkinbets-panel">
            <div class="space-y-3">
              <p class="napkinbets-kicker">At a glance</p>
              <div class="napkinbets-summary-grid">
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Players</p>
                  <p class="napkinbets-surface-value">{{ wager.participants.length }}</p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Payouts</p>
                  <p class="napkinbets-surface-value">{{ wager.pots.length }}</p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Paid</p>
                  <p class="napkinbets-surface-value">{{ wager.settlements.length }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <NapkinbetsNapkinCard
        :wager="wager"
        :active-action="actions.activeAction.value"
        :can-manage="canManage"
        :is-authenticated="loggedIn"
        @join="handleJoin"
        @add-pick="handlePick"
        @record-settlement="handleSettlement"
        @confirm-settlement="handleConfirmSettlement"
        @reject-settlement="handleRejectSettlement"
        @shuffle="handleShuffle"
        @remind="handleReminder"
        @clear="handleClear"
      />
    </template>
  </div>
</template>

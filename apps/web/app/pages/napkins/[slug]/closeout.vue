<script setup lang="ts">
import { reactive, ref } from 'vue'

import { displayNameToInitials, formatCurrency, getVerificationBadgeColor } from '~/utils/napkinbets-display'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { user } = useUserSession()
const wagerState = await useNapkinbetsNapkin(() => String(route.params.slug || ''))
const actions = useNapkinbetsActions(wagerState.refresh)
const { buildLinks, buildPaymentNote } = useNapkinbetsPaymentLinks()
const ai = useNapkinbetsAi()

const wager = computed(() => wagerState.data.value.wager)

const canManage = computed(() =>
  Boolean(wager.value && (user.value?.isAdmin || wager.value.ownerUserId === user.value?.id)),
)

watchEffect(async () => {
  if (!wagerState.pending.value && wager.value && !canManage.value) {
    await navigateTo(`/napkins/${wager.value.slug}`)
  }
})

const participantById = computed(
  () =>
    new Map((wager.value?.participants ?? []).map((participant) => [participant.id, participant])),
)

const pendingParticipants = computed(
  () =>
    wager.value?.participants.filter((participant) => participant.paymentStatus === 'pending') ??
    [],
)
const submittedParticipants = computed(
  () =>
    wager.value?.participants.filter((participant) => participant.paymentStatus === 'submitted') ??
    [],
)
const confirmedParticipants = computed(
  () =>
    wager.value?.participants.filter((participant) => participant.paymentStatus === 'confirmed') ??
    [],
)
const rejectedSettlements = computed(
  () =>
    wager.value?.settlements.filter((settlement) => settlement.verificationStatus === 'rejected') ??
    [],
)

const rejectionNotes = reactive<Record<string, string>>({})
const aiSummary = ref('')
const aiSummaryPending = ref(false)
const aiSummaryError = ref('')

const paymentNote = computed(() =>
  wager.value ? buildPaymentNote(wager.value.slug, 'entry', wager.value.entryFeeCents / 100) : '',
)

const paymentLinks = computed(() =>
  wager.value
    ? buildLinks(
        wager.value.paymentService,
        wager.value.paymentHandle,
        wager.value.entryFeeCents / 100,
        paymentNote.value,
      )
    : [],
)

async function handleConfirm(settlementId: string) {
  if (!wager.value) {
    return
  }

  await actions.confirmSettlement(wager.value.id, settlementId)
}

async function handleReject(settlementId: string) {
  if (!wager.value) {
    return
  }

  await actions.rejectSettlement(wager.value.id, settlementId, {
    note:
      rejectionNotes[settlementId]?.trim() ||
      'Proof needs a clearer handle, amount, or confirmation reference before the bet closes.',
  })
}

async function draftCloseoutSummary() {
  if (!wager.value) {
    return
  }

  aiSummaryPending.value = true
  aiSummaryError.value = ''

  try {
    const result = await ai.draftCloseoutSummary({
      title: wager.value.title,
      paymentService: wager.value.paymentService,
      pendingCount: pendingParticipants.value.length,
      submittedCount: submittedParticipants.value.length,
      confirmedCount: confirmedParticipants.value.length,
      rejectedCount: rejectedSettlements.value.length,
      leaderboard: wager.value.leaderboard.map((row) => ({
        displayName: row.displayName,
        projectedPayoutCents: row.projectedPayoutCents,
        score: row.score,
      })),
    })

    aiSummary.value = result.summary
  } catch (error) {
    aiSummaryError.value = error instanceof Error ? error.message : 'AI settle-up summary failed.'
  } finally {
    aiSummaryPending.value = false
  }
}

useSeo({
  title: wager.value ? `${wager.value.title} Settle Up` : 'Settle Up',
  description:
    'Host-facing settle-up checklist for confirming entries, reviewing payout projections, and closing a bet cleanly.',
  ogImage: {
    title: 'Napkinbets Settle Up',
    description: 'Finish the bet with a clear payment and payout checklist.',
    icon: '🧮',
  },
})

useWebPageSchema({
  name: 'Napkinbets Settle Up',
  description:
    'A settle-up workflow for hosts or admins managing payment proof and payout preparation on a Napkinbets bet.',
})
</script>

<template>
  <!-- eslint-disable narduk/no-template-complex-expressions -- pre-existing pattern ignores component refactoring -->
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
      :title="
        actions.feedback.value.type === 'success' ? 'Settle-up updated' : 'Settle-up action failed'
      "
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="wagerState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Settle-up view failed to load"
      :description="wagerState.error.value.message"
    />

    <template v-if="wager">
      <div class="napkinbets-hero">
        <div class="napkinbets-hero-grid xl:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <p class="napkinbets-kicker">Settle up</p>
            <h1 class="napkinbets-section-title">{{ wager.title }}</h1>
            <p class="napkinbets-hero-lede">
              Run the final pass here: confirm who paid, push back bad proof, and work from one
              payout preview instead of a loose group chat.
            </p>

            <div class="napkinbets-card-actions">
              <UButton
                :to="`/napkins/${wager.slug}`"
                color="neutral"
                variant="soft"
                icon="i-lucide-arrow-left"
              >
                Back to bet
              </UButton>
            </div>
          </div>

          <UCard class="napkinbets-panel">
            <div class="space-y-3">
              <p class="napkinbets-kicker">Pay with</p>
              <div class="napkinbets-summary-grid">
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Handle</p>
                  <p class="napkinbets-surface-value">{{ wager.paymentService }}</p>
                  <p class="napkinbets-support-copy">
                    {{ wager.paymentHandle || 'One-off handle' }}
                  </p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Entry</p>
                  <p class="napkinbets-surface-value">{{ formatCurrency(wager.entryFeeCents) }}</p>
                  <p class="napkinbets-support-copy">{{ paymentNote }}</p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Paid</p>
                  <p class="napkinbets-surface-value">
                    {{ confirmedParticipants.length }}/{{ wager.participants?.length ?? 0 }}
                  </p>
                  <p class="napkinbets-support-copy">Confirmed so far</p>
                </div>
              </div>

              <div class="napkinbets-card-actions flex-wrap">
                <UButton
                  v-for="link in paymentLinks"
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
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-4">
          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Checklist</p>
                <h2 class="napkinbets-subsection-title">Host checklist</h2>
              </div>

              <div class="napkinbets-process-list">
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">1</span>
                  <div>
                    <p class="font-semibold text-default">Confirm how people pay</p>
                    <p class="napkinbets-support-copy">
                      Use the links above so everyone sends to the same place with the same note.
                    </p>
                  </div>
                </div>
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">2</span>
                  <div>
                    <p class="font-semibold text-default">Review submitted proof</p>
                    <p class="napkinbets-support-copy">
                      Confirm the amount and handle, or send it back for a clearer screenshot.
                    </p>
                  </div>
                </div>
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">3</span>
                  <div>
                    <p class="font-semibold text-default">Check the payout preview</p>
                    <p class="napkinbets-support-copy">
                      Make sure the finish and projected payouts match the final result.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Summary</p>
                <h2 class="napkinbets-subsection-title">AI draft</h2>
              </div>

              <UAlert
                v-if="aiSummaryError"
                color="error"
                variant="soft"
                icon="i-lucide-circle-alert"
                title="Summary failed"
                :description="aiSummaryError"
              />

              <div class="flex flex-wrap items-center gap-3">
                <p v-if="aiSummary" class="napkinbets-support-copy flex-1 min-w-0">
                  {{ aiSummary }}
                </p>
                <p v-else class="napkinbets-support-copy flex-1 min-w-0">
                  Generate a short settle-up summary for the host before you close the bet.
                </p>
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-sparkles"
                  :loading="aiSummaryPending"
                  class="shrink-0"
                  @click="draftCloseoutSummary"
                >
                  Draft summary
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <div class="space-y-4">
          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Submitted</p>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="napkinbets-subsection-title">Ready to confirm</h2>
                  <span class="text-sm text-muted">
                    Paid: {{ confirmedParticipants.length }}/{{ wager.participants?.length ?? 0 }}
                  </span>
                </div>
              </div>

              <div v-if="wager.settlements.length" class="space-y-3">
                <div
                  v-for="settlement in wager.settlements"
                  :key="settlement.id"
                  class="napkinbets-surface space-y-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex gap-4">
                      <div class="shrink-0 mt-1 flex items-center">
                        <img
                          v-if="settlement.proofImageUrl"
                          :src="`/api/napkinbets/wagers/${wager.id}/settlements/${settlement.id}/proof-image`"
                          alt="Payment proof"
                          class="h-16 w-16 rounded object-cover shadow-sm bg-muted border border-default"
                        />
                        <UAvatar
                          v-else
                          :text="
                            displayNameToInitials(
                              participantById.get(settlement.participantId)?.displayName ?? '',
                            ) ||
                            (settlement.participantId
                              ? settlement.participantId.slice(0, 2).toUpperCase()
                              : '—')
                          "
                          :alt="
                            participantById.get(settlement.participantId)?.displayName || 'No proof'
                          "
                          size="3xl"
                          class="shrink-0 border border-default"
                        />
                      </div>
                      <div class="space-y-1">
                        <p class="font-semibold text-default">
                          {{
                            participantById.get(settlement.participantId)?.displayName ||
                            settlement.participantId
                          }}
                        </p>
                        <p class="text-sm text-muted">
                          {{ formatCurrency(settlement.amountCents) }} via {{ settlement.method }}
                        </p>
                      </div>
                    </div>

                    <div class="flex flex-col items-end gap-2 shrink-0">
                      <UBadge
                        :color="getVerificationBadgeColor(settlement.verificationStatus)"
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
                    </div>
                  </div>

                  <p class="napkinbets-support-copy">
                    {{ settlement.note || settlement.confirmationCode || 'No note added.' }}
                  </p>

                  <div
                    v-if="settlement.verificationStatus === 'submitted'"
                    class="napkinbets-card-actions"
                  >
                    <UButton color="primary" variant="soft" @click="handleConfirm(settlement.id)">
                      Confirm
                    </UButton>
                    <UInput
                      v-model="rejectionNotes[settlement.id]"
                      class="w-full md:max-w-xs"
                      placeholder="Ask for a clearer screenshot"
                    />
                    <UButton color="error" variant="soft" @click="handleReject(settlement.id)">
                      Send back
                    </UButton>
                  </div>
                </div>
              </div>

              <p v-else class="napkinbets-support-copy">
                {{
                  confirmedParticipants.length > 0
                    ? 'Payments confirmed; no proof to review.'
                    : 'No payment proof has been submitted yet.'
                }}
              </p>
            </div>
          </UCard>

          <UCard class="napkinbets-panel">
            <div class="space-y-3">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Still waiting</p>
                <h2 class="napkinbets-subsection-title">Players to follow up with</h2>
              </div>

              <div v-if="pendingParticipants.length" class="space-y-2">
                <div
                  v-for="participant in pendingParticipants"
                  :key="participant.id"
                  class="napkinbets-list-row"
                >
                  <div class="flex gap-4 items-center">
                    <UAvatar
                      :text="displayNameToInitials(participant.displayName ?? '') || '—'"
                      :alt="participant.displayName || 'No proof'"
                      size="3xl"
                      class="shrink-0 border border-default"
                    />
                    <div>
                      <p class="font-semibold text-default">{{ participant.displayName }}</p>
                      <p class="text-sm text-muted">{{ participant.sideLabel || 'No side yet' }}</p>
                    </div>
                  </div>

                  <UBadge color="warning" variant="soft">Pending</UBadge>
                </div>
              </div>

              <p v-else class="napkinbets-support-copy">
                {{
                  wager.settlements.length
                    ? 'Everyone has either paid or submitted proof.'
                    : 'No payment proof submitted yet.'
                }}
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>

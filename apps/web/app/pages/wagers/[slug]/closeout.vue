<script setup lang="ts">
import { reactive, ref } from 'vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { user } = useUserSession()
const wagerState = await useNapkinbetsWager(() => String(route.params.slug || ''))
const actions = useNapkinbetsActions(wagerState.refresh)
const { buildLinks, buildPaymentNote } = useNapkinbetsPaymentLinks()
const ai = useNapkinbetsAi()

const wager = computed(() => wagerState.data.value.wager)

const canManage = computed(() =>
  Boolean(wager.value && (user.value?.isAdmin || wager.value.ownerUserId === user.value?.id)),
)

watchEffect(async () => {
  if (!wagerState.pending.value && wager.value && !canManage.value) {
    await navigateTo(`/wagers/${wager.value.slug}`)
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
const submittedSettlements = computed(
  () =>
    wager.value?.settlements.filter(
      (settlement) => settlement.verificationStatus === 'submitted',
    ) ?? [],
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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

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
      'Proof needs a clearer handle, amount, or confirmation reference before closeout.',
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
    aiSummaryError.value = error instanceof Error ? error.message : 'AI closeout summary failed.'
  } finally {
    aiSummaryPending.value = false
  }
}

useSeo({
  title: wager.value ? `${wager.value.title} Closeout Playbook` : 'Closeout Playbook',
  description:
    'Owner-facing closeout checklist for confirming entries, reviewing payout projections, and finishing a friendly wager board cleanly.',
  ogImage: {
    title: 'Napkinbets Closeout Playbook',
    description: 'Finish the board with a structured settlement and payout checklist.',
    icon: '🧮',
  },
})

useWebPageSchema({
  name: 'Napkinbets Closeout Playbook',
  description:
    'A closeout workflow for owners or admins managing settlement proof and payout preparation on a Napkinbets board.',
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
      :title="
        actions.feedback.value.type === 'success' ? 'Closeout updated' : 'Closeout action failed'
      "
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="wagerState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Closeout playbook failed to load"
      :description="wagerState.error.value.message"
    />

    <template v-if="wager">
      <div class="napkinbets-hero">
        <div class="napkinbets-hero-grid xl:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <p class="napkinbets-kicker">Closeout playbook</p>
            <h1 class="napkinbets-section-title">{{ wager.title }}</h1>
            <p class="napkinbets-hero-lede">
              Run the final pass here: verify entry proof, push back bad submissions, and work from
              one payout preview instead of a loose chat thread.
            </p>

            <div class="napkinbets-card-actions">
              <UButton
                :to="`/wagers/${wager.slug}`"
                color="neutral"
                variant="soft"
                icon="i-lucide-arrow-left"
              >
                Back to board
              </UButton>
            </div>
          </div>

          <UCard class="napkinbets-panel">
            <div class="space-y-3">
              <p class="napkinbets-kicker">Collection rail</p>
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
              </div>

              <div class="napkinbets-card-actions">
                <UButton
                  v-for="link in paymentLinks"
                  :key="link.href"
                  :to="link.href"
                  color="primary"
                  variant="soft"
                  target="_blank"
                  icon="i-lucide-external-link"
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
                <h2 class="napkinbets-subsection-title">Owner runbook</h2>
              </div>

              <div class="napkinbets-process-list">
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">1</span>
                  <div>
                    <p class="font-semibold text-default">Verify the collection rail</p>
                    <p class="napkinbets-support-copy">
                      Use the payment pack above so everyone pays the same destination with the same
                      note shape.
                    </p>
                  </div>
                </div>
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">2</span>
                  <div>
                    <p class="font-semibold text-default">Review submitted proof</p>
                    <p class="napkinbets-support-copy">
                      Confirm clean entries and reject anything ambiguous before you lock closeout.
                    </p>
                  </div>
                </div>
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">3</span>
                  <div>
                    <p class="font-semibold text-default">Check payout preview</p>
                    <p class="napkinbets-support-copy">
                      Make sure the leaderboard and pot math still reflect what the group agreed to.
                    </p>
                  </div>
                </div>
                <div class="napkinbets-process-item">
                  <span class="napkinbets-process-step">4</span>
                  <div>
                    <p class="font-semibold text-default">Settle and archive</p>
                    <p class="napkinbets-support-copy">
                      Once manual payouts are done, move the board to its final state and keep the
                      ledger intact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Settlement states</p>
                <h2 class="napkinbets-subsection-title">What still needs work</h2>
              </div>

              <div class="napkinbets-summary-grid">
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Pending</p>
                  <p class="napkinbets-surface-value">{{ pendingParticipants.length }}</p>
                  <p class="napkinbets-support-copy">No payment proof logged yet</p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Submitted</p>
                  <p class="napkinbets-surface-value">{{ submittedParticipants.length }}</p>
                  <p class="napkinbets-support-copy">
                    Participant says paid, owner review still needed
                  </p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Confirmed</p>
                  <p class="napkinbets-surface-value">{{ confirmedParticipants.length }}</p>
                  <p class="napkinbets-support-copy">Ready for board closeout</p>
                </div>
              </div>

              <UAlert
                v-if="rejectedSettlements.length"
                color="warning"
                variant="soft"
                icon="i-lucide-triangle-alert"
                :title="`${rejectedSettlements.length} proof submissions were sent back`"
                description="These participants need to re-submit cleaner proof before you close the board."
              />
            </div>
          </UCard>
        </div>

        <div class="space-y-4">
          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Review queue</p>
                <h2 class="napkinbets-subsection-title">Submitted proof waiting on you</h2>
              </div>

              <div v-if="submittedSettlements.length" class="space-y-4">
                <div
                  v-for="settlement in submittedSettlements"
                  :key="settlement.id"
                  class="napkinbets-admin-board"
                >
                  <div class="space-y-2">
                    <p class="font-semibold text-default">
                      {{
                        participantById.get(settlement.participantId)?.displayName || 'Participant'
                      }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ settlement.method }} • {{ formatCurrency(settlement.amountCents) }} •
                      {{
                        settlement.confirmationCode || settlement.handle || 'No reference provided'
                      }}
                    </p>
                    <p v-if="settlement.note" class="text-sm text-muted">
                      {{ settlement.note }}
                    </p>
                  </div>

                  <UFormField :name="`rejection-note-${settlement.id}`" label="Return note">
                    <UTextarea
                      v-model="rejectionNotes[settlement.id]"
                      class="w-full"
                      :rows="2"
                      placeholder="Explain what needs to be corrected if you reject this proof."
                    />
                  </UFormField>

                  <div class="napkinbets-card-actions">
                    <UButton
                      color="success"
                      variant="soft"
                      :loading="
                        actions.activeAction.value === `settlement-confirm:${settlement.id}`
                      "
                      @click="handleConfirm(settlement.id)"
                    >
                      Confirm proof
                    </UButton>
                    <UButton
                      color="warning"
                      variant="soft"
                      :loading="actions.activeAction.value === `settlement-reject:${settlement.id}`"
                      @click="handleReject(settlement.id)"
                    >
                      Reject proof
                    </UButton>
                  </div>
                </div>
              </div>

              <UAlert
                v-else
                color="success"
                variant="soft"
                icon="i-lucide-badge-check"
                title="No submitted proof waiting"
                description="The closeout queue is clear right now."
              />
            </div>
          </UCard>

          <UCard class="napkinbets-panel">
            <div class="space-y-4">
              <div class="space-y-2">
                <p class="napkinbets-kicker">Payout preview</p>
                <h2 class="napkinbets-subsection-title">Projected winners</h2>
              </div>

              <div class="space-y-3">
                <div
                  v-for="row in wager.leaderboard"
                  :key="row.participantId"
                  class="napkinbets-list-row"
                >
                  <div>
                    <p class="font-semibold text-default">{{ row.displayName }}</p>
                    <p class="text-sm text-muted">{{ row.sideLabel }} • {{ row.score }} pts</p>
                  </div>
                  <p class="font-semibold text-default">
                    {{ formatCurrency(row.projectedPayoutCents) }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <UCard v-if="ai.enabled" class="napkinbets-panel">
            <div class="space-y-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-2">
                  <p class="napkinbets-kicker">AI assist</p>
                  <h2 class="napkinbets-subsection-title">Grounded closeout summary</h2>
                </div>

                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-sparkles"
                  :loading="aiSummaryPending"
                  @click="draftCloseoutSummary"
                >
                  Draft summary
                </UButton>
              </div>

              <p v-if="aiSummary" class="napkinbets-support-copy">
                {{ aiSummary }}
              </p>
              <UAlert
                v-else-if="aiSummaryError"
                color="warning"
                variant="soft"
                icon="i-lucide-circle-alert"
                title="AI summary unavailable"
                :description="aiSummaryError"
              />
              <p v-else class="napkinbets-support-copy">
                Use this when you want a concise operator summary of what still needs to happen
                before archive.
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>

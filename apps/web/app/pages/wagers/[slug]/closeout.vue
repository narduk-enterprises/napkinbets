<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const { user } = useUserSession()
const wagerState = await useNapkinbetsWager(() => String(route.params.slug || ''))
const wager = computed(() => wagerState.data.value.wager)

const canManage = computed(
  () =>
    Boolean(
      wager.value &&
        (user.value?.isAdmin || wager.value.ownerUserId === user.value?.id),
    ),
)

watchEffect(async () => {
  if (!wagerState.pending.value && wager.value && !canManage.value) {
    await navigateTo(`/wagers/${wager.value.slug}`)
  }
})

const pendingParticipants = computed(
  () => wager.value?.participants.filter((participant) => participant.paymentStatus === 'pending') ?? [],
)
const submittedParticipants = computed(
  () => wager.value?.participants.filter((participant) => participant.paymentStatus === 'submitted') ?? [],
)
const confirmedParticipants = computed(
  () => wager.value?.participants.filter((participant) => participant.paymentStatus === 'confirmed') ?? [],
)

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
      v-if="wagerState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Closeout playbook failed to load"
      :description="wagerState.error.value.message"
    />

    <template v-if="wager">
      <div class="napkinbets-hero">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Closeout playbook</p>
          <h1 class="napkinbets-section-title">{{ wager.title }}</h1>
          <p class="napkinbets-hero-lede">
            Use this checklist to finish the board cleanly: verify entry proofs, confirm the final state, and work from a single payout view instead of a loose chat thread.
          </p>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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
                  <p class="napkinbets-support-copy">Make sure the board still points at the correct {{ wager.paymentService }} destination before nudging anyone to pay.</p>
                </div>
              </div>
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">2</span>
                <div>
                  <p class="font-semibold text-default">Confirm submitted proofs</p>
                  <p class="napkinbets-support-copy">Use the board detail screen to confirm each submitted proof so participant states move from submitted to confirmed.</p>
                </div>
              </div>
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">3</span>
                <div>
                  <p class="font-semibold text-default">Review payout projections</p>
                  <p class="napkinbets-support-copy">Check the leaderboard and pot breakdown before you send manual payouts.</p>
                </div>
              </div>
              <div class="napkinbets-process-item">
                <span class="napkinbets-process-step">4</span>
                <div>
                  <p class="font-semibold text-default">Archive the board</p>
                  <p class="napkinbets-support-copy">Once settlement is final, move the board to a stable state and keep the ledger for reference.</p>
                </div>
              </div>
            </div>

            <div class="napkinbets-card-actions">
              <UButton :to="`/wagers/${wager.slug}`" color="primary" icon="i-lucide-arrow-left">
                Back to board
              </UButton>
            </div>
          </div>
        </UCard>

        <div class="space-y-4">
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
                  <p class="napkinbets-support-copy">Participant says paid, owner confirmation still missing</p>
                </div>
                <div class="napkinbets-surface">
                  <p class="napkinbets-surface-label">Confirmed</p>
                  <p class="napkinbets-surface-value">{{ confirmedParticipants.length }}</p>
                  <p class="napkinbets-support-copy">Ready for board closeout</p>
                </div>
              </div>
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
                    {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(row.projectedPayoutCents / 100) }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>

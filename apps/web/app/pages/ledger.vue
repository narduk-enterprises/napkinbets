<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const ledgerState = useNapkinbetsLedger({ server: false, lazy: true })
const ledger = computed(() => ledgerState.data.value)
const { buildLinks } = useNapkinbetsPaymentLinks()

const isInitialLoad = computed(() => {
  if (ledgerState.status.value !== 'pending') return false
  return ledger.value.counterparties.length === 0
})

const activeCounterparties = computed(() =>
  ledger.value.counterparties.filter((cp) => {
    const allConfirmed =
      cp.wagerEntries.length > 0 &&
      cp.wagerEntries.every((e) => e.verificationStatus === 'confirmed')
    return !allConfirmed
  }),
)

const settledCounterparties = computed(() =>
  ledger.value.counterparties.filter((cp) => {
    return (
      cp.wagerEntries.length > 0 &&
      cp.wagerEntries.every((e) => e.verificationStatus === 'confirmed')
    )
  }),
)

const expandedCounterparties = ref<Set<string>>(new Set())

function toggleExpanded(userId: string) {
  if (expandedCounterparties.value.has(userId)) {
    expandedCounterparties.value.delete(userId)
  } else {
    expandedCounterparties.value.add(userId)
  }
}

function paymentLinksForCounterparty(cp: {
  preferredPaymentMethod: string | null
  preferredPaymentHandle: string | null
  netBalanceCents: number
}) {
  if (!cp.preferredPaymentMethod || !cp.preferredPaymentHandle) return []
  const amount = Math.abs(cp.netBalanceCents) / 100
  return buildLinks(
    cp.preferredPaymentMethod,
    cp.preferredPaymentHandle,
    amount,
    'NapkinBets ledger settle-up',
  )
}

useSeo({
  title: 'Ledger',
  description:
    'See who you owe and who owes you across all your napkin bets, with a per-wager audit trail and quick pay links.',
  ogImage: {
    title: 'Napkinbets Ledger',
    description: 'Cross-bet payment reconciliation and audit.',
    icon: '📒',
  },
})

useWebPageSchema({
  name: 'Napkinbets Ledger',
  description:
    'A cross-wager payment reconciliation view showing net balances, per-bet breakdowns, and quick-pay links.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Ledger</p>
        <h1 class="napkinbets-section-title">Who owes what, settled in one place.</h1>
        <p class="napkinbets-hero-lede">
          Every finished bet between you and your friends, boiled down to a single net balance per
          person. Expand any row to see the per-bet audit trail.
        </p>
        <div class="napkinbets-card-actions">
          <UButton to="/dashboard" color="neutral" variant="soft" icon="i-lucide-arrow-left">
            Dashboard
          </UButton>
        </div>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Crunching your payment balances.</p>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="ledgerState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Ledger failed to load"
          :description="ledgerState.error.value.message"
        />

        <div v-else-if="isInitialLoad" class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Reconciling your finished bets.</p>
          <div class="pt-3">
            <UButton color="neutral" variant="ghost" loading> Calculating balances </UButton>
          </div>
        </div>

        <template v-else>
          <!-- Summary metrics -->
          <div class="napkinbets-metric-grid">
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">You owe</p>
              <p class="napkinbets-surface-value text-error">
                {{ formatCurrency(ledger.totalOwedCents) }}
              </p>
              <p class="napkinbets-support-copy">total across all bets</p>
            </div>
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">You're owed</p>
              <p class="napkinbets-surface-value text-success">
                {{ formatCurrency(ledger.totalOwedToYouCents) }}
              </p>
              <p class="napkinbets-support-copy">total from others</p>
            </div>
            <div class="napkinbets-surface">
              <p class="napkinbets-surface-label">Net position</p>
              <p
                class="napkinbets-surface-value"
                :class="
                  ledger.totalOwedToYouCents - ledger.totalOwedCents >= 0
                    ? 'text-success'
                    : 'text-error'
                "
              >
                {{ ledger.totalOwedToYouCents - ledger.totalOwedCents >= 0 ? '+' : '-'
                }}{{ formatCurrency(Math.abs(ledger.totalOwedToYouCents - ledger.totalOwedCents)) }}
              </p>
              <p class="napkinbets-support-copy">overall balance</p>
            </div>
          </div>

          <!-- Active balances -->
          <div v-if="activeCounterparties.length" class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-wallet" class="size-5 text-warning" />
              <h2 class="text-sm font-bold tracking-wide text-warning uppercase">Open Balances</h2>
              <UBadge color="warning" variant="soft" size="xs">
                {{ activeCounterparties.length }}
              </UBadge>
            </div>

            <div class="space-y-2">
              <NapkinbetsLedgerCounterpartyCard
                v-for="cp in activeCounterparties"
                :key="cp.userId"
                :counterparty="cp"
                :expanded="expandedCounterparties.has(cp.userId)"
                :payment-links="paymentLinksForCounterparty(cp)"
                @toggle="toggleExpanded(cp.userId)"
              />
            </div>
          </div>

          <!-- Empty state -->
          <UAlert
            v-else-if="settledCounterparties.length === 0"
            color="info"
            variant="soft"
            icon="i-lucide-check-circle-2"
            title="All clear"
            description="You have no outstanding balances. Finish a bet to see your ledger here."
          />

          <!-- Settled section -->
          <div v-if="settledCounterparties.length" class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle-2" class="size-5 text-success" />
              <h2 class="text-sm font-bold tracking-wide text-success uppercase">Fully Settled</h2>
              <UBadge color="success" variant="soft" size="xs">
                {{ settledCounterparties.length }}
              </UBadge>
            </div>

            <div class="space-y-2">
              <NapkinbetsLedgerCounterpartyCard
                v-for="cp in settledCounterparties"
                :key="cp.userId"
                :counterparty="cp"
                settled
                :expanded="expandedCounterparties.has(cp.userId)"
                @toggle="toggleExpanded(cp.userId)"
              />
            </div>
          </div>
          <!-- Payment History -->
          <div v-if="ledger.paymentHistory.length" class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-history" class="size-5 text-info" />
              <h2 class="text-sm font-bold tracking-wide text-info uppercase">Payment History</h2>
              <UBadge color="info" variant="soft" size="xs">
                {{ ledger.paymentHistory.length }}
              </UBadge>
            </div>

            <div class="space-y-2">
              <div
                v-for="entry in ledger.paymentHistory"
                :key="entry.settlementId"
                class="napkinbets-list-row"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <UIcon
                    :name="
                      entry.direction === 'sent'
                        ? 'i-lucide-arrow-up-right'
                        : 'i-lucide-arrow-down-left'
                    "
                    :class="entry.direction === 'sent' ? 'text-error' : 'text-success'"
                    class="size-5 shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <NuxtLink
                      :to="`/napkins/${entry.wagerSlug}`"
                      class="font-medium text-default hover:text-primary truncate block"
                    >
                      {{ entry.wagerTitle }}
                    </NuxtLink>
                    <p class="text-xs text-muted">
                      {{ entry.direction === 'sent' ? 'Paid' : 'Received from' }}
                      {{ entry.counterpartyName }}
                      <template v-if="entry.method"> via {{ entry.method }}</template>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="text-sm font-semibold"
                    :class="entry.direction === 'sent' ? 'text-error' : 'text-success'"
                  >
                    {{ entry.direction === 'sent' ? '-' : '+'
                    }}{{ formatCurrency(entry.amountCents) }}
                  </span>
                  <UBadge
                    :color="getVerificationBadgeColor(entry.verificationStatus)"
                    variant="soft"
                    size="xs"
                  >
                    {{ entry.verificationStatus }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ClientOnly>
  </div>
</template>

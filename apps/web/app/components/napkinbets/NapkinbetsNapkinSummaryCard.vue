<script setup lang="ts">
import type { NapkinbetsWager } from '../../../types/napkinbets'

const props = defineProps<{
  title: string
  description: string
  wager: NapkinbetsWager
  actionLabel?: string
}>()

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const leadingRow = computed(() => props.wager.leaderboard[0] ?? null)
</script>

<template>
  <UCard class="napkinbets-panel">
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

      <div class="space-y-2">
        <p class="napkinbets-kicker">{{ title }}</p>
        <h3 class="napkinbets-subsection-title">{{ wager.title }}</h3>
        <p class="napkinbets-support-copy">{{ description }}</p>
      </div>

      <div class="napkinbets-summary-grid">
        <div class="napkinbets-surface">
          <p class="napkinbets-surface-label">Entry</p>
          <p class="napkinbets-surface-value">{{ formatCurrency(wager.entryFeeCents) }}</p>
          <p class="napkinbets-support-copy">
            {{ wager.paymentService }}{{ wager.paymentHandle ? ` • ${wager.paymentHandle}` : '' }}
          </p>
        </div>

        <div class="napkinbets-surface">
          <p class="napkinbets-surface-label">Participants</p>
          <p class="napkinbets-surface-value">{{ wager.participants.length }}</p>
          <p class="napkinbets-support-copy">{{ wager.sideOptions.length }} side{{ wager.sideOptions.length === 1 ? '' : 's' }}</p>
        </div>

        <div class="napkinbets-surface">
          <p class="napkinbets-surface-label">Leader</p>
          <p class="napkinbets-surface-value">{{ leadingRow?.displayName || 'Open' }}</p>
          <p class="napkinbets-support-copy">
            {{
              leadingRow
                ? `${leadingRow.score} pts • ${formatCurrency(leadingRow.projectedPayoutCents)} projected`
                : 'No picks logged yet'
            }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="napkinbets-meta-row">
          <span>{{ wager.eventTitle || 'Custom napkin' }}</span>
          <span v-if="wager.groupName">{{ wager.groupName }}</span>
          <span>{{ wager.venueName || 'Remote group' }}</span>
        </div>

        <UButton :to="`/napkins/${wager.slug}`" color="primary" icon="i-lucide-arrow-right">
          {{ actionLabel || 'Open napkin' }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>

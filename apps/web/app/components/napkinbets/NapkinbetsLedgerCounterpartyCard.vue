<script setup lang="ts">
const props = defineProps<{
  counterparty: {
    userId: string
    avatarUrl: string | null
    displayName: string
    wagerEntries: Array<{
      wagerId: string
      wagerSlug: string
      wagerTitle: string
      method: string | null
      amountCents: number
      verificationStatus: string | null
      paymentStatus: string | null
    }>
    netBalanceCents: number
    preferredPaymentMethod: string | null
    preferredPaymentHandle: string | null
  }
  settled?: boolean
  expanded: boolean
  paymentLinks?: Array<{ href: string; label: string }>
}>()

const emit = defineEmits<{
  toggle: []
}>()

const betCount = computed(() => props.counterparty.wagerEntries.length)
</script>

<template>
  <UCard
    class="napkinbets-panel"
    :class="settled ? 'opacity-80 hover:opacity-100 transition-opacity' : ''"
  >
    <div class="space-y-3">
      <!-- Counterparty header row -->
      <div
        class="flex items-center justify-between gap-3 cursor-pointer"
        @click="emit('toggle')"
      >
        <div class="flex items-center gap-3">
          <UAvatar
            :src="counterparty.avatarUrl || undefined"
            :alt="counterparty.displayName"
            size="sm"
          />
          <div>
            <p class="font-semibold text-default">{{ counterparty.displayName }}</p>
            <p class="text-sm text-muted">
              {{ betCount }} bet{{ betCount === 1 ? '' : 's' }}
              <template v-if="settled"> • all confirmed</template>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <p v-if="settled" class="text-lg font-bold text-success">Settled</p>
            <p
              v-else
              class="text-lg font-bold"
              :class="counterparty.netBalanceCents > 0 ? 'text-error' : 'text-success'"
            >
              {{ counterparty.netBalanceCents > 0 ? 'You owe' : 'Owes you' }}
              {{ formatCurrency(counterparty.netBalanceCents) }}
            </p>
          </div>
          <UIcon
            :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-5 text-dimmed"
          />
        </div>
      </div>

      <!-- Quick pay links (active only) -->
      <div
        v-if="!settled && paymentLinks && paymentLinks.length"
        class="napkinbets-card-actions"
      >
        <UButton
          v-for="link in paymentLinks"
          :key="link.href"
          :to="link.href"
          color="primary"
          variant="soft"
          size="sm"
          target="_blank"
          icon="i-lucide-external-link"
        >
          {{ link.label }}
        </UButton>
      </div>

      <div
        v-else-if="
          !settled &&
          counterparty.netBalanceCents > 0 &&
          counterparty.preferredPaymentMethod &&
          counterparty.preferredPaymentHandle
        "
        class="napkinbets-support-copy"
      >
        Pay via {{ counterparty.preferredPaymentMethod }}:
        <span class="font-medium text-default">{{ counterparty.preferredPaymentHandle }}</span>
      </div>

      <!-- Expanded wager breakdown -->
      <div
        v-if="expanded"
        class="space-y-2 pt-2 border-t border-default"
      >
        <NapkinbetsLedgerEntryRow
          v-for="entry in counterparty.wagerEntries"
          :key="entry.wagerId"
          :wager-slug="entry.wagerSlug"
          :wager-title="entry.wagerTitle"
          :method="entry.method"
          :amount-cents="entry.amountCents"
          :verification-status="entry.verificationStatus"
          :payment-status="entry.paymentStatus"
        />
      </div>
    </div>
  </UCard>
</template>

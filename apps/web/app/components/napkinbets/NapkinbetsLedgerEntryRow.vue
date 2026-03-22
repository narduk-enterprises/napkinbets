<script setup lang="ts">
defineProps<{
  wagerSlug: string
  wagerTitle: string
  method: string | null
  amountCents: number
  verificationStatus: string | null
  paymentStatus?: string | null
}>()
</script>

<template>
  <div class="napkinbets-list-row">
    <div class="min-w-0 flex-1">
      <NuxtLink
        :to="`/napkins/${wagerSlug}`"
        class="font-medium text-default hover:text-primary truncate block"
      >
        {{ wagerTitle }}
      </NuxtLink>
      <p class="text-xs text-muted">
        <template v-if="method">via {{ method }}</template>
        <template v-else>no payment recorded</template>
      </p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span
        class="text-sm font-semibold"
        :class="amountCents > 0 ? 'text-error' : 'text-success'"
      >
        {{ amountCents > 0 ? '-' : '+' }}{{ formatCurrencyAbs(amountCents) }}
      </span>
      <UBadge
        :color="getVerificationBadgeColor(verificationStatus)"
        variant="soft"
        size="xs"
      >
        {{ verificationStatus || paymentStatus }}
      </UBadge>
    </div>
  </div>
</template>

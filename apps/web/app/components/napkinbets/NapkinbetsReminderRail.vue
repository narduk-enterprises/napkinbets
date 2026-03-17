<script setup lang="ts">
import type { NapkinbetsNotification } from '../../../types/napkinbets'

defineProps<{
  title: string
  emptyLabel: string
  reminders: NapkinbetsNotification[]
}>()
</script>

<template>
  <UCard class="napkinbets-panel">
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="napkinbets-kicker">Follow-up</p>
        <h3 class="napkinbets-subsection-title">{{ title }}</h3>
      </div>

      <div v-if="reminders.length" class="space-y-3">
        <div v-for="reminder in reminders" :key="reminder.id" class="napkinbets-note-row">
          <div>
            <p class="font-semibold text-default">{{ reminder.title }}</p>
            <p class="text-sm text-muted">{{ reminder.body }}</p>
          </div>

          <UBadge color="neutral" variant="subtle">
            {{ reminder.deliveryStatus }}
          </UBadge>
        </div>
      </div>

      <UAlert
        v-else
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        :title="emptyLabel"
        description="No queued reminders are waiting on you right now."
      />
    </div>
  </UCard>
</template>

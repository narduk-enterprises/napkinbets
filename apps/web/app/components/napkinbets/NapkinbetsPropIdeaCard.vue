<script setup lang="ts">
import type { NapkinbetsPropIdea } from '../../../types/napkinbets'

defineProps<{
  idea: NapkinbetsPropIdea
}>()
</script>

<template>
  <UCard class="napkinbets-panel">
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="napkinbets-kicker">{{ idea.category }}</p>
        <h3 class="napkinbets-subsection-title">{{ idea.title }}</h3>
        <p class="napkinbets-support-copy">{{ idea.summary }}</p>
      </div>

      <div class="space-y-2">
        <p class="napkinbets-surface-label">Examples</p>
        <div class="napkinbets-chip-grid">
          <span v-for="example in idea.examples" :key="example" class="napkinbets-choice-chip">
            {{ example }}
          </span>
        </div>
      </div>

      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-hand-coins"
        :title="idea.context"
        :description="idea.settlementHint"
      />
    </div>
  </UCard>
</template>

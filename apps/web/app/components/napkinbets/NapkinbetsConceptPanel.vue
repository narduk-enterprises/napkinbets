<script setup lang="ts">
import type { NapkinbetsConcept } from '../../../types/napkinbets'

defineProps<{
  concept: NapkinbetsConcept
}>()
</script>

<template>
  <UCard class="napkinbets-panel h-full">
    <template #header>
      <div class="space-y-2">
        <p class="napkinbets-kicker">Build brief</p>
        <h2 class="napkinbets-section-title">What makes Napkinbets a flagship fleet app</h2>
        <p class="napkinbets-support-copy">
          {{ concept.summary }}
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div class="space-y-3">
        <h3 class="napkinbets-subsection-title">Feature requirements</h3>
        <ul class="napkinbets-bullet-list">
          <li v-for="item in concept.featureRequirements" :key="item">
            <span class="napkinbets-bullet-dot" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <USeparator />

      <div class="space-y-3">
        <h3 class="napkinbets-subsection-title">Architecture</h3>
        <ul class="napkinbets-bullet-list">
          <li v-for="item in concept.architectureSuggestions" :key="item">
            <span class="napkinbets-bullet-dot" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <USeparator />

      <div class="space-y-3">
        <h3 class="napkinbets-subsection-title">Execution plan</h3>
        <ul class="napkinbets-bullet-list">
          <li v-for="item in concept.implementationPlan" :key="item">
            <span class="napkinbets-bullet-dot" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-shield-alert"
        title="Friendly wagers only"
        :description="concept.compliance.join(' ')"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { NapkinbetsPropIdea } from '../../../types/napkinbets'

const props = defineProps<{
  idea: NapkinbetsPropIdea
}>()

function tidySentence(value: string) {
  return value.trim().replace(/[.!?]+$/u, '')
}

const note = computed(() => `${tidySentence(props.idea.context)}. ${tidySentence(props.idea.settlementHint)}.`)
</script>

<template>
  <UCard class="napkinbets-panel">
    <div class="space-y-3">
      <div class="space-y-1.5">
        <p class="napkinbets-kicker">{{ idea.category }}</p>
        <h3 class="napkinbets-subsection-title">{{ idea.title }}</h3>
        <p class="napkinbets-support-copy">{{ idea.summary }}</p>
      </div>

      <div class="space-y-2">
        <div class="napkinbets-chip-grid">
          <span
            v-for="example in idea.examples.slice(0, 2)"
            :key="example"
            class="napkinbets-choice-chip"
          >
            {{ example }}
          </span>
        </div>
      </div>

      <p class="napkinbets-prop-note">{{ note }}</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { NuxtLinkProps } from '#app'
import type { NapkinbetsGameTemplate } from '../../../utils/napkinbets-game-templates'
import {
  getNapkinbetsTemplateSupportColor,
  getNapkinbetsTemplateSupportLabel,
} from '../../../utils/napkinbets-game-templates'

const props = withDefaults(
  defineProps<{
    template: NapkinbetsGameTemplate
    to?: NuxtLinkProps['to']
    ctaLabel?: string
    showSupport?: boolean
  }>(),
  {
    to: undefined,
    ctaLabel: 'Start from this template',
    showSupport: true,
  },
)

const supportLabel = computed(() => getNapkinbetsTemplateSupportLabel(props.template.support))
const supportColor = computed(() => getNapkinbetsTemplateSupportColor(props.template.support))
</script>

<template>
  <UCard class="napkinbets-panel h-full">
    <div class="flex h-full flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">{{ template.categoryLabel }}</p>
          <h3 class="napkinbets-subsection-title">{{ template.label }}</h3>
        </div>
        <UBadge v-if="showSupport" :color="supportColor" variant="soft">
          {{ supportLabel }}
        </UBadge>
      </div>

      <p class="napkinbets-support-copy">
        {{ template.summary }}
      </p>

      <div class="grid gap-2 sm:grid-cols-2">
        <div class="napkinbets-note-row">
          <div>
            <p class="font-semibold text-default">Best for</p>
            <p class="text-sm text-muted">{{ template.playersLabel }}</p>
          </div>
        </div>

        <div class="napkinbets-note-row">
          <div>
            <p class="font-semibold text-default">Run time</p>
            <p class="text-sm text-muted">{{ template.durationLabel }}</p>
          </div>
        </div>

        <div class="napkinbets-note-row">
          <div>
            <p class="font-semibold text-default">Setup</p>
            <p class="text-sm text-muted">{{ template.setupLabel }}</p>
          </div>
        </div>

        <div class="napkinbets-note-row">
          <div>
            <p class="font-semibold text-default">Scoring</p>
            <p class="text-sm text-muted">{{ template.scoringLabel }}</p>
          </div>
        </div>
      </div>

      <div class="mt-auto flex flex-wrap gap-2">
        <UButton v-if="to" :to="to" color="primary" icon="i-lucide-play">
          {{ ctaLabel }}
        </UButton>
        <UBadge color="neutral" variant="subtle">
          {{ template.sportLabel }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>

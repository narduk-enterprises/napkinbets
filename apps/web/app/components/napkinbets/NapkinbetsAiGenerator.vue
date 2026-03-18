<script setup lang="ts">
import type { NapkinbetsGeneratedNapkin } from '../../../types/napkinbets'

const props = defineProps<{
  eventContext?: {
    eventTitle: string
    sport: string
    league: string
    homeTeamName?: string
    awayTeamName?: string
    venueName?: string
    startTime?: string
    status?: string
  }
}>()

const emit = defineEmits<{
  (e: 'use-napkin', napkin: NapkinbetsGeneratedNapkin): void
}>()

const { generating, result, error, generateNapkin, clear } = useNapkinbetsAiGenerator()

const prompt = ref('')

async function handleGenerate() {
  if (!prompt.value.trim()) return
  await generateNapkin(prompt.value, props.eventContext)
}

function handleUse() {
  if (result.value) {
    emit('use-napkin', result.value)
  }
}

function handleStartOver() {
  clear()
  prompt.value = ''
}

const placeholders = [
  'Who can eat the most wings at the watch party?',
  'Create a fun prop bet about the halftime show',
  'Make a bet on first touchdown scorer',
  'Closest to guessing the final score wins',
  'Over/under on how many times the ref reviews a play',
]

const placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]
</script>

<template>
  <UCard class="napkinbets-panel overflow-hidden">
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary" />
        </div>
        <div>
          <p class="font-semibold text-default">AI Napkin Generator</p>
          <p class="text-xs text-muted">Describe the bet you want and Grok will draft it for you</p>
        </div>
      </div>

      <!-- Event context badge -->
      <UAlert
        v-if="eventContext"
        color="info"
        variant="soft"
        icon="i-lucide-calendar"
        :title="eventContext.eventTitle"
        :description="`${eventContext.sport} • ${eventContext.league}${eventContext.venueName ? ' • ' + eventContext.venueName : ''}`"
      />

      <!-- Input area -->
      <div v-if="!result" class="space-y-3">
        <UTextarea
          v-model="prompt"
          :placeholder="placeholder"
          :rows="3"
          autoresize
          class="w-full"
          :disabled="generating"
          @keydown.meta.enter="handleGenerate"
          @keydown.ctrl.enter="handleGenerate"
        />
        <div class="flex items-center justify-between">
          <p class="text-xs text-dimmed">⌘ + Enter to generate</p>
          <UButton
            color="primary"
            :loading="generating"
            :disabled="!prompt.trim()"
            icon="i-lucide-sparkles"
            @click="handleGenerate"
          >
            Generate Napkin
          </UButton>
        </div>
      </div>

      <!-- Error state -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Generation failed"
        :description="error"
      />

      <!-- Result display -->
      <div v-if="result" class="space-y-4">
        <!-- AI message -->
        <div v-if="result.message" class="flex gap-2 items-start">
          <div
            class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"
          >
            <UIcon name="i-lucide-bot" class="w-3.5 h-3.5 text-primary" />
          </div>
          <p class="text-sm text-muted">{{ result.message }}</p>
        </div>

        <!-- Generated napkin preview -->
        <UCard class="napkinbets-panel ring-primary/20">
          <div class="space-y-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="subtle" size="sm">
                  {{ result.format }}
                </UBadge>
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ result.category }}
                </UBadge>
              </div>
              <h3 class="font-semibold text-default text-lg">{{ result.title }}</h3>
              <p class="text-sm text-muted">{{ result.description }}</p>
            </div>

            <USeparator />

            <!-- Legs -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">
                {{ result.legs.length > 1 ? 'Legs' : 'Question' }}
              </p>
              <div v-for="(leg, i) in result.legs" :key="i" class="space-y-1">
                <p class="text-sm text-default font-medium">
                  {{ result.legs.length > 1 ? `${i + 1}. ` : '' }}{{ leg.questionText }}
                </p>
                <div v-if="leg.legType === 'categorical'" class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="opt in leg.options"
                    :key="opt"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    {{ opt }}
                  </UBadge>
                </div>
                <p v-else class="text-xs text-dimmed">
                  Numeric answer {{ leg.numericUnit ? `(${leg.numericUnit})` : '' }}
                </p>
              </div>
            </div>

            <USeparator />

            <!-- Side options -->
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Sides</p>
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="side in result.sideOptions"
                  :key="side"
                  color="primary"
                  variant="subtle"
                  size="sm"
                >
                  {{ side }}
                </UBadge>
              </div>
            </div>

            <!-- Terms -->
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Terms</p>
              <p class="text-sm text-muted">{{ result.terms }}</p>
            </div>
          </div>
        </UCard>

        <!-- Actions -->
        <div class="flex gap-2 justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            @click="handleStartOver"
          >
            Start Over
          </UButton>
          <UButton color="primary" icon="i-lucide-check" @click="handleUse">
            Use this Napkin
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

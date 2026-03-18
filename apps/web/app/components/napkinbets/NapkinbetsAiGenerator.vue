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

const { generating, result, error, generateNapkin, clear, messages } = useNapkinbetsAiGenerator()

const prompt = ref('')

async function handleGenerate() {
  if (!prompt.value.trim() || generating.value) return
  const currentPrompt = prompt.value
  prompt.value = '' // Clear input immediately
  await generateNapkin(currentPrompt, props.eventContext)
  // Revert prompt if it failed
  if (error.value) {
    prompt.value = currentPrompt
  }
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

      <!-- Chat History -->
      <div v-if="messages.length > 0" class="space-y-4 max-h-[400px] overflow-y-auto p-1">
        <template v-for="(msg, index) in messages" :key="index">
          <!-- User Message -->
          <div v-if="msg.role === 'user'" class="flex gap-3 justify-end">
            <div
              class="bg-muted rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm text-default"
            >
              {{ msg.content }}
            </div>
            <UAvatar size="sm" alt="You" class="shrink-0" />
          </div>

          <!-- AI Loading State -->
          <div
            v-if="msg.role === 'user' && index === messages.length - 1 && generating"
            class="flex gap-3 items-start"
          >
            <div
              class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
            >
              <UIcon name="i-lucide-bot" class="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div
              class="bg-primary/5 rounded-2xl rounded-tl-sm px-4 py-3 min-w-[100px] flex items-center gap-1 mt-1"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                style="animation-delay: 0ms"
              ></span>
              <span
                class="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                style="animation-delay: 150ms"
              ></span>
              <span
                class="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                style="animation-delay: 300ms"
              ></span>
            </div>
          </div>
        </template>
      </div>

      <!-- Result display -->
      <div v-if="result" class="space-y-4">
        <!-- AI message -->
        <div v-if="result.message" class="flex gap-3 items-start">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-bot" class="w-4 h-4 text-primary" />
          </div>
          <div
            class="bg-primary/5 rounded-2xl rounded-tl-sm px-4 py-3 w-full text-sm text-default mt-1"
          >
            {{ result.message }}
          </div>
        </div>

        <!-- Generated napkin preview -->
        <UCard class="napkinbets-panel ring-primary/20 ml-11">
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
      </div>

      <!-- Input area -->
      <div class="space-y-3 mt-4">
        <UTextarea
          v-model="prompt"
          :placeholder="
            messages.length === 0 ? placeholder : 'Send a follow up to modify the napkin...'
          "
          :rows="2"
          autoresize
          class="w-full"
          :disabled="generating"
          @keydown.prevent.enter="handleGenerate"
        />
        <div class="flex items-center justify-between">
          <p class="text-xs text-dimmed">Press Enter to send (Shift+Enter for new line)</p>
          <div class="flex gap-2">
            <UButton
              v-if="messages.length > 0"
              color="neutral"
              variant="ghost"
              icon="i-lucide-rotate-ccw"
              :disabled="generating"
              @click="handleStartOver"
            >
              Start Over
            </UButton>
            <UButton
              v-if="result"
              color="primary"
              variant="soft"
              icon="i-lucide-check"
              class="mr-2"
              @click="handleUse"
            >
              Use this Napkin
            </UButton>
            <UButton
              color="primary"
              :loading="generating"
              :disabled="!prompt.trim()"
              icon="i-lucide-sparkles"
              @click="handleGenerate"
            >
              {{ messages.length === 0 ? 'Generate' : 'Update' }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

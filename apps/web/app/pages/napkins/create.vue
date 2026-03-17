<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateWagerInput } from '../../../types/napkinbets'
import { NAPKINBETS_DEFAULT_CREATE_INPUT } from '../../composables/useNapkinbetsCreatePrefill'

const { loggedIn, user } = useUserSession()
const { createMode, prefill, eventPreview } = useNapkinbetsCreatePrefill()
const { data: taxonomy } = await useNapkinbetsTaxonomy()
const actions = useNapkinbetsActions(async () => Promise.resolve())
const paymentProfilesState = loggedIn.value ? await useNapkinbetsPaymentProfiles() : null

const defaultPaymentProfile = computed(
  () => paymentProfilesState?.data.value.profiles.find((profile) => profile.isDefault) ?? null,
)

const selectedMode = ref<'event' | 'manual'>('manual')

watch(
  createMode,
  (value) => {
    selectedMode.value = value
  },
  { immediate: true },
)

const sharedDefaults = computed(() => ({
  creatorName: user.value?.name || user.value?.email || NAPKINBETS_DEFAULT_CREATE_INPUT.creatorName,
  paymentService:
    defaultPaymentProfile.value?.provider || NAPKINBETS_DEFAULT_CREATE_INPUT.paymentService,
  paymentHandle:
    defaultPaymentProfile.value?.handle || NAPKINBETS_DEFAULT_CREATE_INPUT.paymentHandle,
}))

const eventPrefill = computed(() => ({
  ...prefill.value,
  ...sharedDefaults.value,
}))

const manualPrefill = computed<CreateWagerInput>(() => ({
  ...NAPKINBETS_DEFAULT_CREATE_INPUT,
  ...sharedDefaults.value,
  eventSource: '',
  eventId: '',
  eventTitle: '',
  eventStartsAt: '',
  eventStatus: '',
  homeTeamName: '',
  awayTeamName: '',
}))

const activePrefill = computed(() =>
  selectedMode.value === 'event' && eventPreview.value ? eventPrefill.value : manualPrefill.value,
)

async function handleCreate(payload: CreateWagerInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  const result = await actions.createWager(payload)
  if (result?.slug) {
    await navigateTo(`/napkins/${result.slug}`)
  }
}

useSeo({
  title: 'Start a pool',
  description:
    'Start a pool from a live game or build a custom one with your own rules and pay-with details.',
  image: '/brand/og/create.webp',
})

useWebPageSchema({
  name: 'Start a pool',
  description: 'A creation workflow for building a new social pool on Napkinbets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="napkinbets-hero-grid xl:grid-cols-[1.05fr_0.95fr]">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Start</p>
          <h1 class="napkinbets-section-title">
            Build the pool from a real game or start from scratch.
          </h1>
          <p class="napkinbets-hero-lede">
            Pick the quick path when the game is already here, or start a custom pool for drafts,
            watch parties, golf, and one-off bets.
          </p>
        </div>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Paths</p>
            <div class="grid gap-3">
              <UButton
                class="napkinbets-choice-panel"
                :class="{ 'napkinbets-choice-panel-active': selectedMode === 'event' }"
                :disabled="!eventPreview"
                color="neutral"
                variant="ghost"
                @click="selectedMode = 'event'"
              >
                <span class="napkinbets-surface-label">From a game</span>
                <span class="font-semibold text-default">
                  {{ eventPreview ? eventPreview.title : 'Pick a game from Events first' }}
                </span>
                <span class="text-sm text-muted">
                  Prefills the league, teams, timing, and a few quick pick ideas.
                </span>
              </UButton>

              <UButton
                class="napkinbets-choice-panel"
                :class="{ 'napkinbets-choice-panel-active': selectedMode === 'manual' }"
                color="neutral"
                variant="ghost"
                @click="selectedMode = 'manual'"
              >
                <span class="napkinbets-surface-label">Custom</span>
                <span class="font-semibold text-default">
                  Drafts, watch parties, golf, or room-specific props
                </span>
                <span class="text-sm text-muted">
                  Use this when the pool should not depend on a listed game.
                </span>
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="
        actions.feedback.value.type === 'success'
          ? 'i-lucide-check-circle-2'
          : 'i-lucide-circle-alert'
      "
      :title="actions.feedback.value.type === 'success' ? 'Pool created' : 'Pool creation failed'"
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="selectedMode === 'event' && !eventPreview"
      color="warning"
      variant="soft"
      icon="i-lucide-radar"
      title="No game selected yet"
      description="Choose a game from Events first if you want the fast path."
    >
      <template #actions>
        <UButton to="/events" color="primary" variant="soft">Browse games</UButton>
      </template>
    </UAlert>

    <UAlert
      v-if="!loggedIn"
      color="warning"
      variant="soft"
      icon="i-lucide-shield-alert"
      title="Create account required to publish"
      description="You can review the setup flow now, but you need an account before Napkinbets will save the pool."
    />

    <UAlert
      v-else-if="!defaultPaymentProfile"
      color="info"
      variant="soft"
      icon="i-lucide-wallet-cards"
      title="No saved payment profile yet"
      description="You can still create a pool with a one-off handle, but a saved default makes setup and settle-up cleaner."
    >
      <template #actions>
        <UButton to="/settings/payments" color="primary" variant="soft">
          Manage payment profiles
        </UButton>
      </template>
    </UAlert>

    <NapkinbetsCreateForm
      :loading="actions.activeAction.value === 'create-wager'"
      :prefill="activePrefill"
      :mode="selectedMode"
      :event-preview="eventPreview"
      :taxonomy="taxonomy"
      :is-authenticated="loggedIn"
      @create="handleCreate"
    />
  </div>
</template>

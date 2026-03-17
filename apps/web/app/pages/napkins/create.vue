<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateWagerInput } from '../../../types/napkinbets'
import { NAPKINBETS_DEFAULT_CREATE_INPUT } from '../../composables/useNapkinbetsCreatePrefill'

const route = useRoute()
const { loggedIn, user } = useUserSession()
const { createMode, prefill, eventPreview } = useNapkinbetsCreatePrefill()
const { data: taxonomy } = await useNapkinbetsTaxonomy()
const actions = useNapkinbetsActions(async () => Promise.resolve())
const paymentProfilesState = loggedIn.value ? await useNapkinbetsPaymentProfiles() : null
const friendsStore = useNapkinbetsFriendsStore()
const groupsStore = useNapkinbetsGroupsStore()

if (loggedIn.value) {
  await callOnce(
    'napkinbets-create-social-data',
    async () => {
      await Promise.all([friendsStore.fetchBundle(), groupsStore.fetchBundle()])
    },
    { mode: 'navigation' },
  )
}

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

const attachedGameLabel = computed(() => {
  if (!eventPreview.value) {
    return 'Pick a game from Events first'
  }

  if (eventPreview.value.awayTeamName && eventPreview.value.homeTeamName) {
    return `${eventPreview.value.awayTeamName} at ${eventPreview.value.homeTeamName}`
  }

  return eventPreview.value.title
})

const quickGameStatusLabel = computed(() => {
  if (!eventPreview.value) {
    return ''
  }

  return [eventPreview.value.status || 'Scheduled', eventPreview.value.venueName]
    .filter(Boolean)
    .join(' • ')
})

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
  title: 'Start a bet',
  description:
    'Start a one-on-one or group bet from a real event or a custom room without typing everything by hand.',
  image: '/brand/og/create.webp',
})

useWebPageSchema({
  name: 'Start a bet',
  description: 'A creation workflow for building a new one-on-one or group bet on Napkinbets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <div class="space-y-3">
          <p class="napkinbets-kicker">Start</p>
          <h1 class="napkinbets-section-title">
            {{
              eventPreview && selectedMode === 'event'
                ? 'Pick one friend, pick your side, send it.'
                : 'Pick a game, pick a side, send the bet.'
            }}
          </h1>
          <p class="napkinbets-hero-lede">
            {{
              eventPreview && selectedMode === 'event'
                ? 'The game is already attached. All that is left is the friend, the side, and the stake.'
                : 'If the game exists, use the attached matchup and keep the rest to one friend, one side, and one stake.'
            }}
          </p>
        </div>

        <div
          v-if="eventPreview && selectedMode === 'event'"
          class="napkinbets-surface flex flex-wrap items-center justify-between gap-3"
        >
          <div class="min-w-0 space-y-1">
            <p class="napkinbets-surface-label">Game attached</p>
            <p class="truncate font-semibold text-default">{{ attachedGameLabel }}</p>
            <p v-if="quickGameStatusLabel" class="text-sm text-muted">{{ quickGameStatusLabel }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton to="/events" color="neutral" variant="ghost" size="sm">
              Change game
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" @click="selectedMode = 'manual'">
              Custom bet
            </UButton>
          </div>
        </div>

        <UCard v-else class="napkinbets-panel">
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
                  {{ attachedGameLabel }}
                </span>
                <span class="text-sm text-muted">This is the shortest path to a real bet.</span>
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
                  Watch parties, drafts, or off-calendar bets
                </span>
                <span class="text-sm text-muted">
                  Use this only when the bet should not depend on a listed game.
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
      :title="actions.feedback.value.type === 'success' ? 'Bet created' : 'Bet creation failed'"
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="selectedMode === 'event' && !eventPreview"
      color="warning"
      variant="soft"
      icon="i-lucide-radar"
      title="No game selected yet"
      description="Choose a game from Events first if you want the clearest path."
    >
      <template #actions>
        <UButton to="/events" color="primary" variant="soft">Browse events</UButton>
      </template>
    </UAlert>

    <UAlert
      v-if="!loggedIn"
      color="warning"
      variant="soft"
      icon="i-lucide-shield-alert"
      title="Create account required to publish"
      description="You can review the setup flow now, but you need an account before Napkinbets will save the bet."
    />

    <NapkinbetsCreateForm
      :loading="actions.activeAction.value === 'create-wager'"
      :prefill="activePrefill"
      :mode="selectedMode"
      :event-preview="eventPreview"
      :taxonomy="taxonomy"
      :friends="friendsStore.friends.value"
      :groups="groupsStore.myGroups.value"
      :initial-friend-id="typeof route.query.friendId === 'string' ? route.query.friendId : ''"
      :is-authenticated="loggedIn"
      @create="handleCreate"
    />
  </div>
</template>

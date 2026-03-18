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
  sport: '',
  league: '',
  contextKey: '',
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

const _attachedGameLabel = computed(() => {
  if (!eventPreview.value) {
    return 'Pick a game from Events first'
  }

  if (eventPreview.value.awayTeamName && eventPreview.value.homeTeamName) {
    return `${eventPreview.value.awayTeamName} at ${eventPreview.value.homeTeamName}`
  }

  return eventPreview.value.title
})

const _quickGameStatusLabel = computed(() => {
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
      <div class="space-y-3">
        <p class="napkinbets-kicker">Create</p>
        <h1 class="napkinbets-section-title">Create a Napkin</h1>
        <p class="napkinbets-hero-lede">
          Pick a game or make it up — choose your side, challenge a friend.
        </p>
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
      v-if="!loggedIn"
      color="warning"
      variant="soft"
      icon="i-lucide-shield-alert"
      title="Account required"
      description="You can preview the form, but you need an account to publish a bet."
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

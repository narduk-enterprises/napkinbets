<script setup lang="ts">
import type { CreateWagerInput } from '../../../types/napkinbets'
import NapkinbetsTemplateCard from '../../components/napkinbets/templates/NapkinbetsTemplateCard.vue'
import { NAPKINBETS_DEFAULT_CREATE_INPUT } from '../../composables/useNapkinbetsCreatePrefill'
import {
  buildNapkinbetsTemplateCreateQuery,
  getNapkinbetsFeaturedTemplates,
} from '../../utils/napkinbets-game-templates'

const route = useRoute()
const { loggedIn, user } = useUserSession()
const { createMode, prefill, eventPreview, template } = useNapkinbetsCreatePrefill()
const { data: taxonomy } = await useNapkinbetsTaxonomy()
const actions = useNapkinbetsActions(async () => Promise.resolve())
const paymentProfilesState = loggedIn.value ? await useNapkinbetsPaymentProfiles() : null
const friendsStore = useNapkinbetsFriendsStore()
const groupsStore = useNapkinbetsGroupsStore()
const featuredTemplates = getNapkinbetsFeaturedTemplates()

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

const selectedTemplate = computed(() => template.value)

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
  title: 'Create a game',
  description:
    'Pick a structured format, attach an event when useful, and publish a social game without typing the whole setup from scratch.',
  image: '/brand/og/create.webp',
})

useWebPageSchema({
  name: 'Create a game',
  description: 'A creation workflow for building a new social game or pool on Napkin Bets.',
})

function buildTemplateLink(templateKey: string) {
  return {
    path: '/napkins/create',
    query: buildNapkinbetsTemplateCreateQuery(templateKey),
  }
}
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-3">
        <p class="napkinbets-kicker">Create</p>
        <h1 class="napkinbets-section-title">
          {{ selectedTemplate?.label || 'Create a game' }}
        </h1>
        <p class="napkinbets-hero-lede">
          {{
            selectedTemplate?.summary ||
            'Pick a structured format, customize a few rules, and launch the game with a clean join path.'
          }}
        </p>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Start from a format</p>
          <h2 class="napkinbets-section-title">Use the strongest templates first.</h2>
        </div>
        <UButton to="/templates" color="neutral" variant="soft" icon="i-lucide-arrow-right">
          All templates
        </UButton>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <NapkinbetsTemplateCard
          v-for="templateCard in featuredTemplates"
          :key="templateCard.key"
          :template="templateCard"
          :to="buildTemplateLink(templateCard.key)"
          cta-label="Use this format"
        />
      </div>
    </div>

    <UAlert
      v-if="selectedTemplate?.support === 'contract-next'"
      color="warning"
      variant="soft"
      icon="i-lucide-construction"
      title="This format is contract-ready, not bespoke-yet"
      description="The product model is locked for this format, but the richer purpose-built shell is still coming. Use the structured draft below as the current best path."
    />

    <UAlert
      v-if="selectedTemplate?.eventBackedPreferred && !eventPreview"
      color="info"
      variant="soft"
      icon="i-lucide-radar"
      title="This format works best when attached to an event"
      description="You can still draft it manually, but the cleanest version starts from the Events browser so the matchup or tournament context comes with it."
    >
      <template #actions>
        <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-arrow-right">
          Browse events
        </UButton>
      </template>
    </UAlert>

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
      description="You can preview the flow, but you need an account to publish a game."
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

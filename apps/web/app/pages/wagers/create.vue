<script setup lang="ts">
import type { CreateWagerInput } from '../../../types/napkinbets'

const { loggedIn, user } = useUserSession()
const { prefill, eventPreview } = useNapkinbetsCreatePrefill()
const actions = useNapkinbetsActions(async () => Promise.resolve())
const paymentProfilesState = loggedIn.value ? await useNapkinbetsPaymentProfiles() : null

const defaultPaymentProfile = computed(
  () => paymentProfilesState?.data.value.profiles.find((profile) => profile.isDefault) ?? null,
)

const formPrefill = computed(() => ({
  ...prefill.value,
  creatorName: user.value?.name || user.value?.email || prefill.value.creatorName,
  paymentService: defaultPaymentProfile.value?.provider || prefill.value.paymentService,
  paymentHandle: defaultPaymentProfile.value?.handle || prefill.value.paymentHandle,
}))

async function handleCreate(payload: CreateWagerInput) {
  if (!loggedIn.value) {
    await navigateTo('/register')
    return
  }

  const result = await actions.createWager(payload)
  if (result?.slug) {
    await navigateTo(`/wagers/${result.slug}`)
  }
}

useSeo({
  title: 'Create a wager board',
  description:
    'Build a friendly wager board from a live or upcoming event, set the terms, and choose how the group will settle manually.',
  ogImage: {
    title: 'Create a wager board',
    description: 'Turn an event into a structured Napkinbets board.',
    icon: '🎟️',
  },
})

useWebPageSchema({
  name: 'Create a wager board',
  description:
    'A creation workflow for building a new friendly wager board on Napkinbets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="napkinbets-hero-grid">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Create</p>
          <h1 class="napkinbets-section-title">Build the board before the window moves.</h1>
          <p class="napkinbets-hero-lede">
            Keep the UX focused on the core decision path: pick the event, set the sides and pot structure, confirm the payment rail, then share the board.
          </p>
        </div>

        <UCard v-if="eventPreview" class="napkinbets-panel">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Selected event</p>
            <h2 class="napkinbets-subsection-title">
              {{ eventPreview.awayTeamName && eventPreview.homeTeamName ? `${eventPreview.awayTeamName} at ${eventPreview.homeTeamName}` : eventPreview.title }}
            </h2>
            <p class="napkinbets-support-copy">
              {{ eventPreview.status || 'Scheduled' }}{{ eventPreview.venueName ? ` • ${eventPreview.venueName}` : '' }}
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="actions.feedback.value.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-alert'"
      :title="actions.feedback.value.type === 'success' ? 'Board created' : 'Board creation failed'"
      :description="actions.feedback.value.text"
    />

    <UAlert
      v-if="!loggedIn"
      color="warning"
      variant="soft"
      icon="i-lucide-shield-alert"
      title="Create account required to publish"
      description="You can review the setup flow now, but you need an account before Napkinbets will save the board."
    />

    <UAlert
      v-else-if="!defaultPaymentProfile"
      color="info"
      variant="soft"
      icon="i-lucide-wallet-cards"
      title="No saved payment profile yet"
      description="You can still create a board with a one-off handle, but setting a default payment profile makes create and closeout flows cleaner."
    >
      <template #actions>
        <UButton to="/settings/payments" color="primary" variant="soft">
          Manage payment profiles
        </UButton>
      </template>
    </UAlert>

    <NapkinbetsCreateForm
      :loading="actions.activeAction.value === 'create-wager'"
      :prefill="formPrefill"
      :is-authenticated="loggedIn"
      @create="handleCreate"
    />
  </div>
</template>

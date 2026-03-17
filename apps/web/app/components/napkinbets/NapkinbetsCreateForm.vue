<script setup lang="ts">
import { reactive, watch } from 'vue'
import { z } from 'zod'
import type { CreateWagerInput } from '../../../types/napkinbets'

const emit = defineEmits<{
  create: [payload: CreateWagerInput]
}>()

const props = defineProps<{
  loading: boolean
  prefill: CreateWagerInput
  isAuthenticated: boolean
}>()

const formatOptions = [
  { label: 'Sports game board', value: 'sports-game' },
  { label: 'Sports prop board', value: 'sports-prop' },
  { label: 'Sports race board', value: 'sports-race' },
  { label: 'Golf draft board', value: 'golf-draft' },
  { label: 'Custom prop board', value: 'custom-prop' },
]

const paymentOptions = [
  { label: 'Venmo', value: 'Venmo' },
  { label: 'PayPal', value: 'PayPal' },
  { label: 'Cash App', value: 'Cash App' },
  { label: 'Zelle', value: 'Zelle' },
]

const schema = z.object({
  title: z.string().min(3),
  creatorName: z.string().min(2),
  description: z.string().min(12),
  format: z.string().min(2),
  sport: z.string(),
  league: z.string(),
  sideOptions: z.string().min(3),
  participantNames: z.string().min(3),
  potRules: z.string().min(3),
  entryFeeDollars: z.coerce.number().min(0),
  paymentService: z.string().min(2),
  paymentHandle: z.string(),
  venueName: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  terms: z.string().min(12),
  eventSource: z.string().optional(),
  eventId: z.string().optional(),
  eventTitle: z.string().optional(),
  eventStartsAt: z.string().optional(),
  eventStatus: z.string().optional(),
  homeTeamName: z.string().optional(),
  awayTeamName: z.string().optional(),
})

const formState = reactive<CreateWagerInput>({
  ...props.prefill,
})

watch(
  () => props.prefill,
  (prefill) => {
    Object.assign(formState, prefill)
  },
  { immediate: true },
)

function submit() {
  const parsed = schema.safeParse(formState)
  if (!parsed.success) {
    return
  }

  emit('create', parsed.data)
}
</script>

<template>
  <UCard id="napkinbets-create" class="napkinbets-panel">
    <template #header>
      <div class="space-y-2">
        <p class="napkinbets-kicker">Board setup</p>
        <h2 class="napkinbets-section-title">Create a friendly wager with a clean workflow</h2>
        <p class="napkinbets-support-copy">
          Use the event context as the starting point, then finish the operational details that usually get lost in a text thread.
        </p>
      </div>
    </template>

    <UForm :state="formState" :schema="schema" class="space-y-6" @submit.prevent="submit">
      <div class="napkinbets-form-grid">
        <UFormField name="title" label="Board title">
          <UInput v-model="formState.title" class="w-full" />
        </UFormField>

        <UFormField name="creatorName" label="Board owner">
          <UInput v-model="formState.creatorName" class="w-full" />
        </UFormField>

        <UFormField name="format" label="Board format">
          <USelect v-model="formState.format" :items="formatOptions" class="w-full" />
        </UFormField>

        <UFormField name="paymentService" label="Settlement app">
          <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
        </UFormField>

        <UFormField name="sport" label="Sport">
          <UInput v-model="formState.sport" class="w-full" />
        </UFormField>

        <UFormField name="league" label="League">
          <UInput v-model="formState.league" class="w-full" />
        </UFormField>

        <UFormField name="entryFeeDollars" label="Entry fee ($)">
          <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
        </UFormField>

        <UFormField name="paymentHandle" label="Payment handle or account">
          <UInput v-model="formState.paymentHandle" class="w-full" />
        </UFormField>

        <UFormField name="venueName" label="Venue or watch context">
          <UInput v-model="formState.venueName" class="w-full" />
        </UFormField>

        <UFormField name="latitude" label="Latitude (optional)">
          <UInput v-model="formState.latitude" class="w-full" />
        </UFormField>

        <UFormField name="longitude" label="Longitude (optional)">
          <UInput v-model="formState.longitude" class="w-full" />
        </UFormField>
      </div>

      <UFormField name="description" label="Board description">
        <UTextarea v-model="formState.description" class="w-full" :rows="3" />
      </UFormField>

      <div class="napkinbets-form-grid">
        <UFormField name="sideOptions" label="Sides or prop options">
          <UTextarea v-model="formState.sideOptions" class="w-full" :rows="5" />
        </UFormField>

        <UFormField name="participantNames" label="Participants to seed">
          <UTextarea
            v-model="formState.participantNames"
            class="w-full"
            :rows="5"
            placeholder="Avery&#10;Jules&#10;Nina"
          />
        </UFormField>
      </div>

      <div class="napkinbets-form-grid">
        <UFormField name="potRules" label="Pot split">
          <UTextarea
            v-model="formState.potRules"
            class="w-full"
            :rows="4"
            placeholder="Winner: 70&#10;Closer call: 30"
          />
        </UFormField>

        <UFormField name="terms" label="Terms and compliance copy">
          <UTextarea v-model="formState.terms" class="w-full" :rows="4" />
        </UFormField>
      </div>

      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-wallet-cards"
        title="Settlement stays manual"
        description="Napkinbets records the payment rail and proof, but no money is processed in-app."
      />

      <div class="napkinbets-form-actions">
        <UButton
          type="submit"
          size="lg"
          color="primary"
          icon="i-lucide-ticket-plus"
          :loading="loading"
        >
          {{ isAuthenticated ? 'Create wager board' : 'Create account to publish' }}
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

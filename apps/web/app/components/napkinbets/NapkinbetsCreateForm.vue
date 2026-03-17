<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { z } from 'zod'
import type { CreateWagerInput } from '../../../types/napkinbets'

interface NapkinbetsCreateEventPreview {
  source: string
  eventId: string
  title: string
  startTime: string
  status: string
  sport: string
  league: string
  venueName: string
  homeTeamName: string
  awayTeamName: string
}

const emit = defineEmits<{
  create: [payload: CreateWagerInput]
}>()

const props = defineProps<{
  loading: boolean
  prefill: CreateWagerInput
  mode: 'event' | 'manual'
  eventPreview: NapkinbetsCreateEventPreview | null
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
  participantNames: z.string().min(0),
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
const ai = useNapkinbetsAi()
const aiTermsPending = ref(false)
const aiTermsError = ref('')

watch(
  () => props.prefill,
  (prefill) => {
    Object.assign(formState, prefill)
  },
  { immediate: true },
)

const formSummary = computed(() =>
  props.mode === 'event'
    ? 'The discovery event is already attached. Finish the side market, participants, and collection rail.'
    : 'Set up a manual board for golf drafts, entertainment prompts, or any room-specific wager.',
)

async function rewriteTerms() {
  aiTermsPending.value = true
  aiTermsError.value = ''

  try {
    const result = await ai.rewriteTerms({
      title: formState.title,
      description: formState.description,
      format: formState.format,
      paymentService: formState.paymentService,
      terms: formState.terms,
    })

    if (result.terms) {
      formState.terms = result.terms
    }
  } catch (error) {
    aiTermsError.value = error instanceof Error ? error.message : 'AI terms rewrite failed.'
  } finally {
    aiTermsPending.value = false
  }
}

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
        <h2 class="napkinbets-section-title">
          {{ mode === 'event' ? 'Finish the event-backed board' : 'Set the manual board details' }}
        </h2>
        <p class="napkinbets-support-copy">
          {{ formSummary }}
        </p>
      </div>
    </template>

    <UForm :state="formState" :schema="schema" class="space-y-6" @submit.prevent="submit">
      <div v-if="mode === 'event' && eventPreview" class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div class="napkinbets-surface space-y-2">
          <p class="napkinbets-surface-label">Attached event</p>
          <p class="font-semibold text-default">
            {{ eventPreview.awayTeamName && eventPreview.homeTeamName ? `${eventPreview.awayTeamName} at ${eventPreview.homeTeamName}` : eventPreview.title }}
          </p>
          <p class="text-sm text-muted">
            {{ eventPreview.status || 'Scheduled' }} • {{ eventPreview.venueName || 'Venue pending' }}
          </p>
        </div>

        <div class="napkinbets-surface space-y-2">
          <p class="napkinbets-surface-label">Board shape</p>
          <p class="text-sm text-muted">
            Napkinbets already has the sport, league, and suggested market angle. You are mostly deciding the stake, the seat list, and the closeout rules.
          </p>
        </div>
      </div>

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

        <UFormField name="entryFeeDollars" label="Entry fee ($)">
          <UInput v-model="formState.entryFeeDollars" type="number" class="w-full" />
        </UFormField>
      </div>

      <UFormField name="description" label="Board description">
        <UTextarea v-model="formState.description" class="w-full" :rows="3" />
      </UFormField>

      <USeparator />

      <div class="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Event and context</p>
            <h3 class="napkinbets-subsection-title">What the board is attached to</h3>
          </div>

          <div class="napkinbets-form-grid">
            <UFormField name="sport" label="Sport">
              <UInput v-model="formState.sport" class="w-full" />
            </UFormField>

            <UFormField name="league" label="League">
              <UInput v-model="formState.league" class="w-full" />
            </UFormField>

            <UFormField name="venueName" label="Venue or watch context">
              <UInput v-model="formState.venueName" class="w-full" />
            </UFormField>

            <UFormField name="paymentService" label="Settlement app">
              <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
            </UFormField>

            <UFormField name="paymentHandle" label="Collection handle or account">
              <UInput v-model="formState.paymentHandle" class="w-full" />
            </UFormField>

            <UFormField name="participantNames" label="Seed participants">
              <UTextarea
                v-model="formState.participantNames"
                class="w-full"
                :rows="4"
                placeholder="Avery&#10;Jules&#10;Nina"
              />
            </UFormField>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Market and closeout</p>
            <h3 class="napkinbets-subsection-title">How the board will run</h3>
          </div>

          <UFormField name="sideOptions" label="Sides or prop options">
            <UTextarea v-model="formState.sideOptions" class="w-full" :rows="5" />
          </UFormField>

          <UFormField name="potRules" label="Pot split">
            <UTextarea
              v-model="formState.potRules"
              class="w-full"
              :rows="4"
              placeholder="Winner: 70&#10;Closer call: 30"
            />
          </UFormField>

          <UFormField name="terms" label="Terms and closeout note">
            <UTextarea v-model="formState.terms" class="w-full" :rows="4" />
          </UFormField>

          <UAlert
            v-if="aiTermsError"
            color="warning"
            variant="soft"
            icon="i-lucide-circle-alert"
            title="AI rewrite unavailable"
            :description="aiTermsError"
          />

          <div v-if="ai.enabled && isAuthenticated" class="napkinbets-card-actions">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-sparkles"
              :loading="aiTermsPending"
              @click="rewriteTerms"
            >
              Rewrite terms with Grok
            </UButton>
          </div>
        </div>
      </div>

      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-wallet-cards"
        title="Settlement stays manual"
        description="Napkinbets records the payment rail, proof, and review state, but no money is processed in-app."
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

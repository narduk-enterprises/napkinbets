<script setup lang="ts">
import { computed } from 'vue'
import { z } from 'zod'
import type { CreateWagerInput, NapkinbetsTaxonomyResponse } from '../../../types/napkinbets'

interface NapkinbetsCreateEventPreview {
  source: string
  eventId: string
  title: string
  startTime: string
  status: string
  sport: string
  contextKey: string
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
  taxonomy: NapkinbetsTaxonomyResponse
  isAuthenticated: boolean
}>()

const formatOptions = [
  { label: 'Game board', value: 'sports-game' },
  { label: 'Prop board', value: 'sports-prop' },
  { label: 'Race board', value: 'sports-race' },
  { label: 'Golf draft', value: 'golf-draft' },
  { label: 'Custom board', value: 'custom-prop' },
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
  boardType: z.enum(['event-backed', 'manual-curated', 'community-created']),
  format: z.string().min(2),
  sport: z.string(),
  contextKey: z.string(),
  league: z.string(),
  customContextName: z.string(),
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

const {
  formState,
  selectedSport,
  selectedLeague,
  sportOptions,
  contextOptions,
  leagueOptions,
  venueOptions,
  potTemplateOptions,
  seatPresetOptions,
  showCustomContextName,
  showCustomVenue,
  sideOptionList,
  participantList,
  sideTemplateOptions,
  sideOptionDraft,
  participantDraft,
  selectedPotTemplate,
  selectedVenuePreset,
  suggestedSideOptions,
  boardSummary,
  closeoutTerms,
  payload,
  addParticipant,
  removeParticipant,
  applySeatPreset,
  addSideOption,
  removeSideOption,
  applySideTemplate,
  resetSideOptions,
} = useNapkinbetsCreateBuilder({
  prefill: computed(() => props.prefill),
  mode: computed(() => props.mode),
  taxonomy: computed(() => props.taxonomy),
})

const formatLabel = computed(() => formState.format.replaceAll('-', ' '))
const potRuleChips = computed(() => payload.value.potRules.split('\n').filter(Boolean))

const formSummary = computed(() =>
  props.mode === 'event'
    ? 'Event locked. Set the market, seats, and payment rail.'
    : 'Pick the structure first, then add only what the room needs.',
)

function submit() {
  const parsed = schema.safeParse(payload.value)
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
          {{ mode === 'event' ? 'Finish the board' : 'Start a room-ready board' }}
        </h2>
        <p class="napkinbets-support-copy">{{ formSummary }}</p>
      </div>
    </template>

    <UForm :state="formState" :schema="schema" class="space-y-6" @submit.prevent="submit">
      <div
        v-if="mode === 'event' && eventPreview"
        class="napkinbets-event-preview napkinbets-surface"
      >
        <div>
          <p class="napkinbets-surface-label">Attached event</p>
          <p class="font-semibold text-default">
            {{
              eventPreview.awayTeamName && eventPreview.homeTeamName
                ? `${eventPreview.awayTeamName} at ${eventPreview.homeTeamName}`
                : eventPreview.title
            }}
          </p>
          <p class="text-sm text-muted">
            {{ eventPreview.status || 'Scheduled' }} •
            {{ eventPreview.venueName || 'Venue pending' }}
          </p>
        </div>

        <div class="napkinbets-chip-grid">
          <span class="napkinbets-choice-chip">{{ selectedSport?.label || 'Attached sport' }}</span>
          <span class="napkinbets-choice-chip">{{ selectedLeague?.label || 'Attached league' }}</span>
          <span class="napkinbets-choice-chip">{{ formatLabel }}</span>
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

      <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Context</p>
            <h3 class="napkinbets-subsection-title">What this board belongs to</h3>
          </div>

          <div class="napkinbets-form-grid">
            <template v-if="mode === 'event'">
              <div class="napkinbets-surface space-y-2">
                <p class="napkinbets-surface-label">Sport</p>
                <p class="font-semibold text-default">{{ selectedSport?.label }}</p>
              </div>

              <div class="napkinbets-surface space-y-2">
                <p class="napkinbets-surface-label">League</p>
                <p class="font-semibold text-default">{{ selectedLeague?.label }}</p>
              </div>
            </template>

            <template v-else>
              <UFormField name="sport" label="Sport">
                <USelect v-model="formState.sport" :items="sportOptions" class="w-full" />
              </UFormField>

              <UFormField name="contextKey" label="Context">
                <USelect
                  v-model="formState.contextKey"
                  :items="contextOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField v-if="leagueOptions.length" name="league" label="League">
                <USelect
                  v-model="formState.league"
                  :items="leagueOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                v-if="showCustomContextName"
                name="customContextName"
                label="Meet, circuit, or room label"
              >
                <UInput
                  v-model="formState.customContextName"
                  class="w-full"
                  placeholder="District 4B meet"
                />
              </UFormField>
            </template>

            <UFormField v-if="mode === 'manual'" name="venuePreset" label="Watch context">
              <USelect v-model="selectedVenuePreset" :items="venueOptions" class="w-full" />
            </UFormField>

            <UFormField
              v-if="showCustomVenue || mode === 'event'"
              name="venueName"
              :label="mode === 'event' ? 'Venue' : 'Custom venue or room'"
            >
              <UInput v-model="formState.venueName" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Market</p>
            <h3 class="napkinbets-subsection-title">Sides and seats without the text wall</h3>
          </div>

          <div class="napkinbets-surface space-y-3">
            <div class="flex items-center justify-between gap-3">
              <p class="napkinbets-surface-label">Board options</p>
              <UButton
                v-if="suggestedSideOptions.length"
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-rotate-ccw"
                @click="resetSideOptions"
              >
                Reset suggestions
              </UButton>
            </div>

            <div v-if="sideTemplateOptions.length" class="space-y-2">
              <p class="napkinbets-surface-label">Quick patterns</p>
              <div class="napkinbets-chip-grid">
                <UButton
                  v-for="template in sideTemplateOptions"
                  :key="template.value"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="applySideTemplate(template.value)"
                >
                  {{ template.label }}
                </UButton>
              </div>
            </div>

            <div class="napkinbets-chip-grid">
              <span v-for="option in sideOptionList" :key="option" class="napkinbets-choice-chip">
                {{ option }}
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-x"
                  @click="removeSideOption(option)"
                />
              </span>
            </div>

            <div class="napkinbets-inline-form">
              <UInput
                v-model="sideOptionDraft"
                class="w-full"
                placeholder="Add one more side or prop"
                @keydown.enter.prevent="addSideOption"
              />
              <UButton color="neutral" variant="soft" icon="i-lucide-plus" @click="addSideOption">
                Add
              </UButton>
            </div>
          </div>

          <div class="napkinbets-surface space-y-3">
            <div class="space-y-2">
              <p class="napkinbets-surface-label">Seed participants</p>
              <div class="napkinbets-chip-grid">
                <UButton
                  v-for="preset in seatPresetOptions"
                  :key="preset.value"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="applySeatPreset(preset.value)"
                >
                  {{ preset.label }}
                </UButton>
              </div>
            </div>

            <div class="napkinbets-chip-grid">
              <span v-for="participant in participantList" :key="participant" class="napkinbets-choice-chip">
                {{ participant }}
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-x"
                  @click="removeParticipant(participant)"
                />
              </span>
            </div>

            <div class="napkinbets-inline-form">
              <UInput
                v-model="participantDraft"
                class="w-full"
                placeholder="Add a participant"
                @keydown.enter.prevent="addParticipant"
              />
              <UButton
                color="neutral"
                variant="soft"
                icon="i-lucide-user-plus"
                @click="addParticipant"
              >
                Add
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Collection</p>
            <h3 class="napkinbets-subsection-title">Payment rail and pot shape</h3>
          </div>

          <div class="napkinbets-form-grid">
            <UFormField name="paymentService" label="Settlement app">
              <USelect v-model="formState.paymentService" :items="paymentOptions" class="w-full" />
            </UFormField>

            <UFormField name="paymentHandle" label="Collection handle">
              <UInput v-model="formState.paymentHandle" class="w-full" />
            </UFormField>

            <UFormField name="potTemplate" label="Pot split">
              <USelect v-model="selectedPotTemplate" :items="potTemplateOptions" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Generated board note</p>
            <h3 class="napkinbets-subsection-title">Clear by default</h3>
          </div>

          <div class="napkinbets-surface space-y-3">
            <div class="space-y-2">
              <p class="napkinbets-surface-label">Board summary</p>
              <p class="napkinbets-support-copy">{{ boardSummary }}</p>
            </div>

            <div class="space-y-2">
              <p class="napkinbets-surface-label">Pot rules</p>
              <div class="napkinbets-chip-grid">
                <span v-for="rule in potRuleChips" :key="rule" class="napkinbets-choice-chip">
                  {{ rule }}
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <p class="napkinbets-surface-label">Closeout note</p>
              <p class="napkinbets-support-copy">{{ closeoutTerms }}</p>
            </div>
          </div>
        </div>
      </div>

      <UAlert
        color="warning"
        variant="soft"
        icon="i-lucide-wallet-cards"
        title="Settlement stays manual"
        description="Napkinbets tracks the rail and proof, but money still moves outside the app."
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

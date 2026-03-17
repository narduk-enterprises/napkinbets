<script setup lang="ts">
import { reactive, watch } from 'vue'
import type {
  JoinWagerInput,
  NapkinbetsWager,
  WagerPickInput,
  WagerSettlementInput,
} from '../../../types/napkinbets'

const props = defineProps<{
  wager: NapkinbetsWager
  activeAction: string | null
  canManage: boolean
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  join: [wagerId: string, payload: JoinWagerInput]
  addPick: [wagerId: string, payload: WagerPickInput]
  recordSettlement: [wagerId: string, payload: WagerSettlementInput]
  confirmSettlement: [wagerId: string, settlementId: string]
  rejectSettlement: [wagerId: string, settlementId: string]
  shuffle: [wagerId: string]
  remind: [wagerId: string]
  clear: [wagerId: string]
}>()

const { buildLinks, buildPaymentNote } = useNapkinbetsPaymentLinks()

const joinState = reactive<JoinWagerInput>({
  displayName: '',
  sideLabel: '',
})

const pickState = reactive<WagerPickInput>({
  participantName: '',
  pickLabel: '',
  pickType: 'custom',
  pickValue: '',
  confidence: 3,
})

const settlementState = reactive<WagerSettlementInput>({
  participantId: '',
  participantName: '',
  amountDollars: 0,
  method: '',
  handle: '',
  confirmationCode: '',
  note: '',
})

watch(
  () => props.wager,
  (wager) => {
    joinState.displayName = ''
    joinState.sideLabel = wager.sideOptions[0] ?? ''
    pickState.participantName = wager.participants[0]?.displayName ?? ''
    settlementState.participantId = wager.participants[0]?.id ?? ''
    settlementState.participantName = wager.participants[0]?.displayName ?? ''
    settlementState.amountDollars = wager.entryFeeCents / 100
    settlementState.method = wager.paymentService
    settlementState.handle = wager.paymentHandle
  },
  { immediate: true },
)

const participantOptions = computed(() =>
  props.wager.participants.map((participant) => ({
    label: participant.displayName,
    value: participant.id,
  })),
)

const participantNames = computed(
  () => new Map(props.wager.participants.map((participant) => [participant.id, participant.displayName])),
)

const selectedSettlementParticipant = computed(
  () => props.wager.participants.find((participant) => participant.id === settlementState.participantId) ?? null,
)

const paymentNote = computed(() =>
  buildPaymentNote(
    props.wager.slug,
    selectedSettlementParticipant.value?.displayName || 'participant',
    settlementState.amountDollars,
  ),
)

const paymentLinks = computed(() =>
  buildLinks(
    props.wager.paymentService,
    props.wager.paymentHandle,
    settlementState.amountDollars,
    paymentNote.value,
  ),
)

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function statusColor(status: string) {
  switch (status) {
    case 'live':
      return 'success'
    case 'open':
      return 'info'
    case 'settling':
      return 'warning'
    default:
      return 'neutral'
  }
}

function isBusy(key: string) {
  return props.activeAction === key
}

function settlementBadgeColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'warning'
  }
}

function submitJoin() {
  if (!joinState.displayName.trim()) {
    return
  }

  emit('join', props.wager.id, {
    displayName: joinState.displayName.trim(),
    sideLabel: joinState.sideLabel.trim(),
  })
}

function submitPick() {
  if (!pickState.participantName.trim() || !pickState.pickLabel.trim()) {
    return
  }

  emit('addPick', props.wager.id, {
    participantName: pickState.participantName.trim(),
    pickLabel: pickState.pickLabel.trim(),
    pickType: pickState.pickType.trim(),
    pickValue: pickState.pickValue.trim(),
    confidence: pickState.confidence,
  })
}

function submitSettlement() {
  if (!settlementState.participantName.trim()) {
    return
  }

  emit('recordSettlement', props.wager.id, {
    participantId: settlementState.participantId,
    participantName: selectedSettlementParticipant.value?.displayName || settlementState.participantName.trim(),
    amountDollars: settlementState.amountDollars,
    method: settlementState.method.trim(),
    handle: settlementState.handle.trim(),
    confirmationCode: settlementState.confirmationCode.trim(),
    note: settlementState.note.trim(),
  })
}
</script>

<template>
  <UCard class="napkinbets-panel napkinbets-wager-card">
    <template #header>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge :color="statusColor(wager.status)" variant="soft">
              {{ wager.status }}
            </UBadge>
            <UBadge color="neutral" variant="subtle">
              {{ wager.format }}
            </UBadge>
            <UBadge v-if="wager.league" color="info" variant="soft">
              {{ wager.league.toUpperCase() }}
            </UBadge>
          </div>

          <div class="space-y-2">
            <h2 class="napkinbets-section-title">{{ wager.title }}</h2>
            <p class="napkinbets-support-copy">
              {{ wager.description }}
            </p>
            <div class="napkinbets-meta-row">
              <span>{{ wager.eventTitle || 'Custom board' }}</span>
              <span>{{ wager.venueName || 'Remote group' }}</span>
              <span>Owner: {{ wager.creatorName }}</span>
            </div>
          </div>
        </div>

        <div v-if="canManage" class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-shuffle"
            :loading="isBusy(`shuffle:${wager.id}`)"
            @click="emit('shuffle', wager.id)"
          >
            Reroll order
          </UButton>
          <UButton
            color="info"
            variant="soft"
            icon="i-lucide-bell-ring"
            :loading="isBusy(`reminder:${wager.id}`)"
            @click="emit('remind', wager.id)"
          >
            Queue reminder
          </UButton>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            :loading="isBusy(`clear:${wager.id}`)"
            @click="emit('clear', wager.id)"
          >
            Clear
          </UButton>
        </div>
      </div>
    </template>

    <div class="napkinbets-card-grid">
      <div class="space-y-6">
        <div class="napkinbets-summary-grid">
          <div class="napkinbets-surface">
            <p class="napkinbets-surface-label">Stake</p>
            <p class="napkinbets-surface-value">{{ formatCurrency(wager.entryFeeCents) }}</p>
            <p class="napkinbets-support-copy">
              {{ wager.paymentService }}{{ wager.paymentHandle ? ` • ${wager.paymentHandle}` : '' }}
            </p>
          </div>

          <div class="napkinbets-surface">
            <p class="napkinbets-surface-label">Total pot</p>
            <p class="napkinbets-surface-value">{{ formatCurrency(wager.totalPotCents) }}</p>
            <p class="napkinbets-support-copy">
              {{ wager.pots.length }} side pots tracked
            </p>
          </div>

          <div class="napkinbets-surface">
            <p class="napkinbets-surface-label">Board state</p>
            <p class="napkinbets-surface-value">{{ wager.participants.length }} seats</p>
            <p class="napkinbets-support-copy">
              {{ wager.notifications.length }} recent reminders
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="napkinbets-subsection-title">Pot breakdown</h3>
          <div class="napkinbets-chip-grid">
            <div
              v-for="pot in wager.pots"
              :key="pot.id"
              class="napkinbets-chip-card"
            >
              <span class="font-semibold text-default">{{ pot.label }}</span>
              <span class="text-sm text-muted">{{ formatCurrency(pot.amountCents) }}</span>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="napkinbets-two-column">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Draft order</h3>
            <div class="space-y-2">
              <div
                v-for="participant in wager.participants"
                :key="participant.id"
                class="napkinbets-list-row"
              >
                <div class="flex items-center gap-3">
                  <span class="napkinbets-order-pill">#{{ participant.draftOrder ?? '—' }}</span>
                  <div>
                    <p class="font-semibold text-default">{{ participant.displayName }}</p>
                    <p class="text-sm text-muted">
                      {{ participant.sideLabel || 'Open side' }}
                    </p>
                  </div>
                </div>
                <UBadge
                  :color="participant.paymentStatus === 'confirmed' ? 'success' : 'warning'"
                  variant="soft"
                >
                  {{ participant.paymentStatus }}
                </UBadge>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Leaderboard</h3>
            <div class="space-y-2">
              <div
                v-for="row in wager.leaderboard"
                :key="row.participantId"
                class="napkinbets-list-row"
              >
                <div>
                  <p class="font-semibold text-default">{{ row.displayName }}</p>
                  <p class="text-sm text-muted">
                    {{ row.sideLabel }} • {{ row.pickCount }} picks
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-default">{{ row.score }} pts</p>
                  <p class="text-sm text-muted">
                    {{ formatCurrency(row.projectedPayoutCents) }} projected
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <USeparator />

        <div class="napkinbets-two-column">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Picks</h3>
            <div class="space-y-2">
              <div v-for="pick in wager.picks" :key="pick.id" class="napkinbets-list-row">
                <div>
                  <p class="font-semibold text-default">{{ pick.pickLabel }}</p>
                  <p class="text-sm text-muted">
                    {{ pick.pickType }}{{ pick.pickValue ? ` • ${pick.pickValue}` : '' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-default">{{ pick.liveScore }} live</p>
                  <p class="text-sm text-muted">{{ pick.outcome }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Notifications</h3>
            <div class="space-y-2">
              <div
                v-for="notification in wager.notifications"
                :key="notification.id"
                class="napkinbets-note-row"
              >
                <div>
                  <p class="font-semibold text-default">{{ notification.title }}</p>
                  <p class="text-sm text-muted">
                    {{ notification.body }}
                  </p>
                </div>
                <UBadge color="neutral" variant="subtle">
                  {{ notification.deliveryStatus }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <USeparator />

        <div v-if="isAuthenticated" class="napkinbets-form-section">
          <div class="space-y-4">
            <h3 class="napkinbets-subsection-title">Join the board</h3>
            <div class="napkinbets-chip-grid">
              <span
                v-for="option in wager.sideOptions"
                :key="option"
                class="napkinbets-choice-chip"
              >
                {{ option }}
              </span>
            </div>
            <UForm :state="joinState" class="space-y-3" @submit.prevent="submitJoin">
              <UFormField name="displayName" label="Participant name">
                <UInput v-model="joinState.displayName" class="w-full" />
              </UFormField>
              <UFormField name="sideLabel" label="Chosen side">
                <UInput v-model="joinState.sideLabel" class="w-full" />
              </UFormField>
              <UButton
                type="submit"
                color="primary"
                icon="i-lucide-user-plus"
                :loading="isBusy(`join:${wager.id}`)"
              >
                Confirm seat
              </UButton>
            </UForm>
          </div>

          <div class="space-y-4">
            <h3 class="napkinbets-subsection-title">Log a pick</h3>
            <UForm :state="pickState" class="space-y-3" @submit.prevent="submitPick">
              <UFormField name="participantName" label="Participant">
                <UInput v-model="pickState.participantName" class="w-full" />
              </UFormField>
              <UFormField name="pickLabel" label="Pick label">
                <UInput v-model="pickState.pickLabel" class="w-full" />
              </UFormField>
              <UFormField name="pickValue" label="Pick detail">
                <UInput v-model="pickState.pickValue" class="w-full" />
              </UFormField>
              <UFormField name="confidence" label="Confidence">
                <UInput v-model="pickState.confidence" type="number" class="w-full" />
              </UFormField>
              <UButton
                type="submit"
                color="neutral"
                variant="soft"
                icon="i-lucide-pencil-line"
                :loading="isBusy(`pick:${wager.id}`)"
              >
                Save pick
              </UButton>
            </UForm>
          </div>

          <div class="space-y-4">
            <h3 class="napkinbets-subsection-title">Confirm settlement</h3>
            <UForm :state="settlementState" class="space-y-3" @submit.prevent="submitSettlement">
              <UFormField name="participantId" label="Participant">
                <USelect v-model="settlementState.participantId" :items="participantOptions" class="w-full" />
              </UFormField>
              <UFormField name="amountDollars" label="Amount ($)">
                <UInput v-model="settlementState.amountDollars" type="number" class="w-full" />
              </UFormField>
              <UFormField name="confirmationCode" label="Confirmation code">
                <UInput v-model="settlementState.confirmationCode" class="w-full" />
              </UFormField>
              <UFormField name="note" label="Note">
                <UTextarea v-model="settlementState.note" class="w-full" :rows="3" />
              </UFormField>
              <UButton
                type="submit"
                color="info"
                variant="soft"
                icon="i-lucide-wallet-cards"
                :loading="isBusy(`settlement:${wager.id}`)"
              >
                Save settlement
              </UButton>
            </UForm>
          </div>
        </div>

        <UAlert
          v-else
          color="warning"
          variant="soft"
          icon="i-lucide-log-in"
          title="Sign in to join, pick, or settle"
          description="Board detail is shareable, but participant actions and settlement proof require an account."
        >
          <template #actions>
            <div class="napkinbets-card-actions">
              <UButton to="/login" color="neutral" variant="soft">Sign in</UButton>
              <UButton to="/register" color="primary">Create account</UButton>
            </div>
          </template>
        </UAlert>
      </div>

      <div class="space-y-6">
        <div class="napkinbets-surface space-y-3">
          <h3 class="napkinbets-subsection-title">Payment pack</h3>
          <div class="space-y-2">
            <div class="napkinbets-list-row">
              <div>
                <p class="font-semibold text-default">Collector</p>
                <p class="text-sm text-muted">{{ wager.paymentService }}{{ wager.paymentHandle ? ` • ${wager.paymentHandle}` : '' }}</p>
              </div>
              <p class="font-semibold text-default">{{ formatCurrency(Math.round(settlementState.amountDollars * 100)) }}</p>
            </div>
            <div class="napkinbets-note-row">
              <div>
                <p class="font-semibold text-default">Suggested note</p>
                <p class="text-sm text-muted">{{ paymentNote }}</p>
              </div>
            </div>
          </div>

          <div class="napkinbets-card-actions">
            <UButton
              v-for="link in paymentLinks"
              :key="link.href"
              :to="link.href"
              color="primary"
              variant="soft"
              target="_blank"
              icon="i-lucide-external-link"
            >
              {{ link.label }}
            </UButton>
          </div>

          <p class="napkinbets-support-copy">
            Some providers only support partial prefill. Napkinbets always shows the handle, amount, and note together so the last mile can be copied cleanly.
          </p>
        </div>

        <div class="napkinbets-surface space-y-3">
          <h3 class="napkinbets-subsection-title">Context feed</h3>

          <div v-if="wager.liveGames.length" class="space-y-3">
            <div
              v-for="game in wager.liveGames.slice(0, 3)"
              :key="game.id"
              class="napkinbets-live-game"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-default">{{ game.shortName }}</p>
                  <p class="text-sm text-muted">{{ game.status }}</p>
                </div>
                <UBadge color="primary" variant="soft">
                  {{ game.league.toUpperCase() }}
                </UBadge>
              </div>
            </div>
          </div>

          <div v-if="wager.weather" class="napkinbets-weather-card">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-semibold text-default">{{ wager.weather.location }}</p>
                <p class="text-sm text-muted">{{ wager.weather.conditions }}</p>
              </div>
              <p class="text-2xl font-display text-default">{{ wager.weather.temperatureF }}°</p>
            </div>
          </div>
        </div>

        <div class="napkinbets-surface space-y-3">
          <h3 class="napkinbets-subsection-title">Manual settlement ledger</h3>
          <div class="space-y-2">
            <div
              v-for="settlement in wager.settlements"
              :key="settlement.id"
              class="napkinbets-list-row"
            >
              <div>
                <p class="font-semibold text-default">
                  {{ participantNames.get(settlement.participantId) || settlement.method }}
                </p>
                <p class="text-sm text-muted">
                  {{ settlement.method }} • {{ settlement.confirmationCode || settlement.handle || 'Manual confirmation pending' }}
                </p>
                <p v-if="settlement.rejectionNote" class="text-sm text-muted">
                  {{ settlement.rejectionNote }}
                </p>
              </div>
              <div class="text-right space-y-2">
                <UBadge :color="settlementBadgeColor(settlement.verificationStatus)" variant="soft">
                  {{ settlement.verificationStatus }}
                </UBadge>
                <p class="font-semibold text-default">{{ formatCurrency(settlement.amountCents) }}</p>
                <UButton
                  v-if="canManage && settlement.verificationStatus !== 'confirmed'"
                  color="success"
                  variant="soft"
                  size="sm"
                  :loading="isBusy(`settlement-confirm:${settlement.id}`)"
                  @click="emit('confirmSettlement', wager.id, settlement.id)"
                >
                  Confirm
                </UButton>
                <UButton
                  v-if="canManage && settlement.verificationStatus !== 'confirmed'"
                  color="error"
                  variant="soft"
                  size="sm"
                  :loading="isBusy(`settlement-reject:${settlement.id}`)"
                  @click="emit('rejectSettlement', wager.id, settlement.id)"
                >
                  Send back
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-badge-alert"
          title="Compliance rail"
          :description="wager.terms"
        />
      </div>
    </div>
  </UCard>
</template>

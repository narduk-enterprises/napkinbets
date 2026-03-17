<script setup lang="ts">
import type { NapkinbetsWager } from '../../../types/napkinbets'

const props = defineProps<{
  wager: NapkinbetsWager
  role?: 'owner' | 'player' | 'invited'
}>()

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function statusBadgeColor(status: string) {
  switch (status) {
    case 'live':
      return 'success'
    case 'locked':
      return 'primary'
    case 'open':
      return 'info'
    default:
      return 'neutral'
  }
}

const roleBadge = computed(() => {
  switch (props.role) {
    case 'owner':
      return { label: 'Host', color: 'primary' as const }
    case 'invited':
      return { label: 'Invited', color: 'warning' as const }
    default:
      return { label: 'Joined', color: 'neutral' as const }
  }
})

const meta = computed(() =>
  [props.wager.eventTitle || 'Custom bet', props.wager.groupName, props.wager.venueName || 'Remote']
    .filter(Boolean)
    .join(' · '),
)

const hasLogos = computed(
  () => Boolean(props.wager.homeTeamLogo) || Boolean(props.wager.awayTeamLogo),
)

const shortName = computed(() => {
  const away = props.wager.awayTeamName
  const home = props.wager.homeTeamName
  if (!away && !home) return ''
  return `${away} @ ${home}`
})
</script>

<template>
  <NuxtLink
    :to="`/napkins/${wager.slug}`"
    class="napkinbets-compact-card group"
  >
    <!-- Badges -->
    <div class="napkinbets-compact-badges">
      <UBadge :color="statusBadgeColor(wager.status)" variant="soft" size="xs">
        {{ wager.status }}
      </UBadge>
      <UBadge :color="roleBadge.color" variant="subtle" size="xs">
        {{ roleBadge.label }}
      </UBadge>
      <UBadge v-if="wager.league" color="warning" variant="soft" size="xs">
        {{ wager.league.toUpperCase() }}
      </UBadge>
    </div>

    <!-- Team logos + title -->
    <div class="napkinbets-compact-main">
      <div v-if="hasLogos" class="napkinbets-compact-logos">
        <img
          v-if="wager.awayTeamLogo"
          :src="wager.awayTeamLogo"
          :alt="wager.awayTeamName"
          class="napkinbets-compact-logo-img"
        />
        <img
          v-if="wager.homeTeamLogo"
          :src="wager.homeTeamLogo"
          :alt="wager.homeTeamName"
          class="napkinbets-compact-logo-img"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-default">{{ wager.title }}</p>
        <p class="truncate text-xs text-muted">
          <template v-if="shortName">{{ shortName }} · </template>{{ meta }}
        </p>
      </div>
    </div>

    <!-- Stake + chevron -->
    <div class="napkinbets-compact-right">
      <div class="text-right">
        <p class="text-sm font-semibold text-default">{{ formatCurrency(wager.entryFeeCents) }}</p>
        <p class="text-xs text-dimmed">
          {{ wager.participants.length }} player{{ wager.participants.length === 1 ? '' : 's' }}
        </p>
      </div>
      <UIcon
        name="i-lucide-chevron-right"
        class="size-4 text-dimmed transition-fast group-hover:text-default"
      />
    </div>
  </NuxtLink>
</template>

<style scoped>
.napkinbets-compact-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-card, 0.75rem);
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
  transition: var(--transition-fast, 150ms) ease;
}

.napkinbets-compact-card:hover {
  border-color: var(--ui-border-hover, var(--ui-border));
  box-shadow: var(--shadow-card);
}

.napkinbets-compact-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

.napkinbets-compact-main {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.napkinbets-compact-logos {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.napkinbets-compact-logo-img {
  width: 1.25rem;
  height: 1.25rem;
  object-fit: contain;
  flex-shrink: 0;
}

.napkinbets-compact-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Stack on narrow viewports */
@media (max-width: 639px) {
  .napkinbets-compact-card {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  .napkinbets-compact-badges {
    grid-column: 1 / -1;
  }

  .napkinbets-compact-main {
    grid-column: 1;
  }

  .napkinbets-compact-right {
    grid-column: 2;
    grid-row: 2;
  }
}
</style>

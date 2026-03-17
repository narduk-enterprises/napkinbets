<script setup lang="ts">
import { computed } from 'vue'
import type { NapkinbetsCreatePrefillQuery, NapkinbetsDiscoverySpotlight } from '../../../types/napkinbets'

const props = defineProps<{
  spotlight: NapkinbetsDiscoverySpotlight
}>()

function buildCreateLink(prefill: NapkinbetsCreatePrefillQuery) {
  return {
    path: '/wagers/create',
    query: {
      createMode: 'event',
      source: prefill.source,
      eventId: prefill.eventId,
      eventTitle: prefill.eventTitle,
      eventStartsAt: prefill.eventStartsAt,
      eventStatus: prefill.eventStatus,
      sport: prefill.sport,
      contextKey: prefill.contextKey,
      league: prefill.league,
      venueName: prefill.venueName,
      homeTeamName: prefill.homeTeamName,
      awayTeamName: prefill.awayTeamName,
      format: prefill.format,
      sideOptions: prefill.sideOptions.join('\n'),
    },
  }
}

const assetList = computed(() => props.spotlight.assets.slice(0, 3))
const editorialAsset = computed(
  () => assetList.value.find((asset) => asset.kind === 'editorial') ?? null,
)
const badgeAssets = computed(() => assetList.value.filter((asset) => asset.kind !== 'editorial'))
const cardClass = computed(() => [
  'napkinbets-panel',
  'napkinbets-spotlight-card',
  `napkinbets-spotlight-card-${props.spotlight.accent}`,
])
const createLink = computed(() => buildCreateLink(props.spotlight.prefill))
</script>

<template>
  <UCard :class="cardClass">
    <div class="napkinbets-spotlight-topline">
      <UBadge color="warning" variant="soft">{{ spotlight.label }}</UBadge>
      <span class="napkinbets-spotlight-window">{{ spotlight.windowLabel }}</span>
    </div>

    <div class="space-y-3">
      <div class="napkinbets-spotlight-media">
        <img
          v-if="editorialAsset"
          :src="editorialAsset.src"
          :alt="editorialAsset.alt"
          class="napkinbets-spotlight-media-image"
        />
        <div v-else class="napkinbets-spotlight-media-fallback" aria-hidden="true" />
        <div class="napkinbets-spotlight-media-wash" aria-hidden="true" />

        <div v-if="badgeAssets.length" class="napkinbets-spotlight-assets napkinbets-spotlight-assets-overlay">
        <span
          v-for="asset in badgeAssets"
          :key="`${asset.kind}-${asset.src}`"
          class="napkinbets-spotlight-asset"
        >
          <img :src="asset.src" :alt="asset.alt" class="napkinbets-spotlight-asset-image" />
        </span>
        </div>
      </div>

      <div class="space-y-1">
        <h3 class="napkinbets-spotlight-title">{{ spotlight.title }}</h3>
        <p class="napkinbets-spotlight-summary">{{ spotlight.subtitle || spotlight.summary }}</p>
      </div>

      <div class="napkinbets-spotlight-meta">
        <span>{{ spotlight.venueLabel }}</span>
        <span>{{ spotlight.prefill.league.toUpperCase() }}</span>
      </div>
    </div>

    <div class="napkinbets-card-actions">
      <UButton :to="createLink" color="primary" size="sm" icon="i-lucide-ticket-plus">
        Build board
      </UButton>
      <UButton to="/discover" color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-right">
        Slate
      </UButton>
    </div>
  </UCard>
</template>

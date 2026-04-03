<script setup lang="ts">
import type { NapkinbetsDiscoverySpotlight } from '../../../types/napkinbets'
import { buildNapkinbetsCreateLink } from '../../utils/napkinbets-create'

const props = defineProps<{
  spotlight: NapkinbetsDiscoverySpotlight
}>()

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
const createLink = computed(() => buildNapkinbetsCreateLink(props.spotlight.prefill))
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

        <div
          v-if="badgeAssets.length"
          class="napkinbets-spotlight-assets napkinbets-spotlight-assets-overlay"
        >
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
        Start game
      </UButton>
      <UButton to="/events" color="neutral" size="sm" icon="i-lucide-arrow-right">
        Browse events
      </UButton>
    </div>
  </UCard>
</template>

<!--
  OG Image Default Template — Napkinbets branded.

  Matches the app's warm cream paper palette with green accents.
  Manrope for all text (the brand sans-serif).
  Emoji icons rendered at 64px for social media visibility.

  Nuxt OG Image v6 resolves renderers by filename suffix (.takumi.vue).
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    tag?: string

    tagColor?: string
    siteName?: string
    meta?: string
    homeLogo?: string
    awayLogo?: string
    homeLabel?: string
    awayLabel?: string
  }>(),
  {
    title: 'Napkinbets',
    description: 'Pick a game. Start a bet. Settle after the final.',
    icon: '🎯',
    tag: '',
    // eslint-disable-next-line narduk/no-inline-hex -- OG brand color default
    tagColor: '#166534',
    siteName: 'napkinbets',
    meta: '',
    homeLogo: '',
    awayLogo: '',
    homeLabel: '',
    awayLabel: '',
  },
)
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      // eslint-disable-next-line narduk/no-inline-hex -- OG warm cream background
      background: '#fff8ef',
    }"
  >
    <!-- Left green accent strip -->
    <div
      :style="{
        width: '8px',
        flexShrink: '0',
        // eslint-disable-next-line narduk/no-inline-hex -- OG green sidebar
        background: 'linear-gradient(180deg, #166534 0%, #22c55e 50%, #166534 100%)',
      }"
    />

    <!-- Main content area -->
    <div
      :style="{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 72px',
        position: 'relative',
      }"
    >
      <!-- Subtle warm gradient overlay in top-right -->
      <div
        :style="{
          position: 'absolute',
          top: '-80px',
          right: '-60px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          // eslint-disable-next-line narduk/no-inline-hex -- OG warm glow
          background: 'radial-gradient(circle, #fde8c840 0%, transparent 70%)',
        }"
      />

      <!-- Bottom-left green glow -->
      <div
        :style="{
          position: 'absolute',
          bottom: '-100px',
          left: '-40px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          // eslint-disable-next-line narduk/no-inline-hex -- OG green glow
          background: 'radial-gradient(circle, #16653410 0%, transparent 65%)',
        }"
      />

      <!-- Tag badge -->
      <div
        v-if="tag"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }"
      >
        <div
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: `${tagColor}12`,
            border: `1.5px solid ${tagColor}30`,
          }"
        >
          <div
            :style="{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: tagColor,
            }"
          />
          <span
            :style="{
              fontSize: '14px',
              fontWeight: '400',
              fontFamily: 'Inter, sans-serif',
              color: tagColor,
              letterSpacing: '0.07em',
              textTransform: 'uppercase' as const,
            }"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Matchup row (events with team logos) -->
      <div
        v-if="homeLogo || awayLogo"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          marginBottom: '18px',
        }"
      >
        <div v-if="homeLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
          <img
            :src="homeLogo"
            :style="{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              borderRadius: '8px',
            }"
          />
          <span
            v-if="homeLabel"
            :style="{
              fontSize: '22px',
              fontWeight: '400',
              fontFamily: 'Inter, sans-serif',
              // eslint-disable-next-line narduk/no-inline-hex -- OG team name
              color: '#0f1a24',
            }"
          >
            {{ homeLabel }}
          </span>
        </div>
        <span
          :style="{
            fontSize: '17px',
            fontWeight: '400',
            fontFamily: 'Inter, sans-serif',
            // eslint-disable-next-line narduk/no-inline-hex -- OG vs separator
            color: '#94a3b8',
          }"
        >
          vs
        </span>
        <div v-if="awayLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
          <img
            :src="awayLogo"
            :style="{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              borderRadius: '8px',
            }"
          />
          <span
            v-if="awayLabel"
            :style="{
              fontSize: '22px',
              fontWeight: '400',
              fontFamily: 'Inter, sans-serif',
              // eslint-disable-next-line narduk/no-inline-hex -- OG team name
              color: '#0f1a24',
            }"
          >
            {{ awayLabel }}
          </span>
        </div>
      </div>

      <!-- Icon emoji (large, visible at social card sizes) -->
      <div
        v-else-if="icon"
        :style="{
          fontSize: '64px',
          lineHeight: '1',
          marginBottom: '16px',
        }"
      >
        {{ icon }}
      </div>

      <!-- Title -->
      <div
        :style="{
          fontSize: '56px',
          fontWeight: '400',
          fontFamily: 'Inter, sans-serif',
          // eslint-disable-next-line narduk/no-inline-hex -- OG title ink color
          color: '#0f1a24',
          lineHeight: '1.15',
          marginBottom: '14px',
          maxWidth: '920px',
          letterSpacing: '-0.02em',
        }"
      >
        {{ title }}
      </div>

      <!-- Description -->
      <div
        :style="{
          fontSize: '21px',
          fontWeight: '400',
          fontFamily: 'Inter, sans-serif',
          // eslint-disable-next-line narduk/no-inline-hex -- OG description text
          color: '#475569',
          lineHeight: '1.5',
          maxWidth: '800px',
        }"
      >
        {{ description }}
      </div>

      <!-- Meta line -->
      <div
        v-if="meta"
        :style="{
          marginTop: '14px',
          fontSize: '16px',
          fontWeight: '400',
          fontFamily: 'Inter, sans-serif',
          // eslint-disable-next-line narduk/no-inline-hex -- OG green meta text
          color: '#166534',
          letterSpacing: '0.01em',
        }"
      >
        {{ meta }}
      </div>

      <!-- Bottom-right brand badge -->
      <div
        :style="{
          position: 'absolute',
          bottom: '24px',
          right: '72px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }"
      >
        <div
          :style="{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            // eslint-disable-next-line narduk/no-inline-hex -- OG brand badge
            background: '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: '400',
            fontFamily: 'Inter, sans-serif',
          }"
        >
          NB
        </div>
        <div
          :style="{
            fontSize: '15px',
            fontWeight: '400',
            fontFamily: 'Inter, sans-serif',
            // eslint-disable-next-line narduk/no-inline-hex -- OG brand text
            color: '#64748b',
            letterSpacing: '0.01em',
          }"
        >
          {{ siteName }}
        </div>
      </div>
    </div>
  </div>
</template>

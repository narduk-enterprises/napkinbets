<!--
  OG Image Default Template — Napkinbets branded.

  Deep forest-green background with warm paper highlights,
  Fraunces for titles (brand display serif), Manrope for body.

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
    tagColor: '#c67a12',
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
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '64px 80px',
      fontFamily: 'Manrope, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      // eslint-disable-next-line narduk/no-inline-hex -- OG deep green background
      background: 'linear-gradient(145deg, #0a2618 0%, #0d3321 30%, #14532d 60%, #166534 100%)',
    }"
  >
    <!-- Warm paper glow: top-right -->
    <div
      :style="{
        position: 'absolute',
        top: '-60px',
        right: '-20px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        // eslint-disable-next-line narduk/no-inline-hex -- OG warm glow
        background: 'radial-gradient(circle, #fff8ef12 0%, #c67a120a 40%, transparent 70%)',
      }"
    />

    <!-- Gold glow: bottom-left -->
    <div
      :style="{
        position: 'absolute',
        bottom: '-100px',
        left: '-40px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        // eslint-disable-next-line narduk/no-inline-hex -- OG gold glow
        background: 'radial-gradient(circle, #c67a1210 0%, transparent 65%)',
      }"
    />

    <!-- Top accent line -->
    <div
      :style="{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        // eslint-disable-next-line narduk/no-inline-hex -- OG accent bar
        background: 'linear-gradient(90deg, #c67a12, #f59e0b, #c67a12)',
      }"
    />

    <!-- Tag badge -->
    <div
      v-if="tag"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '18px',
      }"
    >
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '5px 14px',
          borderRadius: '9999px',
          background: `${tagColor}20`,
          border: `1.5px solid ${tagColor}50`,
        }"
      >
        <div
          :style="{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: tagColor,
          }"
        />
        <span
          :style="{
            fontSize: '13px',
            fontWeight: '700',
            fontFamily: 'Manrope, sans-serif',
            color: tagColor,
            letterSpacing: '0.08em',
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
        marginBottom: '20px',
      }"
    >
      <div v-if="homeLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
        <img
          :src="homeLogo"
          :style="{
            width: '44px',
            height: '44px',
            objectFit: 'contain',
            borderRadius: '8px',
          }"
        />
        <span
          v-if="homeLabel"
          :style="{
            fontSize: '20px',
            fontWeight: '700',
            fontFamily: 'Manrope, sans-serif',
            // eslint-disable-next-line narduk/no-inline-hex -- OG team label
            color: '#fff8ef',
          }"
        >
          {{ homeLabel }}
        </span>
      </div>
      <span
        :style="{
          fontSize: '16px',
          fontWeight: '600',
          // eslint-disable-next-line narduk/no-inline-hex -- OG vs label
          color: '#94a3b8',
          fontFamily: 'Manrope, sans-serif',
        }"
      >
        vs
      </span>
      <div v-if="awayLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
        <img
          :src="awayLogo"
          :style="{
            width: '44px',
            height: '44px',
            objectFit: 'contain',
            borderRadius: '8px',
          }"
        />
        <span
          v-if="awayLabel"
          :style="{
            fontSize: '20px',
            fontWeight: '700',
            fontFamily: 'Manrope, sans-serif',
            // eslint-disable-next-line narduk/no-inline-hex -- OG team label
            color: '#fff8ef',
          }"
        >
          {{ awayLabel }}
        </span>
      </div>
    </div>

    <!-- Icon (when no team logos) -->
    <div
      v-else-if="icon"
      :style="{
        fontSize: '38px',
        marginBottom: '10px',
      }"
    >
      {{ icon }}
    </div>

    <!-- Title — Fraunces display serif -->
    <div
      :style="{
        fontSize: '48px',
        fontWeight: '700',
        fontFamily: 'Fraunces, Georgia, serif',
        // eslint-disable-next-line narduk/no-inline-hex -- OG cream title
        color: '#fff8ef',
        lineHeight: '1.15',
        marginBottom: '14px',
        maxWidth: '920px',
        letterSpacing: '-0.02em',
      }"
    >
      {{ title }}
    </div>

    <!-- Description — Manrope body -->
    <div
      :style="{
        fontSize: '20px',
        fontWeight: '400',
        fontFamily: 'Manrope, sans-serif',
        // eslint-disable-next-line narduk/no-inline-hex -- OG muted description
        color: '#94a3b8',
        lineHeight: '1.5',
        maxWidth: '820px',
      }"
    >
      {{ description }}
    </div>

    <!-- Meta line -->
    <div
      v-if="meta"
      :style="{
        marginTop: '14px',
        fontSize: '15px',
        fontWeight: '600',
        fontFamily: 'Manrope, sans-serif',
        // eslint-disable-next-line narduk/no-inline-hex -- OG gold meta
        color: '#f59e0b',
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
        right: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }"
    >
      <div
        :style="{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          // eslint-disable-next-line narduk/no-inline-hex -- OG brand badge bg
          background: '#c67a12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
          fontFamily: 'Manrope, sans-serif',
        }"
      >
        NB
      </div>
      <div
        :style="{
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: 'Manrope, sans-serif',
          // eslint-disable-next-line narduk/no-inline-hex -- OG brand text
          color: '#64748b',
          letterSpacing: '0.02em',
        }"
      >
        {{ siteName }}
      </div>
    </div>
  </div>
</template>

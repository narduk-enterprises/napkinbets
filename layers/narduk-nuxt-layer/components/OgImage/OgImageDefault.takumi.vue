<!--
  OG Image Default Template — Napkinbets branded.

  Uses the Napkinbets warm palette: forest green accent, cream paper,
  gold highlights, ink text. Manrope font family.

  Nuxt OG Image v6 resolves renderers by filename suffix (.takumi.vue).
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    /** Contextual metadata badge — rendered above the title */
    tag?: string
    /** Badge accent color hex */

    tagColor?: string
    siteName?: string
    /** Extra metadata line (e.g. "Mar 19 · 7:00 PM ET · TNT") */
    meta?: string
    /** Team home logo URL */
    homeLogo?: string
    /** Team away logo URL */
    awayLogo?: string
    /** Team home short name */
    homeLabel?: string
    /** Team away short name */
    awayLabel?: string
  }>(),
  {
    title: 'Napkinbets',
    description: 'Pick a game. Start a bet. Settle after the final.',
    icon: '🎯',
    tag: '',
    // eslint-disable-next-line narduk/no-inline-hex -- OG image brand color
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
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '64px 80px',
      // eslint-disable-next-line narduk/no-inline-hex -- OG image warm gradient
      background: 'linear-gradient(150deg, #fff8ef 0%, #fef3e2 30%, #fde8c8 70%, #fce0b5 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Accent glow: top-right forest green -->
    <div
      :style="{
        position: 'absolute',
        top: '-80px',
        right: '-40px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image ambient glow
        background: 'radial-gradient(circle, #16653418 0%, transparent 70%)',
      }"
    />

    <!-- Accent glow: bottom-left gold -->
    <div
      :style="{
        position: 'absolute',
        bottom: '-120px',
        left: '-60px',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image ambient glow
        background: 'radial-gradient(circle, #c67a1215 0%, transparent 70%)',
      }"
    />

    <!-- Bottom accent bar: green → gold gradient -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '5px',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image brand bar
        background: 'linear-gradient(90deg, #166534, #22c55e, #c67a12)',
      }"
    />

    <!-- Tag badge (contextual metadata) -->
    <div
      v-if="tag"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
      }"
    >
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: '9999px',
          background: `${tagColor}15`,
          border: `1.5px solid ${tagColor}35`,
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
            fontWeight: '700',
            color: tagColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Matchup row (for events with team logos) -->
    <div
      v-if="homeLogo || awayLogo"
      :style="{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px',
      }"
    >
      <div v-if="homeLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
        <img
          :src="homeLogo"
          :style="{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }"
        />
        <span
          v-if="homeLabel"
          :style="{
            fontSize: '20px',
            fontWeight: '700',
            // eslint-disable-next-line narduk/no-inline-hex -- OG image ink
            color: '#0f1a24',
          }"
        >
          {{ homeLabel }}
        </span>
      </div>
      <span
        :style="{
          fontSize: '18px',
          fontWeight: '600',
          // eslint-disable-next-line narduk/no-inline-hex -- OG image muted text
          color: '#64748b',
        }"
      >
        vs
      </span>
      <div v-if="awayLogo" :style="{ display: 'flex', alignItems: 'center', gap: '10px' }">
        <img
          :src="awayLogo"
          :style="{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }"
        />
        <span
          v-if="awayLabel"
          :style="{
            fontSize: '20px',
            fontWeight: '700',
            // eslint-disable-next-line narduk/no-inline-hex -- OG image ink
            color: '#0f1a24',
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
        fontSize: '40px',
        marginBottom: '12px',
      }"
    >
      {{ icon }}
    </div>

    <!-- Title -->
    <div
      :style="{
        fontSize: '50px',
        fontWeight: '700',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image title ink color
        color: '#0f1a24',
        lineHeight: '1.15',
        marginBottom: '12px',
        maxWidth: '920px',
        letterSpacing: '-0.025em',
      }"
    >
      {{ title }}
    </div>

    <!-- Description -->
    <div
      :style="{
        fontSize: '22px',
        fontWeight: '400',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image muted text
        color: '#475569',
        lineHeight: '1.5',
        maxWidth: '820px',
      }"
    >
      {{ description }}
    </div>

    <!-- Meta line (start time, broadcast, etc.) -->
    <div
      v-if="meta"
      :style="{
        marginTop: '14px',
        fontSize: '16px',
        fontWeight: '600',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image gold accent
        color: '#c67a12',
        letterSpacing: '0.02em',
      }"
    >
      {{ meta }}
    </div>

    <!-- Bottom-right brand badge -->
    <div
      :style="{
        position: 'absolute',
        bottom: '28px',
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
          // eslint-disable-next-line narduk/no-inline-hex -- OG image brand badge
          background: '#166534',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
        }"
      >
        NB
      </div>
      <div
        :style="{
          fontSize: '15px',
          fontWeight: '600',
          // eslint-disable-next-line narduk/no-inline-hex -- OG image brand text
          color: '#334155',
          letterSpacing: '0.02em',
        }"
      >
        {{ siteName }}
      </div>
    </div>
  </div>
</template>

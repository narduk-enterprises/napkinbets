<!--
  OG Image Default Template — Napkinbets branded.

  Nuxt OG Image v6 resolves renderers by filename suffix, so this template
  is explicitly Takumi via `.takumi.vue`.

  Props:
  - title / description / icon — core content
  - tag — contextual metadata badge (e.g. "Pool · Open", "NBA · Upcoming")
  - tagColor — badge accent color hex (defaults to primary emerald)
  - siteName — bottom-right branding
  - primaryColor — brand accent for gradient glow and bar
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
    /** Brand color hex — defaults to emerald */
    primaryColor?: string
  }>(),
  {
    title: 'Napkinbets',
    description: 'Pick a game. Start a bet. Settle after the final.',
    icon: '🎯',
    tag: '',
    // eslint-disable-next-line narduk/no-inline-hex -- OG image default brand color
    tagColor: '#22c55e',
    siteName: 'napkinbets',
    // eslint-disable-next-line narduk/no-inline-hex -- OG image default brand color
    primaryColor: '#22c55e',
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
      padding: '72px 80px',
      background: 'linear-gradient(145deg, #070b14 0%, #0c1220 35%, #111d33 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Ambient glow: top-right -->
    <div
      :style="{
        position: 'absolute',
        top: '-100px',
        right: '-60px',
        width: '480px',
        height: '480px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
      }"
    />

    <!-- Ambient glow: bottom-left subtle -->
    <div
      :style="{
        position: 'absolute',
        bottom: '-160px',
        left: '-80px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #3b82f615 0%, transparent 70%)',
      }"
    />

    <!-- Bottom accent bar -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: `linear-gradient(90deg, ${primaryColor}, #3b82f6, #8b5cf6)`,
      }"
    />

    <!-- Tag badge (contextual metadata) -->
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
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: `${tagColor}18`,
          border: `1px solid ${tagColor}40`,
        }"
      >
        <div
          :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: tagColor,
          }"
        />
        <span
          :style="{
            fontSize: '16px',
            fontWeight: '600',
            color: tagColor,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
          }"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Icon -->
    <div
      v-if="icon"
      :style="{
        fontSize: '44px',
        marginBottom: '16px',
      }"
    >
      {{ icon }}
    </div>

    <!-- Title -->
    <div
      :style="{
        fontSize: '52px',
        fontWeight: '700',
        // eslint-disable-next-line narduk/no-inline-hex -- OG image title color; Takumi WASM uses inline styles
        color: '#f1f5f9',
        lineHeight: '1.15',
        marginBottom: '14px',
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
        // eslint-disable-next-line narduk/no-inline-hex -- OG image description color; Takumi WASM uses inline styles
        color: '#94a3b8',
        lineHeight: '1.5',
        maxWidth: '820px',
      }"
    >
      {{ description }}
    </div>

    <!-- Bottom-right brand badge -->
    <div
      :style="{
        position: 'absolute',
        bottom: '32px',
        right: '80px',
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
          background: primaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '13px',
          fontWeight: '700',
        }"
      >
        NB
      </div>
      <div
        :style="{
          fontSize: '16px',
          fontWeight: '600',
          // eslint-disable-next-line narduk/no-inline-hex -- OG image brand text color; Takumi WASM uses inline styles
          color: '#475569',
          letterSpacing: '0.02em',
        }"
      >
        {{ siteName }}
      </div>
    </div>
  </div>
</template>

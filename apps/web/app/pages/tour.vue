<script setup lang="ts">
import NapkinbetsTourSlide from '~/components/napkinbets/tour/NapkinbetsTourSlide.vue'
import { useNapkinbetsTour } from '~/composables/useNapkinbetsTour'

definePageMeta({
  layout: 'presentation',
})

const { slides } = useNapkinbetsTour()

useSeo({
  title: 'Napkinbets walkthrough',
  description:
    'A focused slide walkthrough of how Napkinbets Events, bets, and settle-up work together.',
  image: '/brand/og/tour.webp',
})

useWebPageSchema({
  name: 'Napkinbets walkthrough',
  description:
    'A focused slide walkthrough of how Napkinbets Events, bets, and settle-up work together.',
})
</script>

<template>
  <div class="bg-default">
    <div
      class="grid h-dvh auto-cols-[100vw] grid-flow-col overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Napkinbets walkthrough slides"
    >
      <NapkinbetsTourSlide
        v-for="(slide, index) in slides"
        :key="slide.id"
        :slide="slide"
        :slide-index="index"
        :slide-count="slides.length"
        :next-slide-id="slides[index + 1]?.id"
      />
    </div>
  </div>
</template>

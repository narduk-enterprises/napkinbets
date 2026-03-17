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
    'A focused slide walkthrough of how Napkinbets discovery, boards, and closeout work together.',
  ogImage: {
    title: 'Napkinbets walkthrough',
    description:
      'A focused slide walkthrough of how Napkinbets discovery, boards, and closeout work together.',
    icon: '🧾',
  },
})

useWebPageSchema({
  name: 'Napkinbets walkthrough',
  description:
    'A focused slide walkthrough of how Napkinbets discovery, boards, and closeout work together.',
})
</script>

<template>
  <div class="bg-default">
    <div class="grid auto-cols-[100%] grid-flow-col overflow-x-auto snap-x snap-mandatory">
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

<script setup lang="ts">
import NapkinbetsTourSlide from '~/components/napkinbets/tour/NapkinbetsTourSlide.vue'
import { useNapkinbetsTour } from '~/composables/useNapkinbetsTour'

const { hero, slides, flowSteps } = useNapkinbetsTour()

useSeo({
  title: 'Napkinbets guided tour',
  description: hero.summary,
  ogImage: {
    title: 'Napkinbets guided tour',
    description: hero.summary,
    icon: '🧾',
  },
})

useWebPageSchema({
  name: 'Napkinbets guided tour',
  description: hero.summary,
})
</script>

<template>
  <div class="napkinbets-page">
    <section class="napkinbets-hero overflow-hidden">
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div class="space-y-4">
          <p class="napkinbets-kicker">{{ hero.kicker }}</p>
          <div class="space-y-3">
            <h1 class="napkinbets-hero-title">See the product before you have to learn it.</h1>
            <p class="napkinbets-hero-lede">
              {{ hero.summary }}
            </p>
          </div>

          <div class="grid gap-3">
            <div
              v-for="callout in hero.callouts"
              :key="callout"
              class="rounded-[1.15rem] border border-default/70 bg-white/72 px-4 py-3 text-sm leading-6 text-muted"
            >
              {{ callout }}
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton to="/register" color="primary" size="lg" icon="i-lucide-user-plus">
              Register
            </UButton>
            <UButton to="/discover" color="neutral" variant="soft" size="lg" icon="i-lucide-radar">
              Explore the slate
            </UButton>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div
            v-for="step in flowSteps"
            :key="step.id"
            class="rounded-[1.25rem] border border-default/70 bg-white/76 px-4 py-4 shadow-card"
          >
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
              {{ step.title }}
            </p>
            <p class="mt-2 font-display text-xl text-default">{{ step.signal }}</p>
            <p class="mt-2 text-sm leading-6 text-muted">{{ step.summary }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Guided tour</p>
          <h2 class="napkinbets-section-title">Four slides, one mental model</h2>
        </div>
        <p class="text-sm text-muted">Swipe on mobile. Scroll on desktop.</p>
      </div>

      <div class="napkinbets-scroll-strip">
        <NapkinbetsTourSlide v-for="slide in slides" :key="slide.id" :slide="slide" />
      </div>
    </section>

    <section class="napkinbets-panel rounded-[1.5rem] border border-default/70 p-5 sm:p-6">
      <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Next step</p>
          <h2 class="napkinbets-section-title">Send this page first, then let them loose.</h2>
          <p class="text-sm leading-6 text-muted">
            Start with the tour for context, then push them into account creation and discovery so
            the product explains itself with real boards.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <UButton to="/register" color="primary" size="lg" icon="i-lucide-user-check">
            Register
          </UButton>
          <UButton
            to="/discover"
            color="neutral"
            variant="soft"
            size="lg"
            icon="i-lucide-arrow-right"
          >
            Explore on your own
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

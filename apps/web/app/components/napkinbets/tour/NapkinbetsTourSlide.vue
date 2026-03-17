<script setup lang="ts">
import type { NapkinbetsTourSlide } from '~/composables/useNapkinbetsTour'

const props = defineProps<{
  slide: NapkinbetsTourSlide
  slideIndex: number
  slideCount: number
  nextSlideId?: string
}>()
</script>

<template>
  <section :id="slide.id" class="h-dvh w-screen shrink-0 snap-center snap-always overflow-hidden">
    <div
      class="grid h-dvh grid-rows-[30dvh_1fr] overflow-hidden border-y border-default/60 bg-white/85 shadow-overlay backdrop-blur sm:grid-rows-[33dvh_1fr] lg:grid-cols-[0.92fr_1.08fr] lg:grid-rows-1 lg:border-x"
    >
      <div class="relative min-h-[30dvh] overflow-hidden lg:order-2 lg:min-h-0">
        <img :src="slide.imageSrc" :alt="slide.imageAlt" class="h-full w-full object-cover" />
        <div
          class="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/25 via-black/8 to-transparent lg:hidden"
          aria-hidden="true"
        />
      </div>

      <div class="relative flex min-h-0 flex-col justify-between gap-4 overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:order-1 lg:gap-6 lg:px-8 lg:py-8">
        <div
          class="absolute inset-0 bg-linear-to-br opacity-80"
          :class="slide.accentClass"
          aria-hidden="true"
        />

        <div class="relative flex items-center justify-between gap-3">
          <p class="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-primary">
            {{ slide.step }}
          </p>

          <div
            class="rounded-full border border-default/70 bg-white/80 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted"
          >
            {{ props.slideIndex + 1 }} / {{ props.slideCount }}
          </div>
        </div>

        <div class="relative space-y-3 lg:space-y-4">
          <div class="space-y-2.5 lg:space-y-3">
            <h1 class="font-display text-3xl leading-none text-default sm:text-5xl">
              {{ slide.title }}
            </h1>
            <p class="max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7 lg:text-lg">
              {{ slide.summary }}
            </p>
          </div>
        </div>

        <div class="relative grid gap-2.5">
          <div
            v-for="highlight in slide.highlights"
            :key="highlight"
            class="rounded-[1rem] border border-default/70 bg-white/82 px-3.5 py-2.5 text-sm leading-5 text-default lg:px-4 lg:py-3"
          >
            {{ highlight }}
          </div>
        </div>

        <div class="relative flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted sm:text-sm">{{ slide.footnote }}</p>
            <p
              v-if="!slide.actions?.length"
              class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-toned"
            >
              Swipe sideways or tap next
            </p>
          </div>

          <div v-if="slide.actions?.length" class="flex flex-wrap gap-2.5">
            <UButton
              v-for="action in slide.actions"
              :key="action.label"
              :to="action.to"
              :color="action.color"
              :variant="action.variant"
              size="md"
              :icon="action.icon"
            >
              {{ action.label }}
            </UButton>
          </div>

          <UButton
            v-else-if="nextSlideId"
            :to="`#${nextSlideId}`"
            color="neutral"
            variant="soft"
            size="md"
            icon="i-lucide-arrow-right"
          >
            Next slide
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>

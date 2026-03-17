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
  <section :id="slide.id" class="snap-start">
    <div class="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div
        class="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-default/70 bg-white/80 shadow-overlay backdrop-blur md:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div
          class="relative order-2 flex flex-col justify-between gap-6 p-5 sm:p-6 lg:order-1 lg:p-8"
        >
          <div
            class="absolute inset-0 bg-linear-to-br opacity-80"
            :class="slide.accentClass"
            aria-hidden="true"
          />

          <div class="relative flex items-center justify-between gap-3">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-default/70 bg-white/80 px-3 py-2"
            >
              <img
                src="/brand/napkinbets-mark.svg"
                alt="Napkinbets"
                class="size-7 rounded-2xl object-cover"
              />
              <span class="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-default">
                Napkinbets
              </span>
            </div>

            <div
              class="rounded-full border border-default/70 bg-white/80 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted"
            >
              {{ props.slideIndex + 1 }} / {{ props.slideCount }}
            </div>
          </div>

          <div class="relative space-y-4">
            <p class="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-primary">
              {{ slide.step }}
            </p>
            <div class="space-y-3">
              <h1 class="font-display text-4xl leading-none text-default sm:text-5xl">
                {{ slide.title }}
              </h1>
              <p class="max-w-xl text-base leading-7 text-muted sm:text-lg">
                {{ slide.summary }}
              </p>
            </div>
          </div>

          <div class="relative grid gap-3">
            <div
              v-for="highlight in slide.highlights"
              :key="highlight"
              class="rounded-[1.2rem] border border-default/70 bg-white/82 px-4 py-3 text-sm leading-6 text-default"
            >
              {{ highlight }}
            </div>
          </div>

          <div class="relative flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm font-medium text-muted">{{ slide.footnote }}</p>

            <div v-if="slide.actions?.length" class="flex flex-wrap gap-3">
              <UButton
                v-for="action in slide.actions"
                :key="action.label"
                :to="action.to"
                :color="action.color"
                :variant="action.variant"
                size="lg"
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
              size="lg"
              icon="i-lucide-arrow-right"
            >
              Next slide
            </UButton>
          </div>
        </div>

        <div class="order-1 min-h-[18rem] lg:order-2 lg:min-h-full">
          <img :src="slide.imageSrc" :alt="slide.imageAlt" class="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  </section>
</template>

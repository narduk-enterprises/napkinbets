<script setup lang="ts">
import type { NapkinbetsTourSlide } from '~/composables/useNapkinbetsTour'

defineProps<{
  slide: NapkinbetsTourSlide
}>()
</script>

<template>
  <UCard class="napkinbets-panel overflow-hidden border border-default/70 p-0 shadow-elevated">
    <div class="relative">
      <img :src="slide.imageSrc" :alt="slide.imageAlt" class="h-44 w-full object-cover" />
      <div class="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/35" />

      <div class="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 py-4">
        <UBadge color="warning" variant="soft">{{ slide.kicker }}</UBadge>
        <span class="rounded-full bg-white/88 px-3 py-1 text-[0.68rem] font-semibold text-default">
          {{ slide.status }}
        </span>
      </div>

      <div class="absolute inset-x-0 bottom-0 px-4 pb-4">
        <div class="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-white backdrop-blur-sm">
          <UIcon :name="slide.icon" class="size-4" />
          <span class="text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
            {{ slide.title }}
          </span>
        </div>
      </div>
    </div>

    <div class="space-y-4 px-4 py-4">
      <div class="space-y-2">
        <h3 class="font-display text-2xl text-default">{{ slide.title }}</h3>
        <p class="text-sm leading-6 text-muted">
          {{ slide.summary }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="tag in slide.tags"
          :key="tag"
          color="neutral"
          variant="soft"
          size="sm"
        >
          {{ tag }}
        </UBadge>
      </div>

      <div class="grid gap-2">
        <div
          v-for="detail in slide.details"
          :key="detail"
          class="rounded-2xl border border-default/70 bg-default/70 px-3 py-3 text-sm text-muted"
          :class="slide.accentClass"
        >
          {{ detail }}
        </div>
      </div>
    </div>
  </UCard>
</template>

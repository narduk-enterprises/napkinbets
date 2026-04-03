<script setup lang="ts">
import NapkinbetsTemplateCard from '../components/napkinbets/templates/NapkinbetsTemplateCard.vue'
import {
  buildNapkinbetsTemplateCreateQuery,
  getNapkinbetsContractNextTemplates,
  getNapkinbetsReadyNowTemplates,
} from '../utils/napkinbets-game-templates'

const readyNowTemplates = getNapkinbetsReadyNowTemplates()
const contractNextTemplates = getNapkinbetsContractNextTemplates()

const categoryOrder = [
  {
    key: 'quick-games',
    label: 'Quick Games',
    description: 'Fast formats for one-on-ones, side action, and room-specific competition.',
  },
  {
    key: 'group-pools',
    label: 'Group Pools',
    description: 'Shared standings formats for office pools, event weekends, and recurring rooms.',
  },
  {
    key: 'golf-pools',
    label: 'Golf Pools',
    description: 'Golf-specific formats built to feel native, not bolted on.',
  },
] as const

const readyNowSections = computed(() =>
  categoryOrder
    .map((category) => ({
      ...category,
      templates: readyNowTemplates.filter((template) => template.categoryKey === category.key),
    }))
    .filter((category) => category.templates.length > 0),
)

const faqItems = [
  {
    question: 'What is a template on Napkin Bets?',
    answer:
      'A template is the reusable shell for a game format. It gives the host a clear starting point instead of a blank bet form.',
  },
  {
    question: 'Why are some formats marked contract next?',
    answer:
      'Those formats are locked into the product direction and schema contract, but they still need richer execution shells before they should be treated as fully first-class.',
  },
  {
    question: 'Should I start here or in Events?',
    answer:
      'Start here when the format is your main question. Start in Events when a live matchup or tournament should anchor the game.',
  },
] as const

useSeo({
  title: 'Game templates',
  description:
    'Browse the reusable formats behind Napkin Bets, from winner pools and golf challenges to event prediction games and side-action formats.',
  keywords: ['sports pool templates', 'golf pool app', 'event prediction pool', 'office pick pool'],
  ogImage: {
    title: 'Browse Napkin Bets templates',
    description: 'Winner pools, golf formats, event prediction games, and structured side-action.',
    icon: '🧩',
  },
})

useWebPageSchema({
  name: 'Napkin Bets Templates',
  description: 'A collection page for reusable Napkin Bets game formats and product templates.',
  type: 'CollectionPage',
})

useFAQSchema([...faqItems])

function buildTemplateLink(templateKey: string) {
  return {
    path: '/napkins/create',
    query: buildNapkinbetsTemplateCreateQuery(templateKey),
  }
}
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Templates</p>
        <h1 class="napkinbets-section-title">
          The reusable formats that make Napkin Bets make sense.
        </h1>
        <p class="napkinbets-hero-lede">
          Templates are the product spine. Pick the format first, then attach an event or tune the
          details for your room.
        </p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-3">
          <p class="napkinbets-kicker">Start points</p>
          <h2 class="napkinbets-subsection-title">Use templates when the format comes first.</h2>
          <p class="napkinbets-support-copy">
            Winner pools, golf challenges, event prediction pools, and side games all start faster
            when the structure is already defined.
          </p>
          <div class="napkinbets-chip-grid">
            <UBadge color="success" variant="soft">Ready now</UBadge>
            <UBadge color="warning" variant="soft">Contract next</UBadge>
          </div>
        </div>
      </UCard>

      <UCard class="napkinbets-panel">
        <div class="space-y-3">
          <p class="napkinbets-kicker">Need live context?</p>
          <h2 class="napkinbets-subsection-title">
            Use Events when the schedule should anchor the game.
          </h2>
          <p class="napkinbets-support-copy">
            Templates and Events work together. Templates define the rules. Events bring in the
            matchup, tournament, timing, and live context.
          </p>
          <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-radar">
            Browse events
          </UButton>
        </div>
      </UCard>
    </div>

    <div v-for="section in readyNowSections" :key="section.key" class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">{{ section.label }}</p>
        <h2 class="napkinbets-section-title">{{ section.description }}</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <NapkinbetsTemplateCard
          v-for="template in section.templates"
          :key="template.key"
          :template="template"
          :to="buildTemplateLink(template.key)"
          cta-label="Start from this format"
        />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Contract next</p>
        <h2 class="napkinbets-section-title">Formats already locked into the product direction.</h2>
        <p class="napkinbets-section-description">
          These formats belong in Napkin Bets, but they still need richer execution shells before
          they should be treated as fully first-class.
        </p>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <NapkinbetsTemplateCard
          v-for="template in contractNextTemplates"
          :key="template.key"
          :template="template"
          :to="buildTemplateLink(template.key)"
          cta-label="Open structured draft"
        />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">FAQ</p>
        <h2 class="napkinbets-section-title">What people ask about templates.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard v-for="item in faqItems" :key="item.question" class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">{{ item.question }}</h3>
            <p class="napkinbets-support-copy">{{ item.answer }}</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildNapkinbetsTemplateCreateQuery,
  getNapkinbetsGolfTemplates,
} from '../utils/napkinbets-game-templates'

const golfTemplates = getNapkinbetsGolfTemplates()

const golfFaq = [
  {
    question: 'Why is golf such a strong fit for Napkin Bets?',
    answer:
      'Golf naturally creates repeated group rituals: majors, one-and-done circles, weekend side pots, and leaderboard-driven sweats that work well with structured templates.',
  },
  {
    question: 'Which golf formats are strongest right now?',
    answer:
      'Golf Winner Pool and Golf Major Challenge are the strongest first-class formats today, with Golf One-and-Done already locked into the product contract.',
  },
  {
    question: 'Do I need to invent the rules every time?',
    answer:
      'No. The golf templates give you a starting shell, then you customize the lane names, payout splits, and side questions to fit your room.',
  },
] as const

useSeo({
  title: 'Golf pools and major-week games',
  description:
    'Run golf winner pools, major-week challenges, and repeatable social golf formats built for groups, trips, and text-chain rooms.',
  keywords: ['golf pool app', 'golf winner pool', 'major challenge pool', 'one and done golf pool'],
  ogImage: {
    title: 'Golf pools that feel first-class',
    description: 'Winner pools, major-week challenges, and repeatable golf room formats.',
    icon: '⛳',
  },
})

useWebPageSchema({
  name: 'Napkin Bets Golf Pools',
  description:
    'A golf template collection page for winner pools, major-week challenges, and other repeatable golf formats.',
  type: 'CollectionPage',
})

useFAQSchema([...golfFaq])

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
        <p class="napkinbets-kicker">Golf pools</p>
        <h1 class="napkinbets-section-title">
          Golf rooms need better structure than a text thread.
        </h1>
        <p class="napkinbets-hero-lede">
          Napkin Bets treats golf as a first-class cluster of social competition, from winner pools
          and major-week challenges to contract-ready one-and-done support.
        </p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <UCard class="napkinbets-panel">
        <div class="space-y-2">
          <h2 class="napkinbets-subsection-title">Built for repeat play</h2>
          <p class="napkinbets-support-copy">
            Golf rooms come back for every major, signature event, trip weekend, and side-action
            sweat.
          </p>
        </div>
      </UCard>

      <UCard class="napkinbets-panel">
        <div class="space-y-2">
          <h2 class="napkinbets-subsection-title">Perfect for group rituals</h2>
          <p class="napkinbets-support-copy">
            Clubhouse groups, trip captains, and Augusta text chains need lanes, standings, and a
            clear closeout path.
          </p>
        </div>
      </UCard>

      <UCard class="napkinbets-panel">
        <div class="space-y-2">
          <h2 class="napkinbets-subsection-title">Flexible without chaos</h2>
          <p class="napkinbets-support-copy">
            You can run a clean winner pool or a side-action-heavy major challenge without dumping
            every rule into a giant manual note.
          </p>
        </div>
      </UCard>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Golf formats</p>
        <h2 class="napkinbets-section-title">The golf template cluster.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <NapkinbetsTemplateCard
          v-for="template in golfTemplates"
          :key="template.key"
          :template="template"
          :to="buildTemplateLink(template.key)"
          cta-label="Start golf format"
        />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Next step</p>
        <h2 class="napkinbets-section-title">Start from a golf format, then attach the event.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Browse golf-friendly templates</h3>
            <p class="napkinbets-support-copy">
              Pick the format first when the room already knows the shape of the challenge.
            </p>
            <UButton to="/templates" color="primary" icon="i-lucide-layout-template">
              Open templates
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Anchor it to a live tournament</h3>
            <p class="napkinbets-support-copy">
              Use Events when the live schedule and tournament context should do some of the work
              for you.
            </p>
            <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-radar">
              Browse events
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">FAQ</p>
        <h2 class="napkinbets-section-title">Quick golf-specific answers.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard v-for="item in golfFaq" :key="item.question" class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">{{ item.question }}</h3>
            <p class="napkinbets-support-copy">{{ item.answer }}</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

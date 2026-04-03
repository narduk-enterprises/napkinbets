<script setup lang="ts">
const terminologyCards = [
  {
    term: 'Template',
    summary:
      'The reusable game format. Start here when you know the shape of the competition you want to run.',
  },
  {
    term: 'Game',
    summary:
      'A live instance created from a template. It holds players, picks, standings, and settle-up.',
  },
  {
    term: 'Pool',
    summary: 'A multiplayer game with shared standings, side questions, or payout splits.',
  },
  {
    term: 'Group',
    summary: 'A recurring room for friends, office pools, golf trips, or watch-party communities.',
  },
  {
    term: 'Event',
    summary:
      'The real-world sports or entertainment event that can anchor a game when live context helps.',
  },
  {
    term: 'Pick',
    summary: 'The specific choice or answer a player makes inside the game.',
  },
  {
    term: 'Entry',
    summary: 'A player seat inside a multiplayer game.',
  },
  {
    term: 'Settle-up',
    summary:
      'The proof and confirmation layer after a result is official. Money still moves off-platform.',
  },
] as const

const quickMap = [
  'Choose a template when you know the format.',
  'Browse events when live context should anchor the game.',
  'Create the game and invite the group.',
  'Track picks and standings in one place.',
  'Settle manually after the official result is posted.',
] as const

const faqItems = [
  {
    question: 'What should I start with if I am brand new?',
    answer:
      'Start with Templates if you know the game format, or Events if you want a real matchup or tournament to anchor the game.',
  },
  {
    question: 'What is the difference between a template and a game?',
    answer:
      'A template is the reusable shell. A game is the live instance your group joins and plays.',
  },
  {
    question: 'Why does the app still mention napkins or wagers sometimes?',
    answer:
      'Those are legacy internal terms from the original build. The product language is now centered on templates, games, pools, picks, and groups.',
  },
  {
    question: 'Does Napkin Bets move money?',
    answer:
      'No. It keeps the competition organized and records proof, but payment still happens through the apps your group already uses.',
  },
] as const

useSeo({
  title: 'How Napkin Bets works',
  description:
    'Understand templates, games, pools, groups, picks, and manual settle-up in plain English.',
  ogImage: {
    title: 'How Napkin Bets works',
    description: 'Templates first, games second, settle-up after the final.',
    icon: '📘',
  },
})

useWebPageSchema({
  name: 'How Napkin Bets works',
  description: 'A simple guide to the Napkin Bets product model, terminology, and player flow.',
  type: 'FAQPage',
})

useFAQSchema([...faqItems])
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">How it works</p>
        <h1 class="napkinbets-section-title">One product, one mental model.</h1>
        <p class="napkinbets-hero-lede">
          Napkin Bets is a template-first platform for casual social games. This page locks the
          language, the flow, and the few concepts players actually need to understand.
        </p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Fast map</p>
            <h2 class="napkinbets-subsection-title">The basic flow</h2>
          </div>

          <div class="napkinbets-process-list">
            <div v-for="(item, index) in quickMap" :key="item" class="napkinbets-process-item">
              <div class="napkinbets-process-step">{{ index + 1 }}</div>
              <p class="text-sm leading-6 text-default">{{ item }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-2">
        <UCard v-for="card in terminologyCards" :key="card.term" class="napkinbets-panel">
          <div class="space-y-2">
            <p class="napkinbets-kicker">{{ card.term }}</p>
            <p class="text-sm leading-6 text-default">{{ card.summary }}</p>
          </div>
        </UCard>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Start points</p>
        <h2 class="napkinbets-section-title">When to use each path.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">Templates</h3>
            <p class="napkinbets-support-copy">
              Use this when the format is the main question. Great for winner pools, golf
              challenges, event prediction pools, and repeat group play.
            </p>
            <UButton to="/templates" color="primary" icon="i-lucide-layout-template">
              Browse templates
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">Events</h3>
            <p class="napkinbets-support-copy">
              Use this when a real matchup, tournament, or live schedule should anchor the game.
            </p>
            <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-radar">
              Browse events
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">Groups</h3>
            <p class="napkinbets-support-copy">
              Use groups when the same people come back every week, every tournament, or every golf
              trip.
            </p>
            <UButton to="/groups" color="neutral" variant="soft" icon="i-lucide-users-round">
              Open groups
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">FAQ</p>
        <h2 class="napkinbets-section-title">Short answers to the confusing parts.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
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

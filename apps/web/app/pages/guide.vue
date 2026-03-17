<script setup lang="ts">
const termCards = [
  {
    term: 'Napkin',
    summary: 'The shared bet page. It holds the people, the sides, the stake, the status, and the settle-up record.',
  },
  {
    term: 'Simple bet',
    summary: 'A two-person napkin. One stake, one opponent, and the cleanest path from idea to agreed bet.',
  },
  {
    term: 'Pool',
    summary: 'A group napkin. Use it when there are several people, multiple lanes, draft order, or split payouts.',
  },
  {
    term: 'Event',
    summary: 'The real-world thing the napkin can attach to: a game, a round, a race, or another scheduled result.',
  },
  {
    term: 'Friend',
    summary: 'Someone you bet with often. Adding them once makes future one-on-ones much faster.',
  },
  {
    term: 'Group',
    summary: 'A recurring room of people. It gives a napkin a home before anyone starts picking sides.',
  },
  {
    term: 'Side',
    summary: 'One possible outcome on the napkin, like Celtics, Lakers, Yes, or No.',
  },
  {
    term: 'Settle-up',
    summary: 'The last step. Napkinbets records proof and reminders, but the actual transfer still happens in Venmo, PayPal, Cash App, or Zelle.',
  },
] as const

const relationshipSteps = [
  'Start with a napkin.',
  'Choose simple bet for one-on-one or pool for a group.',
  'Attach an event if one exists, or keep it custom.',
  'Add friends or pick a group.',
  'Lock the sides and the stake.',
  'Track the result, then record settle-up proof.',
] as const

useSeo({
  title: 'Guide',
  description: 'A simple guide to what a napkin is, how simple bets and pools differ, and how the main objects fit together.',
  image: '/brand/og/home.webp',
})

useWebPageSchema({
  name: 'Napkinbets Guide',
  description: 'A knowledge base for Napkinbets concepts, terms, and object relationships.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Guide</p>
        <h1 class="napkinbets-section-title">How the product is organized in plain English.</h1>
        <p class="napkinbets-hero-lede">
          The app got too abstract. This is the compact map of what each term means and how they fit together.
        </p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-1">
            <p class="napkinbets-kicker">Fast mental model</p>
            <h2 class="napkinbets-subsection-title">The hierarchy</h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="(step, index) in relationshipSteps"
              :key="step"
              class="napkinbets-surface flex items-start gap-3"
            >
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {{ index + 1 }}
              </div>
              <p class="text-sm leading-6 text-default">{{ step }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-2">
        <UCard
          v-for="card in termCards"
          :key="card.term"
          class="napkinbets-panel"
        >
          <div class="space-y-2">
            <p class="napkinbets-kicker">{{ card.term }}</p>
            <p class="text-sm leading-6 text-default">{{ card.summary }}</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

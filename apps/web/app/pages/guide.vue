<script setup lang="ts">
const termCards = [
  {
    term: 'Event',
    summary:
      'The real-world game, round, or matchup. This should be the first thing you pick whenever it exists.',
  },
  {
    term: 'Bet',
    summary:
      'The thing you create from an event. It holds the people, the side, the stake, the status, and the settle-up record.',
  },
  {
    term: 'One-on-one bet',
    summary: 'The default. One stake, one opponent, and one clear side.',
  },
  {
    term: 'Group bet',
    summary: 'Use this only when there are several people or several outcomes to track.',
  },
  {
    term: 'Friend',
    summary: 'Someone you bet with often. Save them once so one-on-one bets are faster next time.',
  },
  {
    term: 'Group',
    summary:
      'A recurring room of people. It gives a group bet a home before anyone starts picking sides.',
  },
  {
    term: 'Side',
    summary: 'One possible outcome on the bet, like Celtics, Lakers, Yes, or No.',
  },
  {
    term: 'Settle-up',
    summary:
      'The last step. Napkinbets records proof and reminders, but the actual transfer still happens in Venmo, PayPal, Cash App, or Zelle.',
  },
  {
    term: 'Napkin',
    summary:
      'Mostly an internal Napkinbets word for the shared bet page. If you see it in a URL or older screen, just read it as bet.',
  },
] as const

const relationshipSteps = [
  'Pick an event first whenever one exists.',
  'Create a bet from that event.',
  'Choose one-on-one by default, or group bet if several people are involved.',
  'Add friends or pick a group.',
  'Lock the sides and the stake.',
  'Track the result, then record settle-up proof.',
] as const

useSeo({
  title: 'Help',
  description:
    'A simple guide to events, bets, one-on-one bets, group bets, and how the main objects fit together.',
  ogImage: {
    title: 'How Napkinbets works',
    description: 'Events, bets, settle-up — in plain English.',
    icon: '📘',
  },
})

useWebPageSchema({
  name: 'Napkinbets Help',
  description: 'A knowledge base for Napkinbets concepts, terms, and object relationships.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Help</p>
        <h1 class="napkinbets-section-title">How the product works in plain English.</h1>
        <p class="napkinbets-hero-lede">
          The app got too abstract. This is the compact map of what each word means and which ones
          you can safely ignore.
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
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              >
                {{ index + 1 }}
              </div>
              <p class="text-sm leading-6 text-default">{{ step }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid gap-4 sm:grid-cols-2">
        <UCard v-for="card in termCards" :key="card.term" class="napkinbets-panel">
          <div class="space-y-2">
            <p class="napkinbets-kicker">{{ card.term }}</p>
            <p class="text-sm leading-6 text-default">{{ card.summary }}</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

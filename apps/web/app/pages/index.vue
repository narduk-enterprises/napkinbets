<script setup lang="ts">
import {
  buildNapkinbetsTemplateCreateQuery,
  getNapkinbetsFeaturedTemplates,
  getNapkinbetsGolfTemplates,
} from '../utils/napkinbets-game-templates'

definePageMeta({
  middleware: ['guest'],
})

const { isAuthenticated } = useNapkinbetsNavLinks()
const discoverState = await useNapkinbetsDiscover()
const workspaceState = isAuthenticated.value
  ? useNapkinbetsWorkspace({
      server: false,
      lazy: true,
    })
  : null

const discover = computed(() => discoverState.data.value)
const workspace = computed(() => workspaceState?.data.value ?? null)
const workspaceGameCount = computed(
  () => (workspace.value?.ownedWagers.length ?? 0) + (workspace.value?.joinedWagers.length ?? 0),
)
const actionRequiredGames = computed(() => {
  if (!workspace.value) {
    return []
  }

  return [
    ...workspace.value.invitedWagers,
    ...workspace.value.ownedWagers,
    ...workspace.value.joinedWagers,
  ]
    .filter((game) => ['open', 'locked', 'live', 'calling', 'settling'].includes(game.status))
    .slice(0, 2)
})
const featuredSpotlight = computed(() => discover.value.spotlights[0] ?? null)
const featuredTemplates = getNapkinbetsFeaturedTemplates().slice(0, 3)
const golfTemplates = getNapkinbetsGolfTemplates()
  .filter((template) => template.support === 'ready-now')
  .slice(0, 3)
const openingEvents = computed(() =>
  discover.value.sections
    .flatMap((section) => section.events)
    .slice(0, isAuthenticated.value ? 4 : 3),
)

const howItWorksSteps = [
  {
    step: '1',
    title: 'Choose a format',
    description: 'Start from a reusable template instead of inventing the structure from scratch.',
  },
  {
    step: '2',
    title: 'Attach the event or customize the room',
    description:
      'Use live sports context when it helps, or keep it manual for watch-party and side-action formats.',
  },
  {
    step: '3',
    title: 'Invite, track, and settle',
    description:
      'Keep picks, standings, and manual settle-up in one place instead of across group chat and payment app screenshots.',
  },
] as const

const groupBenefits = [
  {
    title: 'Easier than spreadsheets',
    description:
      'Templates, standings, and payout logic stay attached to the game instead of a one-off sheet.',
  },
  {
    title: 'Cleaner than group chat chaos',
    description:
      'People can see the rules, picks, and closeout state without asking for the latest screenshot.',
  },
  {
    title: 'Built for repeat play',
    description:
      'Groups, golf rooms, and weekly pools can keep coming back to the same product loop.',
  },
] as const

const faqItems = [
  {
    question: 'Is Napkin Bets a sportsbook?',
    answer:
      'No. Napkin Bets is for casual social games and pools. It organizes picks, standings, and settlement proof, but it does not process money.',
  },
  {
    question: 'What kinds of games can I run here?',
    answer:
      'The strongest formats today are head-to-head challenges, winner pools, event prediction pools, golf winner pools, golf major challenges, and flexible side games.',
  },
  {
    question: 'Why start from templates?',
    answer:
      'Templates keep the rules clear, make setup faster, and give the product one repeatable structure across sports, events, and group types.',
  },
  {
    question: 'How does settlement work?',
    answer:
      'The group still pays through Venmo, PayPal, Cash App, Zelle, or another off-platform route. Napkin Bets only tracks who submitted proof and who confirmed it.',
  },
] as const

useSeo({
  title: 'Casual social pools, picks, and side games',
  description:
    'Run winner pools, golf challenges, event prediction pools, and social side games without the usual spreadsheet and group-chat mess.',
  image: '/brand/og/home.webp',
  keywords: [
    'casual sports pool app',
    'social betting games',
    'golf pool app',
    'event prediction pool',
    'office pick pool',
  ],
  ogImage: {
    title: 'Start a pool or side game people actually want to join.',
    description:
      'Templates first. Events when you need them. Standings and settle-up in one place.',
    icon: '🏁',
  },
})

useWebPageSchema({
  name: 'Napkin Bets',
  description:
    'A template-first platform for casual social pools, picks, golf formats, and event-based side games.',
  type: 'WebPage',
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
      <div class="napkinbets-hero-grid">
        <div class="space-y-5">
          <div class="space-y-3">
            <p class="napkinbets-kicker">Napkin Bets</p>
            <h1 class="napkinbets-hero-title">
              Start a simple pool, side game, or golf challenge people actually want to join.
            </h1>
            <p class="napkinbets-hero-lede">
              Napkin Bets is a template-first home for casual social competition. Run winner pools,
              event prediction games, golf formats, and side-action challenges without turning the
              experience into a sportsbook.
            </p>
          </div>

          <div class="napkinbets-hero-actions">
            <UButton to="/templates" size="lg" color="primary" icon="i-lucide-layout-template">
              Browse templates
            </UButton>
            <UButton to="/events" size="lg" color="neutral" variant="soft" icon="i-lucide-radar">
              Browse events
            </UButton>
            <UButton
              :to="isAuthenticated ? '/dashboard' : '/demo'"
              size="lg"
              color="neutral"
              variant="ghost"
              icon="i-lucide-zap"
            >
              {{ isAuthenticated ? 'Open dashboard' : 'Open demo' }}
            </UButton>
          </div>

          <div class="napkinbets-hero-pills">
            <span class="napkinbets-hero-pill">Templates first</span>
            <span class="napkinbets-hero-pill">Groups and standings</span>
            <span class="napkinbets-hero-pill">Manual settle-up</span>
          </div>
        </div>

        <div class="napkinbets-hero-stack">
          <UCard class="napkinbets-panel">
            <div class="space-y-3">
              <p class="napkinbets-kicker">Why it works</p>
              <p class="napkinbets-surface-value">{{ isAuthenticated ? workspaceGameCount : 6 }}</p>
              <p class="napkinbets-support-copy">
                {{
                  isAuthenticated
                    ? 'Active games, invites, and standings are easier to revisit when everything lives in one workspace.'
                    : 'Strong default formats make Napkin Bets easier to understand than a blank bet builder.'
                }}
              </p>
            </div>
          </UCard>

          <NapkinbetsSpotlightCard v-if="featuredSpotlight" :spotlight="featuredSpotlight" />
        </div>
      </div>
    </div>

    <UAlert
      v-if="discoverState.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Home feed failed to load"
      :description="discoverState.error.value?.message || 'Please refresh and try again.'"
    />

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">How it works</p>
        <h2 class="napkinbets-section-title">Structured social competition in three steps.</h2>
      </div>

      <div class="napkinbets-process-list">
        <div v-for="item in howItWorksSteps" :key="item.title" class="napkinbets-process-item">
          <div class="napkinbets-process-step">{{ item.step }}</div>
          <div class="space-y-1">
            <p class="font-semibold text-default">{{ item.title }}</p>
            <p class="text-sm text-muted">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Popular formats</p>
          <h2 class="napkinbets-section-title">Start from the formats that carry the product.</h2>
        </div>
        <UButton to="/templates" color="neutral" variant="soft" icon="i-lucide-arrow-right">
          All templates
        </UButton>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <NapkinbetsTemplateCard
          v-for="template in featuredTemplates"
          :key="template.key"
          :template="template"
          :to="buildTemplateLink(template.key)"
          cta-label="Use this format"
        />
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">Golf first-class</p>
          <h2 class="napkinbets-section-title">Golf pools should feel native here.</h2>
        </div>
        <UButton to="/golf-pools" color="neutral" variant="soft" icon="i-lucide-arrow-right">
          Golf formats
        </UButton>
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
        <p class="napkinbets-kicker">Why groups use it</p>
        <h2 class="napkinbets-section-title">
          More structured than chat, lighter than a sportsbook.
        </h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard v-for="benefit in groupBenefits" :key="benefit.title" class="napkinbets-panel">
          <div class="space-y-2">
            <h3 class="napkinbets-subsection-title">{{ benefit.title }}</h3>
            <p class="napkinbets-support-copy">{{ benefit.description }}</p>
          </div>
        </UCard>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="flex items-end justify-between gap-3">
        <div class="space-y-1">
          <p class="napkinbets-kicker">See the product</p>
          <h2 class="napkinbets-section-title">
            Standings, context, and closeout live in one place.
          </h2>
        </div>
        <UButton
          :to="isAuthenticated ? '/dashboard' : '/demo'"
          color="primary"
          icon="i-lucide-layout-dashboard"
        >
          {{ isAuthenticated ? 'My games' : 'Open demo' }}
        </UButton>
      </div>

      <div v-if="actionRequiredGames.length" class="grid gap-4 xl:grid-cols-2">
        <NapkinbetsNapkinSummaryCard
          v-for="game in actionRequiredGames"
          :key="game.id"
          :wager="game"
          :role="workspace?.ownedWagers.some((item) => item.id === game.id) ? 'owner' : 'player'"
        />
      </div>

      <div v-else-if="openingEvents.length" class="napkinbets-scroll-strip">
        <NapkinbetsEventCard v-for="event in openingEvents" :key="event.id" :event="event" />
      </div>

      <UAlert
        v-else
        color="info"
        variant="soft"
        icon="i-lucide-radar"
        title="The live schedule is quiet right now"
        description="Templates still give you a clear place to start while the next event window loads."
      />
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">Start here</p>
        <h2 class="napkinbets-section-title">Pick the route that fits your group.</h2>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Template-first</h3>
            <p class="napkinbets-support-copy">
              Best when you already know the kind of pool or side game you want to run.
            </p>
            <UButton to="/templates" color="primary" icon="i-lucide-layout-template">
              Browse templates
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">Event-first</h3>
            <p class="napkinbets-support-copy">
              Best when you want live sports context to anchor a winner pool or golf challenge.
            </p>
            <UButton to="/events" color="neutral" variant="soft" icon="i-lucide-radar">
              Browse events
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-3">
            <h3 class="napkinbets-subsection-title">See the real flow</h3>
            <p class="napkinbets-support-copy">
              Open the demo to see active groups, standings, settlement, and golf examples.
            </p>
            <UButton to="/demo" color="neutral" variant="soft" icon="i-lucide-zap">
              Open demo
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <div class="napkinbets-section-stack">
      <div class="space-y-1">
        <p class="napkinbets-kicker">FAQ</p>
        <h2 class="napkinbets-section-title">A few things people ask right away.</h2>
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

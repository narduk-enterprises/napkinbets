/**
 * Demo seed data — only used during development / demo provisioning.
 * Extracted from pools.ts for maintainability (no runtime production callers).
 */
import type { H3Event } from 'h3'
import { and, asc, eq, gte, inArray, isNull } from 'drizzle-orm'
import {
  napkinbetsEvents,
  napkinbetsGroups,
  napkinbetsNotifications,
  napkinbetsParticipants,
  napkinbetsPicks,
  napkinbetsPots,
  napkinbetsSettlements,
  napkinbetsWagers,
} from '#server/database/schema'
import { users } from '#layer/server/database/schema'
import { hashUserPassword } from '#layer/server/utils/password'
import { ensureDemoSocialGraph } from '#server/services/napkinbets/social'
import { useAppDatabase } from '#server/utils/database'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type AppDatabase = ReturnType<typeof useAppDatabase>

function nowIso() {
  return new Date().toISOString()
}

function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value)
}

// ---------------------------------------------------------------------------
// Demo constants
// ---------------------------------------------------------------------------

const _CONCEPT = {
  summary:
    'Napkinbets turns group texts, watch parties, and golf drafts into lightweight wager boards where friends can agree on terms, track picks, and settle manually through the payment app they already use.',
  featureRequirements: [
    'Create friendly wagers for arbitrary events, including sports games, custom props, and golf-style drafts.',
    'Invite participants, capture sides and draft order, and keep stake terms visible in one place.',
    'Track outcomes with live sports scores and venue weather where it adds context.',
    'Support multiple pots, entry fees, payout splits, and a simple leaderboard.',
    'Persist pool state in D1 with save, load, and clear operations that mirror the Google Apps Script prototype.',
    'Queue in-app reminders for bet acceptance, payment follow-up, and results-ready notifications.',
    'Keep settlements manual by recording Venmo, PayPal, or Cash App confirmations instead of processing money directly.',
  ],
  architectureSuggestions: [
    'Nuxt 4 + Nuxt UI 4 on Cloudflare Workers for the product shell and interaction model.',
    'Cloudflare D1 + Drizzle ORM for wager state, picks, reminders, and settlement history.',
    'ESPN scoreboard endpoints for live sports context and Open-Meteo for weather snapshots.',
    'Thin page components backed by composables and app/services fetch wrappers for SSR-safe data flow.',
  ],
  implementationPlan: [
    'Stand up the home dashboard, create-wager flow, and seeded example boards first.',
    'Back the UI with typed D1 tables and mutation endpoints for joins, picks, reminders, and settlements.',
    'Add live data adapters for ESPN and weather, then auto-refresh the dashboard on a short interval.',
    'Round out the prototype with a shareable concept brief, compliance copy, and smoke coverage.',
  ],
  compliance: [
    'Napkinbets is for friendly wagers only.',
    'Users are responsible for complying with local laws before using the product.',
    'The prototype must not automate gambling transactions or move money directly.',
  ],
}

const DEMO_POOL_SLUGS = [
  'demo-hoops-night',
  'demo-soccer-watch',
  'demo-golf-draft',
  'demo-wager-settled',
  'demo-wager-submitted',
  'demo-wager-rejected',
  'demo-wager-locked',
  'demo-wager-live',
  'demo-simple-bet',
  'demo-golf-pga-locked',
  'demo-golf-lpga-open',
]
/** Slug for E2E join flow: pool wager owned by layer user (Pat), demo user is not a participant. */
export const DEMO_JOIN_POOL_SLUG = 'demo-join-pool'
/** Slug for E2E invitation flow: demo user is participant with joinStatus pending. */
export const DEMO_INVITATION_SLUG = 'demo-invitation'
/** Demo group slug (Friday Night Watch) — seed assigns some pools to this group. */
const DEMO_GROUP_SLUG = 'friday-night-watch'
/** Pool slugs that appear under the demo group on the group detail page. */
const DEMO_GROUP_POOL_SLUGS = ['demo-hoops-night', 'demo-soccer-watch', 'demo-golf-draft']
/** Augusta Text Chain group slug — extended seed attaches golf pools here. */
const DEMO_AUGUSTA_GROUP_SLUG = 'augusta-text-chain'
/** Pool slugs attached to Augusta Text Chain (golf-focused group). */
const DEMO_AUGUSTA_POOL_SLUGS = ['demo-golf-pga-locked', 'demo-golf-lpga-open']
const DEMO_USER_EMAIL = 'demo@napkinbets.app'
const DEMO_USER_PASSWORD = 'DemoBoard123!'
const DEMO_USER_NAME = 'Demo Host'
const DEMO_AVATAR_URLS = {
  demoHost:
    'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80',
  olivia:
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
  kai: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80',
  saoirse:
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
  marcus:
    'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=200&q=80',
  nora: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  leo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
  mara: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  jonah:
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80',
  ava: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80',
}

// ---------------------------------------------------------------------------
// Demo interface types
// ---------------------------------------------------------------------------

interface DemoEventRow {
  id: string
  sport: string
  league: string
  eventTitle: string
  startTime: string
  status: string
  shortStatus: string
  venueName: string
}

interface DemoParticipantDef {
  displayName: string
  sideLabel: string
  joinStatus: string
  draftOrder: number
  paymentStatus: string
  paymentReference?: string | null
  avatarUrl: string
  useDemoUser?: boolean
}

interface DemoPickDef {
  participantIndex: number
  pickLabel: string
  pickType: string
  pickValue: string
  confidence: number
  liveScore: number
  outcome: string
  sortOrder?: number
}

interface DemoSettlementDef {
  participantIndex: number
  amountCents: number
  method: string
  handle: string
  confirmationCode?: string | null
  note: string
  verificationStatus: string
  proofImageUrl?: string | null
  rejectedByUserId?: string | null
  rejectedAt?: string | null
  rejectionNote?: string | null
}

interface DemoNotificationDef {
  participantIndex: number
  kind: string
  title: string
  body: string
}

interface DemoPoolDef {
  slug: string
  title: string
  description: string
  category: string
  format: string
  sport: string
  league: string
  contextKey: string
  customContextName: string
  status: string
  creatorName: string
  sideOptions: string[]
  entryFeeCents: number
  paymentService: string
  paymentHandle: string
  terms: string
  venueName: string
  latitude: string
  longitude: string
  eventFallbackTitle: string
  manualHomeTeam: string
  manualAwayTeam: string
  participants: DemoParticipantDef[]
  pots: Array<{ label: string; amountCents: number; sortOrder: number }>
  picks?: DemoPickDef[]
  settlements?: DemoSettlementDef[]
  notifications?: DemoNotificationDef[]
  eventSource?: string
  eventRow?: DemoEventRow
  /** For state-coverage pools: explicit event state (pre/in/post). */
  eventState?: string
  /** Default 'pool'. Use 'simple-bet' for 1v1 napkin. */
  napkinType?: 'pool' | 'simple-bet'
}

// ---------------------------------------------------------------------------
// Demo helpers
// ---------------------------------------------------------------------------

async function ensureDemoUser(db: AppDatabase) {
  const normalizedEmail = DEMO_USER_EMAIL.toLowerCase()
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (existing) {
    return existing
  }

  const hashedPassword = await hashUserPassword(DEMO_USER_PASSWORD)
  const id = crypto.randomUUID()

  await db.insert(users).values({
    id,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    name: DEMO_USER_NAME,
    isAdmin: false,
  })

  return {
    id,
    email: normalizedEmail,
    name: DEMO_USER_NAME,
    isAdmin: false,
  }
}

async function loadUpcomingEventRows(db: AppDatabase, cutoff: string): Promise<DemoEventRow[]> {
  return db
    .select({
      id: napkinbetsEvents.id,
      sport: napkinbetsEvents.sport,
      league: napkinbetsEvents.league,
      eventTitle: napkinbetsEvents.eventTitle,
      startTime: napkinbetsEvents.startTime,
      status: napkinbetsEvents.status,
      shortStatus: napkinbetsEvents.shortStatus,
      venueName: napkinbetsEvents.venueName,
    })
    .from(napkinbetsEvents)
    .where(gte(napkinbetsEvents.startTime, cutoff))
    .orderBy(asc(napkinbetsEvents.startTime))
    .limit(2)
}

function buildDemoPools(events: DemoEventRow[]): DemoPoolDef[] {
  const [primaryEvent, secondaryEvent] = events

  return [
    {
      slug: 'demo-hoops-night',
      title: 'Friday Hoops Group Bet',
      description: primaryEvent
        ? `Sample group bet built from ${primaryEvent.eventTitle}.`
        : 'Sample group bet built around tonight\u2019s featured game.',
      category: 'basketball',
      format: 'sports-game',
      sport: 'basketball',
      league: 'nba',
      contextKey: 'event',
      customContextName: 'Court-side watch room',
      status: primaryEvent?.status === 'in' ? 'live' : 'open',
      creatorName: DEMO_USER_NAME,
      sideOptions: ['Home team moneyline', 'Over 45.5 points', 'First to 25 points'],
      entryFeeCents: 2500,
      paymentService: 'Venmo',
      paymentHandle: '@DemoHost',
      terms: 'Friendly wagers only; settle through Venmo once the final buzzer blows.',
      venueName: primaryEvent?.venueName ?? 'Rooftop watch room',
      latitude: '40.7128',
      longitude: '-74.0060',
      eventFallbackTitle: 'Hoops Night Rally',
      manualHomeTeam: 'Home crew',
      manualAwayTeam: 'Guest crew',
      participants: [
        {
          displayName: 'Demo Host',
          sideLabel: 'Host pick',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'confirmed',
          paymentReference: 'VENMO-DEMO-001',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Olivia Ramos',
          sideLabel: 'Home team spread',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'confirmed',
          paymentReference: 'VENMO-OLIVIA-307',
          avatarUrl: DEMO_AVATAR_URLS.olivia,
        },
        {
          displayName: 'Kai Montgomery',
          sideLabel: 'Over 45.5 points',
          joinStatus: 'accepted',
          draftOrder: 3,
          paymentStatus: 'confirmed',
          paymentReference: 'VENMO-KAI-711',
          avatarUrl: DEMO_AVATAR_URLS.kai,
        },
        {
          displayName: 'Saoirse Vega',
          sideLabel: 'First to 25 points',
          joinStatus: 'pending',
          draftOrder: 4,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.saoirse,
        },
      ],
      pots: [
        { label: 'Winner takes all', amountCents: 4000, sortOrder: 0 },
        { label: 'Prop bonus', amountCents: 3000, sortOrder: 1 },
        { label: 'Late hedge', amountCents: 3000, sortOrder: 2 },
      ],
      picks: [
        {
          participantIndex: 1,
          pickLabel: 'Home team moneyline',
          pickType: 'team',
          pickValue: 'home',
          confidence: 5,
          liveScore: 10,
          outcome: 'winning',
          sortOrder: 0,
        },
        {
          participantIndex: 2,
          pickLabel: 'Over 45.5 points',
          pickType: 'prop',
          pickValue: 'Over 45.5',
          confidence: 3,
          liveScore: 6,
          outcome: 'pending',
          sortOrder: 1,
        },
        {
          participantIndex: 3,
          pickLabel: 'First to 25 points',
          pickType: 'custom',
          pickValue: 'Home',
          confidence: 2,
          liveScore: 4,
          outcome: 'pending',
          sortOrder: 2,
        },
      ],
      settlements: [
        {
          participantIndex: 0,
          amountCents: 2500,
          method: 'Venmo',
          handle: '@DemoHost',
          confirmationCode: 'VENMO-DEMO-001',
          note: 'Entry posted before tip-off.',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
      ],
      notifications: [
        {
          participantIndex: 3,
          kind: 'acceptance',
          title: 'Saoirse is still pending',
          body: 'Send a nudge before the second half.',
        },
      ],
      eventRow: primaryEvent,
      eventSource: primaryEvent ? 'espn' : 'manual',
    },
    {
      slug: 'demo-soccer-watch',
      title: 'Soccer Props Group Bet',
      description: secondaryEvent
        ? `Sample prop bet built from ${secondaryEvent.eventTitle}.`
        : 'Sample prop bet built around a featured soccer match.',
      category: 'soccer',
      format: 'sports-prop',
      sport: 'soccer',
      league: 'mls',
      contextKey: 'prop',
      customContextName: 'Turf watch lounge',
      status: secondaryEvent?.status === 'in' ? 'live' : 'open',
      creatorName: DEMO_USER_NAME,
      sideOptions: ['First goal scorer', 'Total goals over 2.5', 'Clean sheet for home'],
      entryFeeCents: 2000,
      paymentService: 'PayPal',
      paymentHandle: 'demo-watch@example.com',
      terms:
        'Prop bets like first goal and total goals stay logged here ahead of manual settlements.',
      venueName: secondaryEvent?.venueName ?? 'Turf watch lounge',
      latitude: '51.5074',
      longitude: '-0.1278',
      eventFallbackTitle: 'Friday Soccer Props',
      manualHomeTeam: 'Roosevelt FC',
      manualAwayTeam: 'Coastline City',
      participants: [
        {
          displayName: 'Demo Host',
          sideLabel: 'Host prop',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'confirmed',
          paymentReference: 'PAYPAL-DEMO-102',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Marcus Lee',
          sideLabel: 'First goal scorer',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'confirmed',
          paymentReference: 'PAYPAL-MARCUS-214',
          avatarUrl: DEMO_AVATAR_URLS.marcus,
        },
        {
          displayName: 'Nora Patel',
          sideLabel: 'Clean sheet',
          joinStatus: 'accepted',
          draftOrder: 3,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.nora,
        },
        {
          displayName: 'Leo Ortega',
          sideLabel: 'Over 2.5 goals',
          joinStatus: 'pending',
          draftOrder: 4,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.leo,
        },
      ],
      pots: [
        { label: 'Winner takes all', amountCents: 4000, sortOrder: 0 },
        { label: 'Prop split', amountCents: 2500, sortOrder: 1 },
        { label: 'Late cover', amountCents: 1500, sortOrder: 2 },
      ],
      picks: [
        {
          participantIndex: 1,
          pickLabel: 'First goal scorer',
          pickType: 'prop',
          pickValue: 'Striker',
          confidence: 4,
          liveScore: 7,
          outcome: 'pending',
          sortOrder: 0,
        },
        {
          participantIndex: 2,
          pickLabel: 'Clean sheet for home',
          pickType: 'prop',
          pickValue: 'Home',
          confidence: 3,
          liveScore: 5,
          outcome: 'pending',
          sortOrder: 1,
        },
      ],
      settlements: [
        {
          participantIndex: 0,
          amountCents: 2000,
          method: 'PayPal',
          handle: 'demo-watch@example.com',
          confirmationCode: 'PAYPAL-DEMO-102',
          note: 'Prop confirmed before kickoff.',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
      ],
      notifications: [
        {
          participantIndex: 3,
          kind: 'reminder',
          title: 'Leo still owes entry',
          body: 'Friendly reminder before kickoff.',
        },
      ],
      eventRow: secondaryEvent,
      eventSource: secondaryEvent ? 'espn' : 'manual',
    },
    {
      slug: 'demo-golf-draft',
      title: 'Weekend Golf Draft',
      description: 'Sample golf draft with leaderboards and payout splits.',
      category: 'golf',
      format: 'golf-draft',
      sport: 'golf',
      league: 'pga',
      contextKey: 'tournament',
      customContextName: 'Spring Tee Party',
      status: 'open',
      creatorName: DEMO_USER_NAME,
      sideOptions: ['Lowest round', 'Closest-to-pin bonus', 'Birdie streak'],
      entryFeeCents: 1500,
      paymentService: 'Cash App',
      paymentHandle: '$DemoHost',
      terms:
        'Draft entries and pot splits stay in Napkinbets while transfers happen after the final round.',
      venueName: 'Back patio range',
      latitude: '33.5037',
      longitude: '-82.0209',
      eventFallbackTitle: 'Napkin Greens Draft',
      manualHomeTeam: 'Selected field',
      manualAwayTeam: 'Practice crew',
      participants: [
        {
          displayName: 'Demo Host',
          sideLabel: 'Lowest round',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'confirmed',
          paymentReference: 'CASH-DEMO-305',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Mara Kim',
          sideLabel: 'Closest-to-pin bonus',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'confirmed',
          paymentReference: 'CASH-MARA-812',
          avatarUrl: DEMO_AVATAR_URLS.mara,
        },
        {
          displayName: 'Jonah Miles',
          sideLabel: 'Birdie streak',
          joinStatus: 'accepted',
          draftOrder: 3,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.jonah,
        },
        {
          displayName: 'Ava Bennett',
          sideLabel: 'Dark horse low round',
          joinStatus: 'pending',
          draftOrder: 4,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.ava,
        },
      ],
      pots: [
        { label: 'Draft winner', amountCents: 3000, sortOrder: 0 },
        { label: 'Low round', amountCents: 2000, sortOrder: 1 },
        { label: 'Closest pin', amountCents: 1000, sortOrder: 2 },
      ],
      picks: [
        {
          participantIndex: 0,
          pickLabel: 'Scheffler anchor',
          pickType: 'golfer',
          pickValue: 'Scottie Scheffler',
          confidence: 5,
          liveScore: 12,
          outcome: 'pending',
          sortOrder: 0,
        },
        {
          participantIndex: 2,
          pickLabel: 'Hovland birdie run',
          pickType: 'golfer',
          pickValue: 'Viktor Hovland',
          confidence: 4,
          liveScore: 9,
          outcome: 'pending',
          sortOrder: 1,
        },
      ],
      settlements: [
        {
          participantIndex: 0,
          amountCents: 1500,
          method: 'Cash App',
          handle: '$DemoHost',
          confirmationCode: 'CASH-DEMO-305',
          note: 'Entry locked in after draft.',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
      ],
      notifications: [
        {
          participantIndex: 3,
          kind: 'results',
          title: 'Leaderboard ready for Ava',
          body: 'Results drop after the next refresh, so hold tight.',
        },
      ],
      eventSource: 'manual',
    },
  ]
}

/** State-coverage pools for E2E and visual regression (demo user owns all). */
function buildDemoStatePools(): DemoPoolDef[] {
  const base = {
    category: 'basketball',
    format: 'sports-game',
    sport: 'basketball',
    league: 'nba',
    contextKey: 'event',
    customContextName: 'E2E state coverage',
    creatorName: DEMO_USER_NAME,
    sideOptions: ['Home', 'Away'],
    entryFeeCents: 1000,
    paymentService: 'Venmo',
    paymentHandle: '@DemoHost',
    terms: 'Friendly wagers only.',
    venueName: 'Test arena',
    latitude: '40.7128',
    longitude: '-74.0060',
    eventFallbackTitle: 'State coverage game',
    manualHomeTeam: 'Home',
    manualAwayTeam: 'Away',
    participants: [
      {
        displayName: DEMO_USER_NAME,
        sideLabel: 'Home',
        joinStatus: 'accepted',
        draftOrder: 1,
        paymentStatus: 'confirmed',
        paymentReference: 'VENMO-DEMO',
        avatarUrl: DEMO_AVATAR_URLS.demoHost,
        useDemoUser: true,
      },
      {
        displayName: 'Other Player',
        sideLabel: 'Away',
        joinStatus: 'accepted',
        draftOrder: 2,
        paymentStatus: 'confirmed',
        paymentReference: 'VENMO-OTHER',
        avatarUrl: DEMO_AVATAR_URLS.olivia,
      },
    ],
    pots: [{ label: 'Winner', amountCents: 2000, sortOrder: 0 }],
    picks: [
      {
        participantIndex: 0,
        pickLabel: 'Home',
        pickType: 'team',
        pickValue: 'Home',
        confidence: 5,
        liveScore: 10,
        outcome: 'won',
        sortOrder: 0,
      },
      {
        participantIndex: 1,
        pickLabel: 'Away',
        pickType: 'team',
        pickValue: 'Away',
        confidence: 3,
        liveScore: 6,
        outcome: 'lost',
        sortOrder: 1,
      },
    ],
  }

  return [
    {
      ...base,
      slug: 'demo-wager-settled',
      title: 'Demo Wager Settled',
      description: 'E2E: all settled, all confirmed.',
      status: 'settled',
      eventState: 'post',
      settlements: [
        {
          participantIndex: 0,
          amountCents: 1000,
          method: 'Venmo',
          handle: '@DemoHost',
          confirmationCode: 'VNM-001',
          note: 'Paid',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
        {
          participantIndex: 1,
          amountCents: 1000,
          method: 'Venmo',
          handle: '@Other',
          confirmationCode: 'VNM-002',
          note: 'Paid',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-2.png',
        },
      ],
    },
    {
      ...base,
      slug: 'demo-wager-submitted',
      title: 'Demo Wager Submitted',
      description: 'E2E: settling, one settlement submitted.',
      status: 'settling',
      eventState: 'post',
      settlements: [
        {
          participantIndex: 0,
          amountCents: 1000,
          method: 'Venmo',
          handle: '@DemoHost',
          confirmationCode: 'VNM-003',
          note: 'Paid',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
        {
          participantIndex: 1,
          amountCents: 1000,
          method: 'Venmo',
          handle: '@Other',
          confirmationCode: 'VNM-004',
          note: 'Sent',
          verificationStatus: 'submitted',
          proofImageUrl: 'seed/venmo-2.png',
        },
      ],
    },
    {
      ...base,
      slug: 'demo-wager-rejected',
      title: 'Demo Wager Rejected',
      description: 'E2E: settling, one settlement rejected.',
      status: 'settling',
      eventState: 'post',
      participants: [
        { ...base.participants[0]! },
        { ...base.participants[1]!, paymentStatus: 'pending' as const },
      ],
      settlements: [
        {
          participantIndex: 1,
          amountCents: 1000,
          method: 'Venmo',
          handle: '@Other',
          confirmationCode: 'VNM-005',
          note: 'Sent wrong amount',
          verificationStatus: 'rejected',
          proofImageUrl: 'seed/venmo-rejected.png',
          rejectedByUserId: null,
          rejectedAt: new Date().toISOString(),
          rejectionNote: 'Wrong amount — please resend.',
        },
      ],
    },
    {
      ...base,
      slug: 'demo-wager-locked',
      title: 'Demo Wager Locked',
      description: 'E2E: locked, pregame.',
      status: 'locked',
      eventState: 'pre',
      picks: [
        {
          participantIndex: 0,
          pickLabel: 'Home',
          pickType: 'team',
          pickValue: 'Home',
          confidence: 5,
          liveScore: 0,
          outcome: 'pending',
          sortOrder: 0,
        },
        {
          participantIndex: 1,
          pickLabel: 'Away',
          pickType: 'team',
          pickValue: 'Away',
          confidence: 3,
          liveScore: 0,
          outcome: 'pending',
          sortOrder: 1,
        },
      ],
      settlements: [],
    },
    {
      ...base,
      slug: 'demo-wager-live',
      title: 'Demo Wager Live',
      description: 'E2E: live, game in progress.',
      status: 'live',
      eventState: 'in',
      picks: [
        {
          participantIndex: 0,
          pickLabel: 'Home',
          pickType: 'team',
          pickValue: 'Home',
          confidence: 5,
          liveScore: 12,
          outcome: 'winning',
          sortOrder: 0,
        },
        {
          participantIndex: 1,
          pickLabel: 'Away',
          pickType: 'team',
          pickValue: 'Away',
          confidence: 3,
          liveScore: 8,
          outcome: 'pending',
          sortOrder: 1,
        },
      ],
      settlements: [],
    },
    {
      ...base,
      slug: 'demo-simple-bet',
      title: 'Demo Simple Bet',
      description: 'E2E: 1v1 simple-bet; no draft order or leaderboard.',
      status: 'open',
      eventState: 'pre',
      napkinType: 'simple-bet',
      participants: [
        {
          displayName: DEMO_USER_NAME,
          sideLabel: 'Home',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Opponent',
          sideLabel: 'Away',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.olivia,
        },
      ],
      picks: [],
      settlements: [],
    },
  ]
}

/** Extended golf seed: PGA locked, LPGA open; attached to Augusta Text Chain. */
function buildGolfSeedPools(): DemoPoolDef[] {
  return [
    {
      slug: 'demo-golf-pga-locked',
      title: 'PGA Weekend Locked',
      description: 'Golf draft locked before round; golfer picks in, settlements partial.',
      category: 'golf',
      format: 'golf-draft',
      sport: 'golf',
      league: 'pga',
      contextKey: 'tournament',
      customContextName: 'Augusta side pot',
      status: 'locked',
      eventState: 'pre',
      creatorName: DEMO_USER_NAME,
      sideOptions: ['Lowest round', 'Closest-to-pin', 'Birdie streak'],
      entryFeeCents: 2000,
      paymentService: 'Venmo',
      paymentHandle: '@DemoHost',
      terms: 'Settle via Venmo after final round.',
      venueName: 'Patio range',
      latitude: '33.5037',
      longitude: '-82.0209',
      eventFallbackTitle: 'PGA Weekend Locked',
      manualHomeTeam: 'Field',
      manualAwayTeam: 'N/A',
      participants: [
        {
          displayName: 'Demo Host',
          sideLabel: 'Lowest round',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'confirmed',
          paymentReference: 'VENMO-PGA-001',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Mara Kim',
          sideLabel: 'Closest-to-pin',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'submitted',
          paymentReference: 'VENMO-MARA-002',
          avatarUrl: DEMO_AVATAR_URLS.mara,
        },
        {
          displayName: 'Leo Ortega',
          sideLabel: 'Birdie streak',
          joinStatus: 'accepted',
          draftOrder: 3,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.leo,
        },
      ],
      pots: [
        { label: 'Draft winner', amountCents: 3500, sortOrder: 0 },
        { label: 'Low round', amountCents: 1500, sortOrder: 1 },
        { label: 'Closest pin', amountCents: 1000, sortOrder: 2 },
      ],
      picks: [
        {
          participantIndex: 0,
          pickLabel: 'Scheffler anchor',
          pickType: 'golfer',
          pickValue: 'Scottie Scheffler',
          confidence: 5,
          liveScore: 10,
          outcome: 'pending',
          sortOrder: 0,
        },
        {
          participantIndex: 1,
          pickLabel: 'Hovland run',
          pickType: 'golfer',
          pickValue: 'Viktor Hovland',
          confidence: 4,
          liveScore: 8,
          outcome: 'pending',
          sortOrder: 1,
        },
        {
          participantIndex: 2,
          pickLabel: 'Rahm',
          pickType: 'golfer',
          pickValue: 'Jon Rahm',
          confidence: 3,
          liveScore: 6,
          outcome: 'pending',
          sortOrder: 2,
        },
      ],
      settlements: [
        {
          participantIndex: 0,
          amountCents: 2000,
          method: 'Venmo',
          handle: '@DemoHost',
          confirmationCode: 'VENMO-PGA-001',
          note: 'Entry locked.',
          verificationStatus: 'confirmed',
          proofImageUrl: 'seed/venmo-1.png',
        },
      ],
      eventSource: 'manual',
    },
    {
      slug: 'demo-golf-lpga-open',
      title: 'LPGA Major Side Pot',
      description: 'LPGA draft open; Zelle for entry.',
      category: 'golf',
      format: 'golf-draft',
      sport: 'golf',
      league: 'lpga',
      contextKey: 'tournament',
      customContextName: 'LPGA major',
      status: 'open',
      creatorName: DEMO_USER_NAME,
      sideOptions: ['Draft winner', 'Low round', 'Closest to pin'],
      entryFeeCents: 1500,
      paymentService: 'Zelle',
      paymentHandle: 'demo@napkinbets.app',
      terms: 'Zelle to host before first round.',
      venueName: 'Watch party',
      latitude: '33.7490',
      longitude: '-84.3880',
      eventFallbackTitle: 'LPGA Major Side Pot',
      manualHomeTeam: 'Field',
      manualAwayTeam: 'N/A',
      participants: [
        {
          displayName: 'Demo Host',
          sideLabel: 'Draft winner',
          joinStatus: 'accepted',
          draftOrder: 1,
          paymentStatus: 'confirmed',
          paymentReference: 'ZELLE-DEMO-001',
          avatarUrl: DEMO_AVATAR_URLS.demoHost,
          useDemoUser: true,
        },
        {
          displayName: 'Mara Kim',
          sideLabel: 'Low round',
          joinStatus: 'accepted',
          draftOrder: 2,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.mara,
        },
        {
          displayName: 'Leo Ortega',
          sideLabel: 'Closest to pin',
          joinStatus: 'pending',
          draftOrder: 3,
          paymentStatus: 'pending',
          avatarUrl: DEMO_AVATAR_URLS.leo,
        },
      ],
      pots: [
        { label: 'Draft winner', amountCents: 2500, sortOrder: 0 },
        { label: 'Low round', amountCents: 1500, sortOrder: 1 },
        { label: 'Closest pin', amountCents: 1000, sortOrder: 2 },
      ],
      picks: [],
      settlements: [
        {
          participantIndex: 0,
          amountCents: 1500,
          method: 'Zelle',
          handle: 'demo@napkinbets.app',
          confirmationCode: 'ZELLE-DEMO-001',
          note: 'Entry sent.',
          verificationStatus: 'confirmed',
          proofImageUrl: null,
        },
      ],
      eventSource: 'manual',
    },
  ]
}

// ---------------------------------------------------------------------------
// Join-pool wager for E2E (demo user is not a participant; owned by layer user)
// ---------------------------------------------------------------------------

async function ensureJoinPoolWager(db: AppDatabase, now: string) {
  const existing = await db
    .select({ id: napkinbetsWagers.id })
    .from(napkinbetsWagers)
    .where(eq(napkinbetsWagers.slug, DEMO_JOIN_POOL_SLUG))
    .get()
  if (existing) return

  const pat = await db.select().from(users).where(eq(users.email, 'pat@nard.uk')).get()
  const logan = await db.select().from(users).where(eq(users.email, 'logan@nard.uk')).get()
  if (!pat || !logan) return

  const wagerId = crypto.randomUUID()
  await db.insert(napkinbetsWagers).values({
    id: wagerId,
    ownerUserId: pat.id,
    slug: DEMO_JOIN_POOL_SLUG,
    title: 'Join Pool (E2E)',
    description: 'Pool bet for E2E join flow; demo user is not a participant.',
    napkinType: 'pool',
    boardType: 'manual-curated',
    category: 'basketball',
    format: 'sports-game',
    sport: 'basketball',
    league: 'nba',
    contextKey: 'event',
    customContextName: 'E2E join',
    status: 'open',
    creatorName: pat.name ?? 'Pat',
    sideOptionsJson: '["Home","Away"]',
    entryFeeCents: 1000,
    paymentService: 'Venmo',
    paymentHandle: '@pat-nb',
    terms: 'Friendly wagers only.',
    venueName: 'Test arena',
    latitude: '40.7128',
    longitude: '-74.0060',
    eventSource: 'manual',
    eventId: null,
    eventTitle: 'Join flow game',
    eventStartsAt: now,
    eventStatus: 'Scheduled',
    eventState: 'pre',
    homeTeamName: 'Home',
    awayTeamName: 'Away',
    createdAt: now,
    updatedAt: now,
  })

  const partPatId = crypto.randomUUID()
  const partLoganId = crypto.randomUUID()
  await db.insert(napkinbetsParticipants).values([
    {
      id: partPatId,
      wagerId,
      userId: pat.id,
      displayName: pat.name ?? 'Pat',
      avatarUrl: '',
      sideLabel: 'Home',
      joinStatus: 'accepted',
      draftOrder: 1,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: partLoganId,
      wagerId,
      userId: logan.id,
      displayName: logan.name ?? 'Logan',
      avatarUrl: '',
      sideLabel: 'Away',
      joinStatus: 'accepted',
      draftOrder: 2,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt: now,
      updatedAt: now,
    },
  ])

  await db.insert(napkinbetsPots).values({
    id: crypto.randomUUID(),
    wagerId,
    label: 'Winner',
    amountCents: 2000,
    sortOrder: 0,
  })
}

async function ensureInvitationWager(db: AppDatabase, now: string, demoUserId: string) {
  const existing = await db
    .select({ id: napkinbetsWagers.id })
    .from(napkinbetsWagers)
    .where(eq(napkinbetsWagers.slug, DEMO_INVITATION_SLUG))
    .get()
  if (existing) return

  const pat = await db.select().from(users).where(eq(users.email, 'pat@nard.uk')).get()
  if (!pat) return

  const wagerId = crypto.randomUUID()
  await db.insert(napkinbetsWagers).values({
    id: wagerId,
    ownerUserId: pat.id,
    slug: DEMO_INVITATION_SLUG,
    title: 'Invitation (E2E)',
    description: 'E2E: demo user is invited; Accept/Decline visible.',
    napkinType: 'pool',
    boardType: 'manual-curated',
    category: 'basketball',
    format: 'sports-game',
    sport: 'basketball',
    league: 'nba',
    contextKey: 'event',
    customContextName: 'E2E invitation',
    status: 'open',
    creatorName: pat.name ?? 'Pat',
    sideOptionsJson: '["Home","Away"]',
    entryFeeCents: 500,
    paymentService: 'Venmo',
    paymentHandle: '@pat-nb',
    terms: 'Friendly wagers only.',
    venueName: 'Test arena',
    latitude: '40.7128',
    longitude: '-74.0060',
    eventSource: 'manual',
    eventId: null,
    eventTitle: 'Invitation game',
    eventStartsAt: now,
    eventStatus: 'Scheduled',
    eventState: 'pre',
    homeTeamName: 'Home',
    awayTeamName: 'Away',
    createdAt: now,
    updatedAt: now,
  })

  const partPatId = crypto.randomUUID()
  const partDemoId = crypto.randomUUID()
  await db.insert(napkinbetsParticipants).values([
    {
      id: partPatId,
      wagerId,
      userId: pat.id,
      displayName: pat.name ?? 'Pat',
      avatarUrl: '',
      sideLabel: 'Home',
      joinStatus: 'accepted',
      draftOrder: 1,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: partDemoId,
      wagerId,
      userId: demoUserId,
      displayName: DEMO_USER_NAME,
      avatarUrl: DEMO_AVATAR_URLS.demoHost,
      sideLabel: 'Away',
      joinStatus: 'pending',
      draftOrder: 2,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt: now,
      updatedAt: now,
    },
  ])

  await db.insert(napkinbetsPots).values({
    id: crypto.randomUUID(),
    wagerId,
    label: 'Winner',
    amountCents: 1000,
    sortOrder: 0,
  })
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function ensureSeedData(event: H3Event) {
  const db = useAppDatabase(event)
  const demoUser = await ensureDemoUser(db)
  await ensureDemoSocialGraph(event, demoUser.id)

  const fridayNightWatch = await db
    .select({ id: napkinbetsGroups.id })
    .from(napkinbetsGroups)
    .where(eq(napkinbetsGroups.slug, DEMO_GROUP_SLUG))
    .get()

  const augustaTextChain = await db
    .select({ id: napkinbetsGroups.id })
    .from(napkinbetsGroups)
    .where(eq(napkinbetsGroups.slug, DEMO_AUGUSTA_GROUP_SLUG))
    .get()

  const now = nowIso()
  const events = await loadUpcomingEventRows(db, now)
  const demoPools = [...buildDemoPools(events), ...buildDemoStatePools(), ...buildGolfSeedPools()]
  const demoTitleBySlug = new Map(demoPools.map((pool) => [pool.slug, pool.title]))

  const existingDemoWagers = await db
    .select({ slug: napkinbetsWagers.slug, title: napkinbetsWagers.title })
    .from(napkinbetsWagers)
    .where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))

  const hasCurrentDemoSeed =
    existingDemoWagers.length === DEMO_POOL_SLUGS.length &&
    existingDemoWagers.every((wager) => demoTitleBySlug.get(wager.slug) === wager.title)

  if (hasCurrentDemoSeed) {
    await ensureJoinPoolWager(db, now)
    await ensureInvitationWager(db, now, demoUser.id)
    if (fridayNightWatch) {
      await db
        .update(napkinbetsWagers)
        .set({ groupId: fridayNightWatch.id, updatedAt: now })
        .where(
          and(
            inArray(napkinbetsWagers.slug, DEMO_GROUP_POOL_SLUGS),
            isNull(napkinbetsWagers.groupId),
          ),
        )
    }
    if (augustaTextChain) {
      await db
        .update(napkinbetsWagers)
        .set({ groupId: augustaTextChain.id, updatedAt: now })
        .where(
          and(
            inArray(napkinbetsWagers.slug, DEMO_AUGUSTA_POOL_SLUGS),
            isNull(napkinbetsWagers.groupId),
          ),
        )
    }
    return
  }

  if (existingDemoWagers.length > 0) {
    await db.delete(napkinbetsWagers).where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))
  }
  for (const pool of demoPools) {
    const wagerId = crypto.randomUUID()
    const boardType = pool.eventRow ? 'event-backed' : 'manual-curated'
    const status = pool.eventRow?.status === 'in' ? 'live' : pool.status

    const eventState =
      (pool as DemoPoolDef).eventState ??
      (pool.eventRow?.status === 'in' ? 'in' : pool.eventRow?.status === 'post' ? 'post' : '')
    const groupId =
      augustaTextChain && DEMO_AUGUSTA_POOL_SLUGS.includes(pool.slug)
        ? augustaTextChain.id
        : fridayNightWatch && DEMO_GROUP_POOL_SLUGS.includes(pool.slug)
          ? fridayNightWatch.id
          : null

    const eventMismatchHoops =
      pool.slug === 'demo-hoops-night' && (!pool.eventRow || pool.eventRow.sport !== 'basketball')
    const eventMismatchSoccer =
      pool.slug === 'demo-soccer-watch' && (!pool.eventRow || pool.eventRow.sport !== 'soccer')
    const usePoolSportLeague = eventMismatchHoops || eventMismatchSoccer
    const effectiveSport = usePoolSportLeague ? pool.sport! : (pool.sport ?? pool.eventRow?.sport)
    const effectiveLeague = usePoolSportLeague
      ? pool.league!
      : (pool.league ?? pool.eventRow?.league)
    const effectiveEventTitle = usePoolSportLeague
      ? pool.eventFallbackTitle
      : (pool.eventRow?.eventTitle ?? pool.eventFallbackTitle)

    await db.insert(napkinbetsWagers).values({
      id: wagerId,
      ownerUserId: demoUser.id,
      groupId,
      slug: pool.slug,
      title: pool.title,
      description: pool.description,
      napkinType: (pool as DemoPoolDef).napkinType ?? 'pool',
      boardType,
      category: pool.category,
      format: pool.format,
      sport: effectiveSport,
      league: effectiveLeague,
      contextKey: pool.contextKey,
      customContextName: pool.customContextName,
      status,
      creatorName: pool.creatorName,
      sideOptionsJson: JSON.stringify(pool.sideOptions),
      entryFeeCents: pool.entryFeeCents,
      paymentService: pool.paymentService,
      paymentHandle: pool.paymentHandle,
      terms: pool.terms,
      venueName: pool.venueName,
      latitude: pool.latitude,
      longitude: pool.longitude,
      eventSource: pool.eventRow ? 'espn' : (pool.eventSource ?? 'manual'),
      eventId: pool.eventRow?.id ?? null,
      eventTitle: effectiveEventTitle,
      eventStartsAt: pool.eventRow?.startTime ?? now,
      eventStatus: pool.eventRow?.status ?? pool.status,
      eventState: (pool as DemoPoolDef).eventState ?? (eventState || ''),
      homeTeamName: pool.manualHomeTeam,
      awayTeamName: pool.manualAwayTeam,
      createdAt: now,
      updatedAt: now,
    })

    const participantRows = pool.participants.map((participant) => ({
      id: crypto.randomUUID(),
      wagerId,
      userId: participant.useDemoUser ? demoUser.id : null,
      displayName: participant.displayName,
      avatarUrl: participant.avatarUrl,
      sideLabel: participant.sideLabel,
      joinStatus: participant.joinStatus,
      draftOrder: participant.draftOrder,
      paymentStatus: participant.paymentStatus,
      paymentReference: participant.paymentReference ?? null,
      createdAt: now,
      updatedAt: now,
    }))

    await db.insert(napkinbetsParticipants).values(participantRows)
    const participantIds = participantRows.map((row) => row.id)

    const potRows = pool.pots.map((pot) => ({
      id: crypto.randomUUID(),
      wagerId,
      label: pot.label,
      amountCents: pot.amountCents,
      sortOrder: pot.sortOrder,
    }))
    await db.insert(napkinbetsPots).values(potRows)

    if (pool.picks?.length) {
      const pickRows = pool.picks
        .map((pick) => {
          const participantId = participantIds[pick.participantIndex]
          if (!participantId) {
            return null
          }

          return {
            id: crypto.randomUUID(),
            wagerId,
            participantId,
            pickLabel: pick.pickLabel,
            pickType: pick.pickType,
            pickValue: pick.pickValue,
            confidence: pick.confidence,
            liveScore: pick.liveScore,
            outcome: pick.outcome,
            sortOrder: pick.sortOrder ?? pick.liveScore,
            createdAt: now,
          }
        })
        .filter(isTruthy)

      if (pickRows.length) {
        await db.insert(napkinbetsPicks).values(pickRows)
      }
    }

    if (pool.settlements?.length) {
      for (const settlement of pool.settlements) {
        const participantId = participantIds[settlement.participantIndex]
        if (!participantId) {
          continue
        }

        await db.insert(napkinbetsSettlements).values({
          id: crypto.randomUUID(),
          wagerId,
          participantId,
          amountCents: settlement.amountCents,
          method: settlement.method,
          handle: settlement.handle,
          confirmationCode: settlement.confirmationCode ?? null,
          note: settlement.note,
          verificationStatus: settlement.verificationStatus,
          verifiedByUserId: settlement.verificationStatus === 'confirmed' ? demoUser.id : null,
          verifiedAt: settlement.verificationStatus === 'confirmed' ? now : null,
          rejectedByUserId:
            settlement.verificationStatus === 'rejected'
              ? demoUser.id
              : (settlement.rejectedByUserId ?? null),
          rejectedAt: settlement.rejectedAt ?? null,
          rejectionNote: settlement.rejectionNote ?? null,
          proofImageUrl: settlement.proofImageUrl ?? null,
          recordedAt: now,
        })

        if (
          settlement.verificationStatus === 'confirmed' ||
          settlement.verificationStatus === 'submitted'
        ) {
          await db
            .update(napkinbetsParticipants)
            .set({
              paymentStatus:
                settlement.verificationStatus === 'confirmed' ? 'confirmed' : 'submitted',
              paymentReference: settlement.confirmationCode ?? settlement.handle ?? null,
              updatedAt: now,
            })
            .where(eq(napkinbetsParticipants.id, participantId))
        }
      }
    }

    if (pool.notifications?.length) {
      const notificationRows = pool.notifications
        .map((notification) => {
          const participantId = participantIds[notification.participantIndex]
          if (!participantId) {
            return null
          }

          return {
            id: crypto.randomUUID(),
            wagerId,
            participantId,
            kind: notification.kind,
            title: notification.title,
            body: notification.body,
            deliveryStatus: 'queued',
            scheduledFor: now,
            createdAt: now,
            sentAt: null,
          }
        })
        .filter(isTruthy)

      if (notificationRows.length) {
        await db.insert(napkinbetsNotifications).values(notificationRows)
      }
    }
  }

  await ensureJoinPoolWager(db, now)
  await ensureInvitationWager(db, now, demoUser.id)
}

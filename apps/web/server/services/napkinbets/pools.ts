import type { H3Event } from 'h3'
import { createError } from 'h3'
import { asc, eq, gte, inArray } from 'drizzle-orm'
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
import { requireAuth } from '#layer/server/utils/auth'
import { hashUserPassword } from '#layer/server/utils/password'
import {
  getWeatherForecast,
  type NapkinbetsWeatherSnapshot,
} from '#server/services/napkinbets/live'
import { loadCachedEventsByIds, loadFeaturedLiveGames } from '#server/services/napkinbets/events'
import { ensureDemoSocialGraph } from '#server/services/napkinbets/social'
import { useAppDatabase } from '#server/utils/database'

interface SavePoolDataInput {
  title: string
  creatorName: string
  description: string
  napkinType: 'simple-bet' | 'pool'
  boardType: 'event-backed' | 'manual-curated' | 'community-created'
  format: string
  sport: string
  league: string
  contextKey: string
  customContextName: string
  groupId: string
  sideOptions: string
  participantNames: string
  participantSeeds?: Array<{
    displayName: string
    userId?: string | null
  }>
  shuffleParticipants?: boolean
  potRules: string
  entryFeeDollars: number
  paymentService: string
  paymentHandle: string
  venueName: string
  latitude: string
  longitude: string
  terms: string
  eventSource?: string
  eventId?: string
  eventTitle?: string
  eventStartsAt?: string
  eventStatus?: string
  homeTeamName?: string
  awayTeamName?: string
}

interface JoinPoolInput {
  displayName: string
  sideLabel: string
}

interface SavePickInput {
  participantName: string
  pickLabel: string
  pickType: string
  pickValue: string
  confidence: number
}

interface SettlementInput {
  participantId?: string
  participantName: string
  amountDollars: number
  method: string
  handle: string
  confirmationCode: string
  note: string
}

interface ReminderInput {
  message?: string
}

interface LoadPoolDataOptions {
  includeContext?: boolean
}

interface SerializedLeaderboardRow {
  participantId: string
  displayName: string
  sideLabel: string
  draftOrder: number | null
  score: number
  pickCount: number
  projectedPayoutCents: number
  confirmedSettlementCents: number
}

function toLiveGame(
  cachedEvent: Awaited<ReturnType<typeof loadCachedEventsByIds>> extends Map<string, infer T>
    ? T
    : never,
) {
  const isMatchup =
    cachedEvent.awayTeam.homeAway === 'away' && cachedEvent.homeTeam.homeAway === 'home'

  return {
    id: cachedEvent.id,
    name: cachedEvent.eventTitle,
    shortName: isMatchup
      ? `${cachedEvent.awayTeam.abbreviation || cachedEvent.awayTeam.shortName} @ ${cachedEvent.homeTeam.abbreviation || cachedEvent.homeTeam.shortName}`
      : cachedEvent.eventTitle,
    status: cachedEvent.shortStatus,
    sport: cachedEvent.sport,
    league: cachedEvent.league,
    competitors: [
      {
        name: cachedEvent.awayTeam.name,
        abbreviation: cachedEvent.awayTeam.abbreviation,
        score: cachedEvent.awayTeam.score,
        homeAway: cachedEvent.awayTeam.homeAway,
      },
      {
        name: cachedEvent.homeTeam.name,
        abbreviation: cachedEvent.homeTeam.abbreviation,
        score: cachedEvent.homeTeam.score,
        homeAway: cachedEvent.homeTeam.homeAway,
      },
    ],
  }
}

const CONCEPT = {
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

function nowIso() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 48)
}

function normalizeList(input: string) {
  const seen = new Set<string>()
  const values: string[] = []

  for (const chunk of input.split(/[\n,]/)) {
    const value = chunk.trim()
    if (!value) {
      continue
    }

    const key = value.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    values.push(value)
  }

  return values
}

function parseSideOptions(raw: string) {
  const values = normalizeList(raw)
  return values.length > 0 ? values : ['Winner takes all', 'Closest prop hit']
}

function parsePotRules(raw: string, totalPotCents: number) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: Array<{ label: string; rawAmount: number }> = []
  let totalRaw = 0

  for (const line of lines) {
    const [labelPart, amountPart] = line.split(':')
    const label = labelPart?.trim() || 'Winner'
    const amount = Number((amountPart ?? '').replaceAll(/[^0-9.]/g, ''))
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
    parsed.push({ label, rawAmount: safeAmount })
    totalRaw += safeAmount
  }

  if (parsed.length === 0) {
    return [{ label: 'Winner takes all', amountCents: totalPotCents, sortOrder: 0 }]
  }

  const treatAsPercentages = totalRaw > 0 && totalRaw <= 100
  const pots: Array<{ label: string; amountCents: number; sortOrder: number }> = []

  for (let index = 0; index < parsed.length; index++) {
    const item = parsed[index]!
    const amountCents = treatAsPercentages
      ? Math.round(totalPotCents * (item.rawAmount / 100))
      : Math.round(item.rawAmount * 100)

    pots.push({
      label: item.label,
      amountCents,
      sortOrder: index,
    })
  }

  return pots
}

const DEMO_POOL_SLUGS = ['demo-hoops-night', 'demo-soccer-watch', 'demo-golf-draft']
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
type AppDatabase = ReturnType<typeof useAppDatabase>

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
}

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
      title: 'Hoops Night Rally',
      description: primaryEvent
        ? `Live-friendly sample anchored on ${primaryEvent.eventTitle}.`
        : 'Live-friendly court-side pool for tonight’s action.',
      category: 'basketball',
      format: 'sports-game',
      sport: primaryEvent?.sport ?? 'basketball',
      league: primaryEvent?.league ?? 'nba',
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
      title: 'Starlit Soccer Watch',
      description: secondaryEvent
        ? `Prop-style pool for ${secondaryEvent.eventTitle}.`
        : 'Prop-style pool anchored on midweek soccer action.',
      category: 'soccer',
      format: 'sports-prop',
      sport: secondaryEvent?.sport ?? 'soccer',
      league: secondaryEvent?.league ?? 'mls',
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
      title: 'Napkin Greens Draft',
      description: 'Golf-draft showcase with leaderboards and pot splits.',
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

function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value)
}

function shuffleList<T>(items: T[]) {
  const values = [...items]

  for (let index = values.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1))
    const current = values[index]
    values[index] = values[target]!
    values[target] = current!
  }

  return values
}

function parseJsonArray(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string')
    }
  } catch {
    return []
  }

  return []
}

function computeLeaderboard(
  participants: Array<typeof napkinbetsParticipants.$inferSelect>,
  picks: Array<typeof napkinbetsPicks.$inferSelect>,
  pots: Array<typeof napkinbetsPots.$inferSelect>,
  settlements: Array<typeof napkinbetsSettlements.$inferSelect>,
) {
  const totalPotCents = pots.reduce((sum, pot) => sum + pot.amountCents, 0)
  const acceptedParticipants = participants.filter(
    (participant) => participant.joinStatus !== 'pending',
  )

  const rows: SerializedLeaderboardRow[] = []
  let totalScore = 0

  for (const participant of acceptedParticipants) {
    const participantPicks = picks.filter((pick) => pick.participantId === participant.id)
    const participantSettlements = settlements.filter(
      (settlement) => settlement.participantId === participant.id,
    )

    let score = 0
    for (const pick of participantPicks) {
      score += pick.liveScore
      if (pick.outcome === 'winning') {
        score += 3
      } else if (pick.outcome === 'pending') {
        score += 1
      }
    }

    totalScore += score
    rows.push({
      participantId: participant.id,
      displayName: participant.displayName,
      sideLabel: participant.sideLabel ?? 'Open side',
      draftOrder: participant.draftOrder ?? null,
      score,
      pickCount: participantPicks.length,
      projectedPayoutCents: 0,
      confirmedSettlementCents: participantSettlements.reduce(
        (sum, settlement) => sum + settlement.amountCents,
        0,
      ),
    })
  }

  const fallbackSplit = rows.length > 0 ? Math.round(totalPotCents / rows.length) : 0

  for (const row of rows) {
    row.projectedPayoutCents =
      totalScore > 0 ? Math.round(totalPotCents * (row.score / totalScore)) : fallbackSplit
  }

  rows.sort(
    (left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName),
  )
  return rows
}

async function createNotification(
  event: H3Event,
  wagerId: string,
  title: string,
  body: string,
  kind: string,
  participantId?: string | null,
) {
  const db = useAppDatabase(event)
  await db.insert(napkinbetsNotifications).values({
    id: crypto.randomUUID(),
    wagerId,
    participantId: participantId ?? null,
    kind,
    title,
    body,
    deliveryStatus: 'queued',
    scheduledFor: nowIso(),
    createdAt: nowIso(),
    sentAt: null,
  })
}

async function getWagerOrThrow(event: H3Event, wagerId: string) {
  const db = useAppDatabase(event)
  const [wager] = await db
    .select()
    .from(napkinbetsWagers)
    .where(eq(napkinbetsWagers.id, wagerId))
    .limit(1)

  if (!wager) {
    throw createError({ statusCode: 404, message: 'Wager not found.' })
  }

  return wager
}

async function requireOwnerOrAdmin(event: H3Event, wagerId: string) {
  const user = await requireAuth(event)
  const wager = await getWagerOrThrow(event, wagerId)

  if (user.isAdmin || wager.ownerUserId === user.id) {
    return { user, wager }
  }

  throw createError({
    statusCode: 403,
    message: 'Only the board owner or an admin can manage this wager.',
  })
}

async function getSettlementOrThrow(event: H3Event, settlementId: string) {
  const db = useAppDatabase(event)
  const [settlement] = await db
    .select()
    .from(napkinbetsSettlements)
    .where(eq(napkinbetsSettlements.id, settlementId))
    .limit(1)

  if (!settlement) {
    throw createError({ statusCode: 404, message: 'Settlement not found.' })
  }

  return settlement
}

export async function ensureSeedData(event: H3Event) {
  const db = useAppDatabase(event)
  const demoUser = await ensureDemoUser(db)
  await ensureDemoSocialGraph(event, demoUser.id)

  const existingDemoWagers = await db
    .select({ slug: napkinbetsWagers.slug })
    .from(napkinbetsWagers)
    .where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))

  if (existingDemoWagers.length === DEMO_POOL_SLUGS.length) {
    return
  }

  if (existingDemoWagers.length > 0) {
    await db.delete(napkinbetsWagers).where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))
  }

  const now = nowIso()
  const events = await loadUpcomingEventRows(db, now)
  const demoPools = buildDemoPools(events)

  for (const pool of demoPools) {
    const wagerId = crypto.randomUUID()
    const boardType = pool.eventRow ? 'event-backed' : 'manual-curated'
    const status = pool.eventRow?.status === 'in' ? 'live' : pool.status

    await db.insert(napkinbetsWagers).values({
      id: wagerId,
      ownerUserId: demoUser.id,
      slug: pool.slug,
      title: pool.title,
      description: pool.description,
      boardType,
      category: pool.category,
      format: pool.format,
      sport: pool.eventRow?.sport ?? pool.sport,
      league: pool.eventRow?.league ?? pool.league,
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
      eventTitle: pool.eventRow?.eventTitle ?? pool.eventFallbackTitle,
      eventStartsAt: pool.eventRow?.startTime ?? now,
      eventStatus: pool.eventRow?.status ?? pool.status,
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
          rejectedByUserId: null,
          rejectedAt: null,
          rejectionNote: null,
          recordedAt: now,
        })

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
}
export async function loadPoolData(event: H3Event, options: LoadPoolDataOptions = {}) {
  await ensureSeedData(event)

  const db = useAppDatabase(event)
  const [wagers, groups, participants, pots, picks, notifications, settlements] = await Promise.all([
    db.select().from(napkinbetsWagers).orderBy(asc(napkinbetsWagers.createdAt)),
    db.select().from(napkinbetsGroups),
    db.select().from(napkinbetsParticipants).orderBy(asc(napkinbetsParticipants.createdAt)),
    db.select().from(napkinbetsPots).orderBy(asc(napkinbetsPots.sortOrder)),
    db.select().from(napkinbetsPicks).orderBy(asc(napkinbetsPicks.sortOrder)),
    db.select().from(napkinbetsNotifications).orderBy(asc(napkinbetsNotifications.createdAt)),
    db.select().from(napkinbetsSettlements).orderBy(asc(napkinbetsSettlements.recordedAt)),
  ])
  const groupNamesById = new Map(groups.map((group) => [group.id, group.name]))

  const weatherSnapshots = new Map<string, NapkinbetsWeatherSnapshot>()
  const cachedEventIds = wagers
    .map((wager) => wager.eventId ?? '')
    .filter((eventId): eventId is string => Boolean(eventId))

  const [cachedEventsById, featuredLiveGames] =
    options.includeContext !== false
      ? await Promise.all([
          loadCachedEventsByIds(event, cachedEventIds),
          loadFeaturedLiveGames(event),
        ])
      : [new Map(), []]

  if (options.includeContext !== false) {
    const weatherRequests = new Map<
      string,
      { latitude: string; longitude: string; label: string }
    >()

    for (const wager of wagers) {
      const weatherKey = `${wager.latitude ?? ''}:${wager.longitude ?? ''}:${wager.venueName ?? ''}`
      if (wager.latitude && wager.longitude) {
        weatherRequests.set(weatherKey, {
          latitude: wager.latitude,
          longitude: wager.longitude,
          label: wager.venueName ?? wager.title,
        })
      }
    }

    const weatherPromises: Array<Promise<readonly [string, NapkinbetsWeatherSnapshot | null]>> = []
    for (const [weatherKey, request] of weatherRequests.entries()) {
      weatherPromises.push(
        getWeatherForecast(request.latitude, request.longitude, request.label).then(
          (forecast) => [weatherKey, forecast] as const,
        ),
      )
    }

    const weatherResults = await Promise.all(weatherPromises)

    for (const [weatherKey, forecast] of weatherResults) {
      if (forecast) {
        weatherSnapshots.set(weatherKey, forecast)
      }
    }
  }

  const serializedWagers = []
  for (const wager of wagers) {
    const wagerParticipants = participants
      .filter((participant) => participant.wagerId === wager.id)
      .sort((left, right) => (left.draftOrder ?? 999) - (right.draftOrder ?? 999))
    const wagerPots = pots.filter((pot) => pot.wagerId === wager.id)
    const wagerPicks = picks.filter((pick) => pick.wagerId === wager.id)
    const wagerNotifications = notifications
      .filter((notification) => notification.wagerId === wager.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
    const wagerSettlements = settlements
      .filter((settlement) => settlement.wagerId === wager.id)
      .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    const leaderboard = computeLeaderboard(
      wagerParticipants,
      wagerPicks,
      wagerPots,
      wagerSettlements,
    )
    const weatherKey = `${wager.latitude ?? ''}:${wager.longitude ?? ''}:${wager.venueName ?? ''}`
    const eventContext = wager.eventId ? (cachedEventsById.get(wager.eventId) ?? null) : null

    serializedWagers.push({
      id: wager.id,
      ownerUserId: wager.ownerUserId ?? null,
      groupId: wager.groupId ?? null,
      groupName: wager.groupId ? (groupNamesById.get(wager.groupId) ?? '') : '',
      slug: wager.slug,
      title: wager.title,
      description: wager.description,
      napkinType: wager.napkinType as SavePoolDataInput['napkinType'],
      boardType: wager.boardType as SavePoolDataInput['boardType'],
      category: wager.category,
      format: wager.format,
      sport: wager.sport,
      league: wager.league,
      contextKey: wager.contextKey,
      customContextName: wager.customContextName ?? '',
      status: wager.status,
      creatorName: wager.creatorName,
      sideOptions: parseJsonArray(wager.sideOptionsJson),
      entryFeeCents: wager.entryFeeCents,
      paymentService: wager.paymentService,
      paymentHandle: wager.paymentHandle ?? '',
      terms: wager.terms,
      venueName: wager.venueName ?? '',
      eventSource: wager.eventSource ?? '',
      eventId: wager.eventId ?? '',
      eventTitle: wager.eventTitle ?? '',
      eventStartsAt: wager.eventStartsAt ?? '',
      eventStatus: wager.eventStatus ?? '',
      homeTeamName: wager.homeTeamName ?? '',
      awayTeamName: wager.awayTeamName ?? '',
      participants: wagerParticipants,
      pots: wagerPots,
      picks: wagerPicks,
      notifications: wagerNotifications,
      settlements: wagerSettlements,
      leaderboard,
      liveGames: eventContext ? [toLiveGame(eventContext)] : [],
      weather: weatherSnapshots.get(weatherKey) ?? null,
      totalPotCents: wagerPots.reduce((sum, pot) => sum + pot.amountCents, 0),
    })
  }

  const metrics = [
    {
      label: 'Active wagers',
      value: String(serializedWagers.length),
      hint: 'live friendly boards',
      icon: 'i-lucide-ticket',
    },
    {
      label: 'Participants tracked',
      value: String(
        participants.filter((participant) => participant.joinStatus === 'accepted').length,
      ),
      hint: 'accepted into the pool',
      icon: 'i-lucide-users',
    },
    {
      label: 'Queued reminders',
      value: String(
        notifications.filter((notification) => notification.deliveryStatus === 'queued').length,
      ),
      hint: 'manual follow-ups ready',
      icon: 'i-lucide-bell-ring',
    },
    {
      label: 'Open settlements',
      value: String(
        participants.filter((participant) => participant.paymentStatus !== 'confirmed').length,
      ),
      hint: 'awaiting transfer proof',
      icon: 'i-lucide-wallet',
    },
  ]

  return {
    concept: CONCEPT,
    metrics,
    liveGames: featuredLiveGames,
    weather: Array.from(weatherSnapshots.values()).slice(0, 4),
    wagers: serializedWagers,
    refreshedAt: nowIso(),
  }
}

export async function savePoolData(event: H3Event, input: SavePoolDataInput) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const createdAt = nowIso()
  const wagerId = crypto.randomUUID()
  const entryFeeCents = Math.round(input.entryFeeDollars * 100)
  const sideOptions = parseSideOptions(input.sideOptions)
  const creatorName = input.creatorName.trim() || authUser.name || authUser.email
  const normalizedParticipantSeeds =
    input.participantSeeds?.map((participant) => ({
      displayName: participant.displayName.trim(),
      userId: participant.userId?.trim() || null,
    })).filter((participant) => participant.displayName) ?? []
  const participantSeeds =
    normalizedParticipantSeeds.length > 0
      ? normalizedParticipantSeeds
      : normalizeList(input.participantNames).map((displayName) => ({
          displayName,
          userId: null,
        }))

  if (
    !participantSeeds.some(
      (participant) => participant.displayName.toLowerCase() === creatorName.toLowerCase(),
    )
  ) {
    participantSeeds.unshift({
      displayName: creatorName,
      userId: authUser.id,
    })
  }

  const dedupedParticipants: typeof participantSeeds = []
  const seenParticipants = new Set<string>()
  for (const participant of participantSeeds) {
    const key = participant.displayName.toLowerCase()
    if (seenParticipants.has(key)) {
      continue
    }

    seenParticipants.add(key)
    dedupedParticipants.push({
      displayName: participant.displayName,
      userId:
        participant.userId ||
        (participant.displayName.toLowerCase() === creatorName.toLowerCase() ? authUser.id : null),
    })
  }

  const orderedParticipants =
    input.shuffleParticipants === false ? dedupedParticipants : shuffleList(dedupedParticipants)
  const totalPotCents = orderedParticipants.length * entryFeeCents
  const potRules = parsePotRules(input.potRules, totalPotCents)
  const slugBase = slugify(input.title) || 'napkinbets-wager'
  const slug = `${slugBase}-${wagerId.slice(0, 6)}`

  await db.insert(napkinbetsWagers).values({
    id: wagerId,
    ownerUserId: authUser.id,
    groupId: input.groupId.trim() || null,
    slug,
    title: input.title,
    description: input.description,
    napkinType: input.napkinType,
    boardType: input.boardType,
    category: input.format.includes('golf') ? 'golf' : input.sport || 'custom',
    format: input.format,
    sport: input.sport,
    league: input.league,
    contextKey: input.contextKey,
    customContextName: input.customContextName || null,
    status: 'open',
    creatorName,
    sideOptionsJson: JSON.stringify(sideOptions),
    entryFeeCents,
    paymentService: input.paymentService,
    paymentHandle: input.paymentHandle || null,
    terms: input.terms,
    venueName: input.venueName || null,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    eventSource: input.eventSource || null,
    eventId: input.eventId || null,
    eventTitle: input.eventTitle || input.title,
    eventStartsAt: input.eventStartsAt || null,
    eventStatus: input.eventStatus || 'open',
    homeTeamName: input.homeTeamName || null,
    awayTeamName: input.awayTeamName || null,
    createdAt,
    updatedAt: createdAt,
  })

  const participantsToInsert = []
  for (let index = 0; index < orderedParticipants.length; index++) {
    const participant = orderedParticipants[index]!
    const displayName = participant.displayName
    participantsToInsert.push({
      id: crypto.randomUUID(),
      wagerId,
      userId: participant.userId,
      displayName,
      sideLabel: sideOptions[index % sideOptions.length] ?? sideOptions[0] ?? 'Open side',
      joinStatus: 'accepted',
      draftOrder: index + 1,
      paymentStatus: participant.userId === authUser.id ? 'confirmed' : 'pending',
      paymentReference: null,
      avatarUrl: '',
      createdAt,
      updatedAt: createdAt,
    })
  }
  await db.insert(napkinbetsParticipants).values(participantsToInsert)

  const potsToInsert = []
  for (const potRule of potRules) {
    potsToInsert.push({
      id: crypto.randomUUID(),
      wagerId,
      label: potRule.label,
      amountCents: potRule.amountCents,
      sortOrder: potRule.sortOrder,
    })
  }
  await db.insert(napkinbetsPots).values(potsToInsert)

  await createNotification(
    event,
    wagerId,
    'Wager created',
    `${creatorName} set the board and randomized draft order.`,
    'system',
  )
  await createNotification(
    event,
    wagerId,
    'Reminder queue ready',
    `Use ${input.paymentService} manually for settlement once results lock.`,
    'reminder',
  )

  return {
    ok: true,
    wagerId,
    slug,
  }
}

export async function joinPool(event: H3Event, wagerId: string, input: JoinPoolInput) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const createdAt = nowIso()
  const wager = await getWagerOrThrow(event, wagerId)

  const participantRows = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  const sideOptions = parseJsonArray(wager.sideOptionsJson)
  const normalizedName = input.displayName.trim().toLowerCase()
  const existing = participantRows.find(
    (participant) => participant.displayName.trim().toLowerCase() === normalizedName,
  )
  const sideLabel = input.sideLabel.trim() || sideOptions[0] || 'Open side'

  if (existing) {
    await db
      .update(napkinbetsParticipants)
      .set({
        userId: existing.userId ?? authUser.id,
        sideLabel,
        joinStatus: 'accepted',
        updatedAt: createdAt,
      })
      .where(eq(napkinbetsParticipants.id, existing.id))

    await createNotification(
      event,
      wagerId,
      'Participant updated',
      `${existing.displayName} confirmed ${sideLabel}.`,
      'acceptance',
      existing.id,
    )

    return { ok: true, participantId: existing.id }
  }

  const draftOrder = participantRows.reduce(
    (maxOrder, participant) => Math.max(maxOrder, participant.draftOrder ?? 0),
    0,
  )
  const participantId = crypto.randomUUID()
  await db.insert(napkinbetsParticipants).values({
    id: participantId,
    wagerId,
    userId: authUser.id,
    displayName: input.displayName.trim() || authUser.name || authUser.email,
    avatarUrl: '',
    sideLabel,
    joinStatus: 'accepted',
    draftOrder: draftOrder + 1,
    paymentStatus: 'pending',
    paymentReference: null,
    createdAt,
    updatedAt: createdAt,
  })

  await createNotification(
    event,
    wagerId,
    'Participant joined',
    `${input.displayName.trim()} joined on ${sideLabel}.`,
    'acceptance',
    participantId,
  )

  return { ok: true, participantId }
}

export async function savePick(event: H3Event, wagerId: string, input: SavePickInput) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const createdAt = nowIso()
  const participants = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  let participant = participants.find(
    (row) => row.displayName.trim().toLowerCase() === input.participantName.trim().toLowerCase(),
  )

  if (!participant) {
    const participantId = crypto.randomUUID()
    const draftOrder = participants.reduce(
      (maxOrder, row) => Math.max(maxOrder, row.draftOrder ?? 0),
      0,
    )
    await db.insert(napkinbetsParticipants).values({
      id: participantId,
      wagerId,
      userId: authUser.id,
      displayName: input.participantName.trim(),
      sideLabel: 'Open side',
      joinStatus: 'accepted',
      draftOrder: draftOrder + 1,
      paymentStatus: 'pending',
      paymentReference: null,
      avatarUrl: '',
      createdAt,
      updatedAt: createdAt,
    })
    participant = {
      id: participantId,
      wagerId,
      userId: authUser.id,
      displayName: input.participantName.trim(),
      avatarUrl: '',
      sideLabel: 'Open side',
      joinStatus: 'accepted',
      draftOrder: draftOrder + 1,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    }
  }

  if (!participant) {
    throw createError({ statusCode: 500, message: 'Participant could not be created.' })
  }

  await db.insert(napkinbetsPicks).values({
    id: crypto.randomUUID(),
    wagerId,
    participantId: participant.id,
    pickLabel: input.pickLabel.trim(),
    pickType: input.pickType.trim() || 'custom',
    pickValue: input.pickValue.trim() || null,
    confidence: input.confidence,
    liveScore: input.confidence * 2,
    outcome: 'pending',
    sortOrder: Date.now(),
    createdAt,
  })

  await createNotification(
    event,
    wagerId,
    'Pick logged',
    `${participant.displayName} added ${input.pickLabel.trim()}.`,
    'pick',
    participant.id,
  )

  return { ok: true }
}

export async function recordSettlement(event: H3Event, wagerId: string, input: SettlementInput) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const createdAt = nowIso()
  const wager = await getWagerOrThrow(event, wagerId)
  const participants = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  const participant = input.participantId
    ? participants.find((row) => row.id === input.participantId)
    : participants.find(
        (row) =>
          row.displayName.trim().toLowerCase() === input.participantName.trim().toLowerCase(),
      )

  if (!participant) {
    throw createError({ statusCode: 404, message: 'Participant not found for settlement.' })
  }

  const canManage = Boolean(authUser.isAdmin || wager.ownerUserId === authUser.id)
  if (!canManage && participant.userId !== authUser.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only submit proof for your own seat.',
    })
  }

  await db.insert(napkinbetsSettlements).values({
    id: crypto.randomUUID(),
    wagerId,
    participantId: participant.id,
    amountCents: Math.round(input.amountDollars * 100),
    method: input.method.trim(),
    handle: input.handle.trim() || null,
    confirmationCode: input.confirmationCode.trim() || null,
    note: input.note.trim() || null,
    verificationStatus: 'submitted',
    verifiedByUserId: null,
    verifiedAt: null,
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionNote: null,
    recordedAt: createdAt,
  })

  await db
    .update(napkinbetsParticipants)
    .set({
      paymentStatus: 'submitted',
      paymentReference: input.confirmationCode.trim() || input.handle.trim() || null,
      updatedAt: createdAt,
    })
    .where(eq(napkinbetsParticipants.id, participant.id))

  await createNotification(
    event,
    wagerId,
    'Settlement recorded',
    `${participant.displayName} logged a ${input.method.trim()} confirmation.`,
    'settlement',
    participant.id,
  )

  return { ok: true }
}

export async function confirmSettlement(event: H3Event, wagerId: string, settlementId: string) {
  const { user } = await requireOwnerOrAdmin(event, wagerId)
  const db = useAppDatabase(event)
  const settlement = await getSettlementOrThrow(event, settlementId)

  if (settlement.wagerId !== wagerId) {
    throw createError({ statusCode: 400, message: 'Settlement does not belong to this wager.' })
  }

  const verifiedAt = nowIso()

  await db
    .update(napkinbetsSettlements)
    .set({
      verificationStatus: 'confirmed',
      verifiedByUserId: user.id,
      verifiedAt,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionNote: null,
    })
    .where(eq(napkinbetsSettlements.id, settlementId))

  await db
    .update(napkinbetsParticipants)
    .set({
      paymentStatus: 'confirmed',
      updatedAt: verifiedAt,
    })
    .where(eq(napkinbetsParticipants.id, settlement.participantId))

  await createNotification(
    event,
    wagerId,
    'Settlement confirmed',
    'A board owner verified submitted payment proof.',
    'settlement',
    settlement.participantId,
  )

  return { ok: true }
}

export async function rejectSettlement(
  event: H3Event,
  wagerId: string,
  settlementId: string,
  note: string,
) {
  const { user } = await requireOwnerOrAdmin(event, wagerId)
  const db = useAppDatabase(event)
  const settlement = await getSettlementOrThrow(event, settlementId)

  if (settlement.wagerId !== wagerId) {
    throw createError({ statusCode: 400, message: 'Settlement does not belong to this wager.' })
  }

  const rejectedAt = nowIso()
  const rejectionNote =
    note.trim() ||
    'Proof needs a clearer handle, amount, or confirmation reference before closeout.'

  await db
    .update(napkinbetsSettlements)
    .set({
      verificationStatus: 'rejected',
      verifiedByUserId: null,
      verifiedAt: null,
      rejectedByUserId: user.id,
      rejectedAt,
      rejectionNote,
    })
    .where(eq(napkinbetsSettlements.id, settlementId))

  await db
    .update(napkinbetsParticipants)
    .set({
      paymentStatus: 'pending',
      paymentReference: null,
      updatedAt: rejectedAt,
    })
    .where(eq(napkinbetsParticipants.id, settlement.participantId))

  await createNotification(
    event,
    wagerId,
    'Settlement rejected',
    rejectionNote,
    'settlement',
    settlement.participantId,
  )

  return { ok: true }
}

export async function randomizeDraftOrder(event: H3Event, wagerId: string) {
  await requireOwnerOrAdmin(event, wagerId)
  const db = useAppDatabase(event)
  const participants = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  const shuffled = shuffleList(participants)
  const updatedAt = nowIso()

  for (let index = 0; index < shuffled.length; index++) {
    const participant = shuffled[index]!
    await db
      .update(napkinbetsParticipants)
      .set({
        draftOrder: index + 1,
        updatedAt,
      })
      .where(eq(napkinbetsParticipants.id, participant.id))
  }

  await createNotification(
    event,
    wagerId,
    'Draft order rerolled',
    'The napkin got shuffled and the board has a fresh order.',
    'draft',
  )

  return { ok: true }
}

export async function queueReminder(event: H3Event, wagerId: string, input?: ReminderInput) {
  const { wager } = await requireOwnerOrAdmin(event, wagerId)

  await createNotification(
    event,
    wagerId,
    'Reminder queued',
    input?.message?.trim() ||
      `Results are nearly in. Ask everyone to confirm transfers through ${wager.paymentService}.`,
    'reminder',
  )

  return { ok: true }
}

export async function clearPoolData(event: H3Event, wagerId: string) {
  await requireOwnerOrAdmin(event, wagerId)
  const db = useAppDatabase(event)

  await db.delete(napkinbetsSettlements).where(eq(napkinbetsSettlements.wagerId, wagerId))
  await db.delete(napkinbetsNotifications).where(eq(napkinbetsNotifications.wagerId, wagerId))
  await db.delete(napkinbetsPicks).where(eq(napkinbetsPicks.wagerId, wagerId))
  await db.delete(napkinbetsPots).where(eq(napkinbetsPots.wagerId, wagerId))
  await db.delete(napkinbetsParticipants).where(eq(napkinbetsParticipants.wagerId, wagerId))
  await db.delete(napkinbetsWagers).where(eq(napkinbetsWagers.id, wagerId))

  return { ok: true }
}

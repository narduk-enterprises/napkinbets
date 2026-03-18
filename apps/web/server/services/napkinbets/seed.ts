/**
 * Demo seed data — only used during development / demo provisioning.
 * Extracted from pools.ts for maintainability (no runtime production callers).
 */
import type { H3Event } from 'h3'
import { asc, eq, gte, inArray } from 'drizzle-orm'
import {
  napkinbetsEvents,
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
      title: 'Soccer Props Group Bet',
      description: secondaryEvent
        ? `Sample prop bet built from ${secondaryEvent.eventTitle}.`
        : 'Sample prop bet built around a featured soccer match.',
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

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function ensureSeedData(event: H3Event) {
  const db = useAppDatabase(event)
  const demoUser = await ensureDemoUser(db)
  await ensureDemoSocialGraph(event, demoUser.id)

  const now = nowIso()
  const events = await loadUpcomingEventRows(db, now)
  const demoPools = buildDemoPools(events)
  const demoTitleBySlug = new Map(demoPools.map((pool) => [pool.slug, pool.title]))

  const existingDemoWagers = await db
    .select({ slug: napkinbetsWagers.slug, title: napkinbetsWagers.title })
    .from(napkinbetsWagers)
    .where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))

  const hasCurrentDemoSeed =
    existingDemoWagers.length === DEMO_POOL_SLUGS.length &&
    existingDemoWagers.every((wager) => demoTitleBySlug.get(wager.slug) === wager.title)

  if (hasCurrentDemoSeed) {
    return
  }

  if (existingDemoWagers.length > 0) {
    await db.delete(napkinbetsWagers).where(inArray(napkinbetsWagers.slug, DEMO_POOL_SLUGS))
  }
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

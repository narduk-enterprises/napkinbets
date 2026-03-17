import type { H3Event } from 'h3'
import { createError } from 'h3'
import { asc, eq } from 'drizzle-orm'
import {
  napkinbetsNotifications,
  napkinbetsParticipants,
  napkinbetsPicks,
  napkinbetsPots,
  napkinbetsSettlements,
  napkinbetsWagers,
} from '#server/database/schema'
import { requireAuth } from '#layer/server/utils/auth'
import {
  getWeatherForecast,
  type NapkinbetsWeatherSnapshot,
} from '#server/services/napkinbets/live'
import {
  loadCachedEventsByIds,
  loadFeaturedLiveGames,
} from '#server/services/napkinbets/events'
import { useAppDatabase } from '#server/utils/database'

interface SavePoolDataInput {
  title: string
  creatorName: string
  description: string
  format: string
  sport: string
  league: string
  sideOptions: string
  participantNames: string
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
  return {
    id: cachedEvent.id,
    name: cachedEvent.eventTitle,
    shortName: `${cachedEvent.awayTeam.abbreviation || cachedEvent.awayTeam.shortName} @ ${cachedEvent.homeTeam.abbreviation || cachedEvent.homeTeam.shortName}`,
    status: cachedEvent.shortStatus,
    sport: cachedEvent.sport,
    league: cachedEvent.league,
    competitors: [
      {
        name: cachedEvent.awayTeam.name,
        abbreviation: cachedEvent.awayTeam.abbreviation,
        score: cachedEvent.awayTeam.score,
        homeAway: 'away',
      },
      {
        name: cachedEvent.homeTeam.name,
        abbreviation: cachedEvent.homeTeam.abbreviation,
        score: cachedEvent.homeTeam.score,
        homeAway: 'home',
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
  const acceptedParticipants = participants.filter((participant) => participant.joinStatus !== 'pending')

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

  rows.sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
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
  const [wager] = await db.select().from(napkinbetsWagers).where(eq(napkinbetsWagers.id, wagerId)).limit(1)

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
  const existingWagers = await db.select().from(napkinbetsWagers).limit(1)
  if (existingWagers.length > 0) {
    return
  }

  const createdAt = nowIso()
  const sportsWagerId = crypto.randomUUID()
  const golfWagerId = crypto.randomUUID()
  const sportsParticipantIds = {
    avery: crypto.randomUUID(),
    jules: crypto.randomUUID(),
    marco: crypto.randomUUID(),
    nina: crypto.randomUUID(),
  }
  const golfParticipantIds = {
    maddie: crypto.randomUUID(),
    trey: crypto.randomUUID(),
    kelsey: crypto.randomUUID(),
    omar: crypto.randomUUID(),
  }

  await db.insert(napkinbetsWagers).values([
    {
      id: sportsWagerId,
      ownerUserId: null,
      slug: 'sunday-showdown-pool',
      title: 'Sunday Showdown Pool',
      description:
        'Spin up sides for tonight’s slate, add one prop, and settle after the final whistle without leaving the group chat.',
      category: 'sports',
      format: 'sports-game',
      sport: 'basketball',
      league: 'nba',
      status: 'live',
      creatorName: 'Avery',
      sideOptionsJson: JSON.stringify([
        'Home team moneyline',
        'Away team moneyline',
        'First to 25 points',
      ]),
      entryFeeCents: 2500,
      paymentService: 'Venmo',
      paymentHandle: '@avery-bets',
      terms:
        'Friendly wager only. Napkinbets records the terms and reminders, but everyone settles manually after the result is official.',
      venueName: 'East Austin watch party',
      latitude: '30.2672',
      longitude: '-97.7431',
      eventSource: 'espn',
      eventId: '',
      eventTitle: 'Tonight NBA slate',
      eventStartsAt: createdAt,
      eventStatus: 'live',
      homeTeamName: 'Atlanta Hawks',
      awayTeamName: 'Orlando Magic',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: golfWagerId,
      ownerUserId: null,
      slug: 'napkin-masters-draft',
      title: 'Napkin Masters Draft',
      description:
        'A golf-pool prototype inspired by the original Apps Script flow: random draft order, multiple pots, leaderboard, and weather context.',
      category: 'golf',
      format: 'golf-draft',
      sport: 'golf',
      league: 'pga',
      status: 'open',
      creatorName: 'Maddie',
      sideOptionsJson: JSON.stringify([
        'Lowest round',
        'Birdie streak bonus',
        'Closest-to-pin side pot',
      ]),
      entryFeeCents: 1500,
      paymentService: 'PayPal',
      paymentHandle: 'maddie-pool@example.com',
      terms:
        'Draft picks and payouts are tracked here; all transfers happen manually through PayPal once the round wraps.',
      venueName: 'Back patio range night',
      latitude: '33.5037',
      longitude: '-82.0209',
      eventSource: 'manual',
      eventId: '',
      eventTitle: 'Napkin Masters Draft',
      eventStartsAt: createdAt,
      eventStatus: 'open',
      homeTeamName: '',
      awayTeamName: '',
      createdAt,
      updatedAt: createdAt,
    },
  ])

  await db.insert(napkinbetsParticipants).values([
    {
      id: sportsParticipantIds.jules,
      wagerId: sportsWagerId,
      userId: null,
      displayName: 'Jules',
      sideLabel: 'Away team moneyline',
      joinStatus: 'accepted',
      draftOrder: 1,
      paymentStatus: 'confirmed',
      paymentReference: 'VENMO-JULES-118',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: sportsParticipantIds.avery,
      wagerId: sportsWagerId,
      userId: null,
      displayName: 'Avery',
      sideLabel: 'Home team moneyline',
      joinStatus: 'accepted',
      draftOrder: 2,
      paymentStatus: 'confirmed',
      paymentReference: 'VENMO-AVERY-902',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: sportsParticipantIds.nina,
      wagerId: sportsWagerId,
      userId: null,
      displayName: 'Nina',
      sideLabel: 'Home team moneyline',
      joinStatus: 'accepted',
      draftOrder: 3,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: sportsParticipantIds.marco,
      wagerId: sportsWagerId,
      userId: null,
      displayName: 'Marco',
      sideLabel: 'First to 25 points',
      joinStatus: 'pending',
      draftOrder: 4,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: golfParticipantIds.trey,
      wagerId: golfWagerId,
      userId: null,
      displayName: 'Trey',
      sideLabel: 'Lowest round',
      joinStatus: 'accepted',
      draftOrder: 1,
      paymentStatus: 'confirmed',
      paymentReference: 'PAYPAL-TREY-441',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: golfParticipantIds.kelsey,
      wagerId: golfWagerId,
      userId: null,
      displayName: 'Kelsey',
      sideLabel: 'Birdie streak bonus',
      joinStatus: 'accepted',
      draftOrder: 2,
      paymentStatus: 'confirmed',
      paymentReference: 'PAYPAL-KELSEY-118',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: golfParticipantIds.maddie,
      wagerId: golfWagerId,
      userId: null,
      displayName: 'Maddie',
      sideLabel: 'Closest-to-pin side pot',
      joinStatus: 'accepted',
      draftOrder: 3,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: golfParticipantIds.omar,
      wagerId: golfWagerId,
      userId: null,
      displayName: 'Omar',
      sideLabel: 'Lowest round',
      joinStatus: 'accepted',
      draftOrder: 4,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    },
  ])

  await db.insert(napkinbetsPots).values([
    { id: crypto.randomUUID(), wagerId: sportsWagerId, label: 'Winner', amountCents: 6000, sortOrder: 0 },
    { id: crypto.randomUUID(), wagerId: sportsWagerId, label: 'Prop bonus', amountCents: 2500, sortOrder: 1 },
    { id: crypto.randomUUID(), wagerId: sportsWagerId, label: 'Late cover hedge', amountCents: 1500, sortOrder: 2 },
    { id: crypto.randomUUID(), wagerId: golfWagerId, label: 'Draft winner', amountCents: 3000, sortOrder: 0 },
    { id: crypto.randomUUID(), wagerId: golfWagerId, label: 'Low round', amountCents: 2000, sortOrder: 1 },
    { id: crypto.randomUUID(), wagerId: golfWagerId, label: 'Closest pin', amountCents: 1000, sortOrder: 2 },
  ])

  await db.insert(napkinbetsPicks).values([
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.avery,
      pickLabel: 'Hawks close late',
      pickType: 'team',
      pickValue: 'ATL moneyline',
      confidence: 4,
      liveScore: 10,
      outcome: 'winning',
      sortOrder: 0,
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.jules,
      pickLabel: 'Magic first quarter push',
      pickType: 'prop',
      pickValue: 'ORL first quarter',
      confidence: 3,
      liveScore: 7,
      outcome: 'pending',
      sortOrder: 1,
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.nina,
      pickLabel: 'Home side parlay leg',
      pickType: 'team',
      pickValue: 'Home moneyline',
      confidence: 2,
      liveScore: 5,
      outcome: 'pending',
      sortOrder: 2,
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: golfWagerId,
      participantId: golfParticipantIds.trey,
      pickLabel: 'Scheffler anchor',
      pickType: 'golfer',
      pickValue: 'Scottie Scheffler',
      confidence: 5,
      liveScore: 11,
      outcome: 'winning',
      sortOrder: 0,
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: golfWagerId,
      participantId: golfParticipantIds.kelsey,
      pickLabel: 'Hovland birdie run',
      pickType: 'golfer',
      pickValue: 'Viktor Hovland',
      confidence: 4,
      liveScore: 8,
      outcome: 'pending',
      sortOrder: 1,
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: golfWagerId,
      participantId: golfParticipantIds.omar,
      pickLabel: 'Low-round flyer',
      pickType: 'golfer',
      pickValue: 'Tommy Fleetwood',
      confidence: 3,
      liveScore: 6,
      outcome: 'pending',
      sortOrder: 2,
      createdAt,
    },
  ])

  await db.insert(napkinbetsSettlements).values([
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.avery,
      amountCents: 2500,
      method: 'Venmo',
      handle: '@avery-bets',
      confirmationCode: 'VENMO-AVERY-902',
      note: 'Entry fee posted before tip-off.',
      verificationStatus: 'confirmed',
      verifiedByUserId: null,
      verifiedAt: createdAt,
      recordedAt: createdAt,
    },
    {
      id: crypto.randomUUID(),
      wagerId: golfWagerId,
      participantId: golfParticipantIds.trey,
      amountCents: 1500,
      method: 'PayPal',
      handle: 'maddie-pool@example.com',
      confirmationCode: 'PAYPAL-TREY-441',
      note: 'Paid after draft order locked.',
      verificationStatus: 'confirmed',
      verifiedByUserId: null,
      verifiedAt: createdAt,
      recordedAt: createdAt,
    },
  ])

  await db.insert(napkinbetsNotifications).values([
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.marco,
      kind: 'acceptance',
      title: 'Marco still needs to accept',
      body: 'Queue a reminder before lock so the last side gets filled.',
      deliveryStatus: 'queued',
      scheduledFor: createdAt,
      createdAt,
      sentAt: null,
    },
    {
      id: crypto.randomUUID(),
      wagerId: sportsWagerId,
      participantId: sportsParticipantIds.nina,
      kind: 'settlement',
      title: 'Nina still owes entry',
      body: 'Manual transfer pending through Venmo before the payout is final.',
      deliveryStatus: 'queued',
      scheduledFor: createdAt,
      createdAt,
      sentAt: null,
    },
    {
      id: crypto.randomUUID(),
      wagerId: golfWagerId,
      participantId: golfParticipantIds.maddie,
      kind: 'results',
      title: 'Results-ready reminder drafted',
      body: 'Leaderboard and closest-pin bonus update automatically after the next refresh.',
      deliveryStatus: 'queued',
      scheduledFor: createdAt,
      createdAt,
      sentAt: null,
    },
  ])
}

export async function loadPoolData(event: H3Event, options: LoadPoolDataOptions = {}) {
  await ensureSeedData(event)

  const db = useAppDatabase(event)
  const [wagers, participants, pots, picks, notifications, settlements] = await Promise.all([
    db.select().from(napkinbetsWagers).orderBy(asc(napkinbetsWagers.createdAt)),
    db.select().from(napkinbetsParticipants).orderBy(asc(napkinbetsParticipants.createdAt)),
    db.select().from(napkinbetsPots).orderBy(asc(napkinbetsPots.sortOrder)),
    db.select().from(napkinbetsPicks).orderBy(asc(napkinbetsPicks.sortOrder)),
    db.select().from(napkinbetsNotifications).orderBy(asc(napkinbetsNotifications.createdAt)),
    db.select().from(napkinbetsSettlements).orderBy(asc(napkinbetsSettlements.recordedAt)),
  ])

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

    const weatherPromises: Array<
      Promise<readonly [string, NapkinbetsWeatherSnapshot | null]>
    > = []
    for (const [weatherKey, request] of weatherRequests.entries()) {
      weatherPromises.push(
        getWeatherForecast(request.latitude, request.longitude, request.label).then((forecast) => [
          weatherKey,
          forecast,
        ] as const),
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
    const eventContext = wager.eventId ? cachedEventsById.get(wager.eventId) ?? null : null

    serializedWagers.push({
      id: wager.id,
      ownerUserId: wager.ownerUserId ?? null,
      slug: wager.slug,
      title: wager.title,
      description: wager.description,
      category: wager.category,
      format: wager.format,
      sport: wager.sport,
      league: wager.league,
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
  const participantNames = normalizeList(input.participantNames)
  if (!participantNames.some((participant) => participant.toLowerCase() === creatorName.toLowerCase())) {
    participantNames.unshift(creatorName)
  }

  const shuffledParticipants = shuffleList(participantNames)
  const totalPotCents = shuffledParticipants.length * entryFeeCents
  const potRules = parsePotRules(input.potRules, totalPotCents)
  const slugBase = slugify(input.title) || 'napkinbets-wager'
  const slug = `${slugBase}-${wagerId.slice(0, 6)}`

  await db.insert(napkinbetsWagers).values({
    id: wagerId,
    ownerUserId: authUser.id,
    slug,
    title: input.title,
    description: input.description,
    category: input.format.includes('golf') ? 'golf' : input.sport || 'custom',
    format: input.format,
    sport: input.sport,
    league: input.league,
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
  for (let index = 0; index < shuffledParticipants.length; index++) {
    const displayName = shuffledParticipants[index]!
    participantsToInsert.push({
      id: crypto.randomUUID(),
      wagerId,
      userId: displayName.toLowerCase() === creatorName.toLowerCase() ? authUser.id : null,
      displayName,
      sideLabel: sideOptions[index % sideOptions.length] ?? sideOptions[0] ?? 'Open side',
      joinStatus: 'accepted',
      draftOrder: index + 1,
      paymentStatus: displayName.toLowerCase() === creatorName.toLowerCase() ? 'confirmed' : 'pending',
      paymentReference: null,
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
      createdAt,
      updatedAt: createdAt,
    })
    participant = {
      id: participantId,
      wagerId,
      userId: authUser.id,
      displayName: input.participantName.trim(),
      sideLabel: 'Open side',
      joinStatus: 'accepted',
      draftOrder: draftOrder + 1,
      paymentStatus: 'pending',
      paymentReference: null,
      createdAt,
      updatedAt: createdAt,
    }
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
        (row) => row.displayName.trim().toLowerCase() === input.participantName.trim().toLowerCase(),
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
    note.trim() || 'Proof needs a clearer handle, amount, or confirmation reference before closeout.'

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

import type { H3Event } from 'h3'
import { createError } from 'h3'
import { asc, eq, inArray, sql } from 'drizzle-orm'
import {
  napkinbetsGroups,
  napkinbetsNotifications,
  napkinbetsParticipants,
  napkinbetsPicks,
  napkinbetsPots,
  napkinbetsSettlements,
  napkinbetsWagerLegs,
  napkinbetsWagers,
} from '#server/database/schema'
import { users } from '#layer/server/database/schema'
import { requireAuth } from '#layer/server/utils/auth'

import type { NapkinbetsWeatherSnapshot } from '#server/services/napkinbets/live'
import { loadCachedEventsByIds, loadFeaturedLiveGames } from '#server/services/napkinbets/events'

import { computeScoringResult } from '#server/services/napkinbets/scoring'
import { useAppDatabase } from '#server/utils/database'

// Demo seed data extracted to seed.ts
import { ensureSeedData } from '#server/services/napkinbets/seed'

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
  scoringRule?: string
  scoringConfigJson?: string
  legs?: Array<{
    questionText: string
    legType?: string
    options?: string[]
    numericUnit?: string
    numericPrecision?: number
  }>
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
  wagerLegId?: string
  pickNumericValue?: number
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
  slug?: string
  userId?: string
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
export { ensureSeedData }

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

/**
 * Event context for resolving pick outcomes at read time.
 * Only provided when the wager is backed by an event with live score data.
 */
interface EventResultContext {
  state: string
  homeTeamName: string
  awayTeamName: string
  homeScore: string
  awayScore: string
  /** ESPN-provided winner flag on home team */
  homeWinner: boolean
  /** ESPN-provided winner flag on away team */
  awayWinner: boolean
}

/**
 * Resolve pick outcomes at leaderboard-read time by comparing each
 * participant's sideLabel / pickValue against the winning team.
 *
 * This is a pure function — it returns enriched pick copies and does NOT
 * mutate the database. Picks with an already-resolved outcome (not 'pending')
 * are passed through unchanged.
 */
function resolveEventPickOutcomes(
  picks: Array<typeof napkinbetsPicks.$inferSelect>,
  participants: Array<typeof napkinbetsParticipants.$inferSelect>,
  eventContext: EventResultContext | null,
) {
  // Only resolve when the event is finished
  if (!eventContext || eventContext.state !== 'post') return picks

  // Determine the winning team name from ESPN winner flags or score comparison
  let winningTeamName: string | null = null
  if (eventContext.homeWinner) {
    winningTeamName = eventContext.homeTeamName
  } else if (eventContext.awayWinner) {
    winningTeamName = eventContext.awayTeamName
  } else {
    // Fallback: compare scores numerically
    const home = Number(eventContext.homeScore)
    const away = Number(eventContext.awayScore)
    if (!Number.isNaN(home) && !Number.isNaN(away) && home !== away) {
      winningTeamName = home > away ? eventContext.homeTeamName : eventContext.awayTeamName
    }
  }

  // If we can't determine a winner (actual tie / missing data), leave picks as-is
  if (!winningTeamName) return picks

  // Build participant id → sideLabel lookup
  const sideLabelByParticipantId = new Map(
    participants.map((p) => [p.id, (p.sideLabel ?? '').toLowerCase()]),
  )

  const winnerLower = winningTeamName.toLowerCase()

  return picks.map((pick) => {
    // Only resolve picks that are still pending
    if (pick.outcome !== 'pending') return pick

    // Check pickValue first, fall back to participant's sideLabel
    const pickTeam =
      (pick.pickValue ?? '').toLowerCase() || sideLabelByParticipantId.get(pick.participantId) || ''

    if (!pickTeam) return pick

    // Match against winning team name (exact or substring/contains for partial names)
    const isWinner =
      pickTeam === winnerLower || winnerLower.includes(pickTeam) || pickTeam.includes(winnerLower)

    return {
      ...pick,
      outcome: isWinner ? 'won' : 'lost',
      liveScore: isWinner ? pick.liveScore + 10 : 0,
    }
  })
}

function computeLeaderboard(
  participants: Array<typeof napkinbetsParticipants.$inferSelect>,
  picks: Array<typeof napkinbetsPicks.$inferSelect>,
  pots: Array<typeof napkinbetsPots.$inferSelect>,
  settlements: Array<typeof napkinbetsSettlements.$inferSelect>,
  legs: Array<typeof napkinbetsWagerLegs.$inferSelect> = [],
  scoringRule = 'proportional',
  scoringConfigJson = '{}',
  eventContext: EventResultContext | null = null,
) {
  const acceptedParticipants = participants.filter(
    (participant) => participant.joinStatus !== 'pending',
  )

  // Resolve pick outcomes from event result before scoring
  const resolvedPicks = resolveEventPickOutcomes(picks, participants, eventContext)

  // Use scoring engine for all rules (proportional strategy matches legacy math)
  const result = computeScoringResult(
    scoringRule,
    acceptedParticipants.map((p) => ({
      id: p.id,
      joinStatus: p.joinStatus,
      draftOrder: p.draftOrder ?? null,
    })),
    resolvedPicks.map((p) => ({
      participantId: p.participantId,
      wagerLegId: p.wagerLegId ?? null,
      pickValue: p.pickValue ?? null,
      pickNumericValue: p.pickNumericValue ?? null,
      liveScore: p.liveScore,
      outcome: p.outcome,
    })),
    legs.map((l) => ({
      id: l.id,
      sortOrder: l.sortOrder,
      legType: l.legType as 'categorical' | 'numeric',
      outcomeStatus: l.outcomeStatus as 'pending' | 'settled' | 'voided',
      outcomeOptionKey: l.outcomeOptionKey ?? null,
      outcomeNumericValue: l.outcomeNumericValue ?? null,
    })),
    pots.map((p) => ({ amountCents: p.amountCents })),
    scoringConfigJson,
  )

  const rows: SerializedLeaderboardRow[] = []

  for (const standing of result.standings) {
    const participant = acceptedParticipants.find((p) => p.id === standing.participantId)
    if (!participant) continue

    const participantPicks = picks.filter((pick) => pick.participantId === participant.id)
    const participantSettlements = settlements.filter(
      (settlement) => settlement.participantId === participant.id,
    )

    rows.push({
      participantId: participant.id,
      displayName: participant.displayName,
      sideLabel: participant.sideLabel ?? 'Open side',
      draftOrder: participant.draftOrder ?? null,
      score: standing.score,
      pickCount: participantPicks.length,
      projectedPayoutCents: result.payouts.get(participant.id) ?? 0,
      confirmedSettlementCents: participantSettlements.reduce(
        (sum, settlement) => sum + settlement.amountCents,
        0,
      ),
    })
  }

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
    message: 'Only the bet host or an admin can manage this wager.',
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

export async function loadPoolData(event: H3Event, options: LoadPoolDataOptions = {}) {
  await ensureSeedData(event)

  const db = useAppDatabase(event)
  let wagers: (typeof napkinbetsWagers.$inferSelect)[] = []

  if (options.slug) {
    wagers = await db
      .select()
      .from(napkinbetsWagers)
      .where(eq(napkinbetsWagers.slug, options.slug))
      .limit(1)
  } else if (options.userId) {
    const [ownedWagers, participantRows] = await Promise.all([
      db
        .select({ id: napkinbetsWagers.id })
        .from(napkinbetsWagers)
        .where(eq(napkinbetsWagers.ownerUserId, options.userId)),
      db
        .select({ wagerId: napkinbetsParticipants.wagerId })
        .from(napkinbetsParticipants)
        .where(eq(napkinbetsParticipants.userId, options.userId)),
    ])

    const wagerIds = [
      ...new Set([
        ...ownedWagers.map((wager) => wager.id),
        ...participantRows.map((row) => row.wagerId),
      ]),
    ]

    wagers =
      wagerIds.length > 0
        ? await db
            .select()
            .from(napkinbetsWagers)
            .where(inArray(napkinbetsWagers.id, wagerIds))
            .orderBy(asc(napkinbetsWagers.createdAt))
        : []
  } else {
    wagers = await db.select().from(napkinbetsWagers).orderBy(asc(napkinbetsWagers.createdAt))
  }

  const wagerIds = wagers.map((wager) => wager.id)
  const groupIds = [
    ...new Set(wagers.map((wager) => wager.groupId).filter((id): id is string => Boolean(id))),
  ]

  const groups =
    groupIds.length > 0
      ? await db.select().from(napkinbetsGroups).where(inArray(napkinbetsGroups.id, groupIds))
      : []
  const [participants, pots, picks, notifications, settlements, wagerLegs] =
    wagerIds.length > 0
      ? await Promise.all([
          db
            .select()
            .from(napkinbetsParticipants)
            .where(inArray(napkinbetsParticipants.wagerId, wagerIds))
            .orderBy(asc(napkinbetsParticipants.createdAt)),
          db
            .select()
            .from(napkinbetsPots)
            .where(inArray(napkinbetsPots.wagerId, wagerIds))
            .orderBy(asc(napkinbetsPots.sortOrder)),
          db
            .select()
            .from(napkinbetsPicks)
            .where(inArray(napkinbetsPicks.wagerId, wagerIds))
            .orderBy(asc(napkinbetsPicks.sortOrder)),
          db
            .select()
            .from(napkinbetsNotifications)
            .where(inArray(napkinbetsNotifications.wagerId, wagerIds))
            .orderBy(asc(napkinbetsNotifications.createdAt)),
          db
            .select()
            .from(napkinbetsSettlements)
            .where(inArray(napkinbetsSettlements.wagerId, wagerIds))
            .orderBy(asc(napkinbetsSettlements.recordedAt)),
          db
            .select()
            .from(napkinbetsWagerLegs)
            .where(inArray(napkinbetsWagerLegs.wagerId, wagerIds))
            .orderBy(asc(napkinbetsWagerLegs.sortOrder)),
        ])
      : [[], [], [], [], [], []]

  const groupNamesById = new Map(groups.map((group) => [group.id, group.name]))

  // Build userId → avatarUrl lookup from the users table
  const participantUserIds = [
    ...new Set(participants.map((p) => p.userId).filter((id): id is string => Boolean(id))),
  ]
  const userAvatars = new Map<string, string>()
  if (participantUserIds.length) {
    const userRows = await db
      .select({
        id: users.id,
        avatarUrl: sql<string>`avatar_url`.as('avatar_url'),
      })
      .from(users)
      .where(inArray(users.id, participantUserIds))
    for (const row of userRows) {
      if (row.avatarUrl) {
        userAvatars.set(row.id, row.avatarUrl)
      }
    }
  }

  const weatherSnapshots = new Map<string, NapkinbetsWeatherSnapshot>()
  const cachedEventIds = wagers
    .map((wager) => wager.eventId ?? '')
    .filter((eventId): eventId is string => Boolean(eventId))

  // Always load cached events (cheap DB query needed for logos and live scores)
  const cachedEventsById =
    cachedEventIds.length > 0 ? await loadCachedEventsByIds(event, cachedEventIds) : new Map()

  const featuredLiveGames =
    options.includeContext !== false ? await loadFeaturedLiveGames(event) : []

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
    const wagerLegRows = wagerLegs.filter((leg) => leg.wagerId === wager.id)
    const eventContext = wager.eventId ? (cachedEventsById.get(wager.eventId) ?? null) : null

    // Build event result context for pick outcome resolution
    const eventResultContext: EventResultContext | null = eventContext
      ? {
          state: eventContext.state,
          homeTeamName: wager.homeTeamName ?? '',
          awayTeamName: wager.awayTeamName ?? '',
          homeScore: eventContext.homeTeam.score,
          awayScore: eventContext.awayTeam.score,
          homeWinner: eventContext.homeTeam.winner,
          awayWinner: eventContext.awayTeam.winner,
        }
      : null

    const leaderboard = computeLeaderboard(
      wagerParticipants,
      wagerPicks,
      wagerPots,
      wagerSettlements,
      wagerLegRows,
      wager.scoringRule,
      wager.scoringConfigJson,
      eventResultContext,
    )
    const weatherKey = `${wager.latitude ?? ''}:${wager.longitude ?? ''}:${wager.venueName ?? ''}`

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
      eventStatus: eventContext?.status ?? wager.eventStatus ?? '',
      eventState: eventContext?.state ?? wager.eventState ?? '',
      homeScore: eventContext?.homeTeam.score ?? wager.homeScore ?? '',
      awayScore: eventContext?.awayTeam.score ?? wager.awayScore ?? '',
      homeTeamName: wager.homeTeamName ?? '',
      awayTeamName: wager.awayTeamName ?? '',
      homeTeamLogo: eventContext?.homeTeam.logo ?? '',
      awayTeamLogo: eventContext?.awayTeam.logo ?? '',
      scoringRule: wager.scoringRule as 'proportional',
      participants: wagerParticipants.map((p) => ({
        ...p,
        avatarUrl: p.avatarUrl || (p.userId ? (userAvatars.get(p.userId) ?? '') : ''),
      })),
      pots: wagerPots,
      picks: wagerPicks,
      legs: wagerLegRows.map((leg) => ({
        id: leg.id,
        sortOrder: leg.sortOrder,
        questionText: leg.questionText,
        legType: leg.legType as 'categorical' | 'numeric',
        options: parseJsonArray(leg.optionsJson),
        numericUnit: leg.numericUnit ?? null,
        numericPrecision: leg.numericPrecision ?? 0,
        outcomeStatus: leg.outcomeStatus as 'pending' | 'settled' | 'voided',
        outcomeOptionKey: leg.outcomeOptionKey ?? null,
        outcomeNumericValue: leg.outcomeNumericValue ?? null,
      })),
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
      hint: 'live friendly bets',
      icon: 'i-lucide-ticket',
    },
    {
      label: 'Participants tracked',
      value: String(
        participants.filter((participant) => participant.joinStatus === 'accepted').length,
      ),
      hint: 'accepted on a bet',
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
    input.participantSeeds
      ?.map((participant) => ({
        displayName: participant.displayName.trim(),
        userId: participant.userId?.trim() || null,
      }))
      .filter((participant) => participant.displayName) ?? []
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
    scoringRule: input.scoringRule || 'proportional',
    scoringConfigJson: input.scoringConfigJson || '{}',
    createdAt,
    updatedAt: createdAt,
  })

  const participantsToInsert = []
  for (let index = 0; index < orderedParticipants.length; index++) {
    const participant = orderedParticipants[index]!
    const displayName = participant.displayName
    const isCreator = participant.userId === authUser.id
    const isSimpleBet = input.napkinType === 'simple-bet'
    participantsToInsert.push({
      id: crypto.randomUUID(),
      wagerId,
      userId: participant.userId,
      displayName,
      sideLabel: sideOptions[index % sideOptions.length] ?? sideOptions[0] ?? 'Open side',
      joinStatus: isCreator || !isSimpleBet ? 'accepted' : 'invited',
      draftOrder: index + 1,
      paymentStatus: isCreator ? 'confirmed' : 'pending',
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

  // Persist wager legs if provided
  if (input.legs && input.legs.length > 0) {
    const legsToInsert = input.legs.map((leg, index) => ({
      id: crypto.randomUUID(),
      wagerId,
      sortOrder: index,
      questionText: leg.questionText,
      legType: leg.legType || 'categorical',
      optionsJson: JSON.stringify(leg.options ?? []),
      numericUnit: leg.numericUnit ?? null,
      numericPrecision: leg.numericPrecision ?? 0,
      outcomeStatus: 'pending',
      outcomeOptionKey: null,
      outcomeNumericValue: null,
      createdAt,
      updatedAt: createdAt,
    }))
    await db.insert(napkinbetsWagerLegs).values(legsToInsert)
  }

  await createNotification(
    event,
    wagerId,
    'Wager created',
    `${creatorName} set the bet${input.napkinType === 'simple-bet' ? '' : ' and randomized the draft order'}.`,
    'system',
  )

  if (input.napkinType !== 'simple-bet') {
    await createNotification(
      event,
      wagerId,
      'Reminder queue ready',
      `Use ${input.paymentService} manually for settlement once results lock.`,
      'reminder',
    )
  }

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

    // Auto-transition: one-on-one bets lock when both seats are filled
    if (wager.napkinType === 'simple-bet' && wager.status === 'open') {
      const updatedRows = await db
        .select()
        .from(napkinbetsParticipants)
        .where(eq(napkinbetsParticipants.wagerId, wagerId))

      const acceptedCount = updatedRows.filter((p) => p.joinStatus === 'accepted').length

      if (acceptedCount >= 2) {
        await db
          .update(napkinbetsWagers)
          .set({ status: 'locked', updatedAt: createdAt })
          .where(eq(napkinbetsWagers.id, wagerId))

        await createNotification(
          event,
          wagerId,
          'Bet locked',
          'Both players are in — add picks and confirm payment.',
          'system',
        )
      }
    }

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

  // Auto-transition: one-on-one bets lock when both seats are filled
  if (wager.napkinType === 'simple-bet' && wager.status === 'open') {
    const updatedParticipants = await db
      .select()
      .from(napkinbetsParticipants)
      .where(eq(napkinbetsParticipants.wagerId, wagerId))

    const acceptedCount = updatedParticipants.filter((p) => p.joinStatus === 'accepted').length

    if (acceptedCount >= 2) {
      await db
        .update(napkinbetsWagers)
        .set({ status: 'locked', updatedAt: createdAt })
        .where(eq(napkinbetsWagers.id, wagerId))

      await createNotification(
        event,
        wagerId,
        'Bet locked',
        'Both players are in — add picks and confirm payment.',
        'system',
      )
    }
  }

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
    wagerLegId: input.wagerLegId || null,
    pickNumericValue: input.pickNumericValue ?? null,
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

  const settlementId = crypto.randomUUID()

  await db.insert(napkinbetsSettlements).values({
    id: settlementId,
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

  return { ok: true, settlementId }
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
    'A host verified submitted payment proof.',
    'settlement',
    settlement.participantId,
  )

  return { ok: true }
}

export async function acknowledgeSettlement(event: H3Event, wagerId: string, settlementId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const settlement = await getSettlementOrThrow(event, settlementId)

  if (settlement.wagerId !== wagerId) {
    throw createError({ statusCode: 400, message: 'Settlement does not belong to this wager.' })
  }

  const participants = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  const ackUser = participants.find((p) => p.userId === authUser.id)

  if (!ackUser && !authUser.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'You must be a participant to acknowledge this payment.',
    })
  }

  if (settlement.participantId === ackUser?.id && !authUser.isAdmin) {
    throw createError({ statusCode: 400, message: 'You cannot acknowledge your own payment.' })
  }

  const acknowledgedAt = nowIso()

  await db
    .update(napkinbetsSettlements)
    .set({
      recipientAcknowledged: true,
      recipientAcknowledgedAt: acknowledgedAt,
      recipientUserId: authUser.id,
    })
    .where(eq(napkinbetsSettlements.id, settlementId))

  const payer = participants.find((p) => p.id === settlement.participantId)

  await createNotification(
    event,
    wagerId,
    'Payment received',
    `${ackUser?.displayName || authUser.name} confirmed receiving payment from ${payer?.displayName || 'a player'}.`,
    'settlement',
    settlement.participantId,
  )

  // If we are playing a simple-bet (1v1) and the other person acknowledges,
  // we can auto-confirm the settlement safely.
  const wager = await getWagerOrThrow(event, wagerId)
  if (wager.napkinType === 'simple-bet' && settlement.verificationStatus !== 'confirmed') {
    await db
      .update(napkinbetsSettlements)
      .set({
        verificationStatus: 'confirmed',
        verifiedByUserId: authUser.id,
        verifiedAt: acknowledgedAt,
        rejectedByUserId: null,
        rejectedAt: null,
        rejectionNote: null,
      })
      .where(eq(napkinbetsSettlements.id, settlementId))

    await db
      .update(napkinbetsParticipants)
      .set({
        paymentStatus: 'confirmed',
        updatedAt: acknowledgedAt,
      })
      .where(eq(napkinbetsParticipants.id, settlement.participantId))
  }

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
    'The draft order was reshuffled for this bet.',
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

export async function declineWager(event: H3Event, wagerId: string) {
  const authUser = await requireAuth(event)
  const db = useAppDatabase(event)
  const wager = await getWagerOrThrow(event, wagerId)

  const participants = await db
    .select()
    .from(napkinbetsParticipants)
    .where(eq(napkinbetsParticipants.wagerId, wagerId))

  const myParticipant = participants.find((p) => p.userId === authUser.id)

  if (!myParticipant) {
    throw createError({ statusCode: 404, message: 'You are not a participant in this bet.' })
  }

  if (myParticipant.joinStatus === 'accepted') {
    throw createError({
      statusCode: 400,
      message: 'You have already accepted this bet. Contact the host to leave.',
    })
  }

  await db.delete(napkinbetsParticipants).where(eq(napkinbetsParticipants.id, myParticipant.id))

  await createNotification(
    event,
    wagerId,
    'Invitation declined',
    `${myParticipant.displayName} declined the bet.`,
    'acceptance',
  )

  // Ensure wager stays open if a one-on-one loses a participant
  if (wager.napkinType === 'simple-bet' && wager.status === 'locked') {
    await db
      .update(napkinbetsWagers)
      .set({ status: 'open', updatedAt: nowIso() })
      .where(eq(napkinbetsWagers.id, wagerId))
  }

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

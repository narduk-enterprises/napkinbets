import type { H3Event } from 'h3'
import { inArray, eq } from 'drizzle-orm'
import {
  napkinbetsWagers,
  napkinbetsPicks,
  napkinbetsParticipants,
  napkinbetsNotifications,
} from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import type { NapkinbetsCachedEvent } from '#server/services/napkinbets/event-queries'

export function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function nowIso() {
  return new Date().toISOString()
}

export function evaluatePickOutcome(
  pickValue: string | null,
  cachedEvent: NapkinbetsCachedEvent,
  currentOutcome: string,
): string {
  const pickTeam = (pickValue || '').toLowerCase().trim()
  if (!pickTeam) return currentOutcome

  const homeName = cachedEvent.homeTeam.name.toLowerCase()
  const homeAbbr = (cachedEvent.homeTeam.abbreviation || '').toLowerCase()
  const awayName = cachedEvent.awayTeam.name.toLowerCase()
  const awayAbbr = (cachedEvent.awayTeam.abbreviation || '').toLowerCase()

  const isHomeMatch =
    pickTeam === homeName ||
    pickTeam === homeAbbr ||
    homeName.includes(pickTeam) ||
    pickTeam.includes(homeName)
  const isAwayMatch =
    pickTeam === awayName ||
    pickTeam === awayAbbr ||
    awayName.includes(pickTeam) ||
    pickTeam.includes(awayName)

  // Wait to determine if it's tied. Sometimes scores are stored as strings.
  const isTie = cachedEvent.homeTeam.score === cachedEvent.awayTeam.score

  if (isHomeMatch) {
    if (cachedEvent.homeTeam.winner) return 'won'
    if (cachedEvent.awayTeam.winner) return 'lost'
    if (isTie) return 'push'
  } else if (isAwayMatch) {
    if (cachedEvent.awayTeam.winner) return 'won'
    if (cachedEvent.homeTeam.winner) return 'lost'
    if (isTie) return 'push'
  }

  return currentOutcome
}

export async function autoSettleWagersForEvents(
  event: H3Event,
  completedEvents: NapkinbetsCachedEvent[],
) {
  if (completedEvents.length === 0) {
    return
  }

  const db = useAppDatabase(event)
  const eventIds = completedEvents.map((e) => e.id)
  const wagers: Array<{ id: string; eventId: string | null; status: string; title: string }> = []

  // Load wagers mapped to these completed events
  for (const chunk of chunkItems(eventIds, 50)) {
    const rows = await db
      .select({
        id: napkinbetsWagers.id,
        eventId: napkinbetsWagers.eventId,
        status: napkinbetsWagers.status,
        title: napkinbetsWagers.title,
      })
      .from(napkinbetsWagers)
      .where(inArray(napkinbetsWagers.eventId, chunk))
    wagers.push(...rows)
  }

  // Only consider wagers that are not yet settled/closed/archived
  const eligibleWagers = wagers.filter(
    (w) =>
      w.status === 'open' ||
      w.status === 'locked' ||
      w.status === 'live' ||
      w.status === 'settling',
  )

  if (eligibleWagers.length === 0) {
    return
  }

  const eligibleWagerIds = eligibleWagers.map((w) => w.id)
  const picks: Array<typeof napkinbetsPicks.$inferSelect> = []
  const participants: Array<{ id: string; userId: string | null }> = []

  for (const chunk of chunkItems(eligibleWagerIds, 50)) {
    const [pickRows, partRows] = await Promise.all([
      db.select().from(napkinbetsPicks).where(inArray(napkinbetsPicks.wagerId, chunk)),
      db
        .select({ id: napkinbetsParticipants.id, userId: napkinbetsParticipants.userId })
        .from(napkinbetsParticipants)
        .where(inArray(napkinbetsParticipants.wagerId, chunk)),
    ])
    picks.push(...pickRows)
    participants.push(...partRows)
  }

  const eventsById = new Map(completedEvents.map((e) => [e.id, e]))
  const now = nowIso()

  for (const wager of eligibleWagers) {
    if (!wager.eventId) continue
    const cachedEvent = eventsById.get(wager.eventId)
    if (!cachedEvent) continue

    const wagerPicks = picks.filter((p) => p.wagerId === wager.id)

    for (const pick of wagerPicks) {
      // Only auto-grade straightforward head-to-head or team picks
      if (pick.pickType === 'team' || pick.pickType === 'side' || pick.pickType === 'custom') {
        const newOutcome = evaluatePickOutcome(pick.pickValue, cachedEvent, pick.outcome)

        if (newOutcome !== pick.outcome) {
          await db
            .update(napkinbetsPicks)
            .set({
              outcome: newOutcome,
              liveScore: newOutcome === 'won' ? pick.liveScore + 10 : pick.liveScore,
            })
            .where(eq(napkinbetsPicks.id, pick.id))
            .run()
        }
      }
    }

    // Mark wager as settled
    await db
      .update(napkinbetsWagers)
      .set({ status: 'settled', updatedAt: now })
      .where(eq(napkinbetsWagers.id, wager.id))
      .run()

    // Notify all participants
    const wagerParticipants = participants.filter((p) =>
      picks.some((pk) => pk.wagerId === wager.id && pk.participantId === p.id),
    )
    for (const participant of wagerParticipants) {
      await db
        .insert(napkinbetsNotifications)
        .values({
          id: crypto.randomUUID(),
          wagerId: wager.id,
          participantId: participant.id,
          kind: 'results',
          title: `Results ready for ${wager.title}`,
          body: 'The event has finished. Check your payout and settle up!',
          deliveryStatus: 'queued',
          scheduledFor: now,
          createdAt: now,
        })
        .run()
    }
  }
}

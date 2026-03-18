import type { H3Event } from 'h3'
import { eq, or } from 'drizzle-orm'
import { napkinbetsEvents } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import { grokChat } from '#server/utils/grok'
import { getSystemPrompt } from '#server/utils/systemPrompts'
import { loadNapkinbetsAiSettings } from '#server/services/napkinbets/settings'
import type { NapkinbetsCachedEvent } from '#server/services/napkinbets/event-queries'

// ---------------------------------------------------------------------------
// Broadcast tier scoring
// ---------------------------------------------------------------------------

const NATIONAL_BROADCASTS = new Set([
  'espn',
  'espn2',
  'espn+',
  'abc',
  'fox',
  'fs1',
  'fs2',
  'nbc',
  'nbcsn',
  'tnt',
  'tbs',
  'cbs',
  'mlb network',
  'nfl network',
  'nba tv',
])

function scoreBroadcast(broadcast: string): number {
  if (!broadcast) return 0
  const lower = broadcast.toLowerCase()
  for (const network of NATIONAL_BROADCASTS) {
    if (lower.includes(network)) return 10
  }
  return 3
}

// ---------------------------------------------------------------------------
// League tier scoring (regular season > preseason/spring training)
// ---------------------------------------------------------------------------

const REGULAR_SEASON_KEYWORDS = [
  'regular',
  'postseason',
  'playoff',
  'wild card',
  'division',
  'championship',
  'world series',
  'super bowl',
  'finals',
]
const PRESEASON_KEYWORDS = ['spring training', 'preseason', 'exhibition', 'grapefruit', 'cactus']

function scoreLeagueTier(contextLabel: string, status: string): number {
  const lower = `${contextLabel} ${status}`.toLowerCase()
  for (const keyword of PRESEASON_KEYWORDS) {
    if (lower.includes(keyword)) return 2
  }
  for (const keyword of REGULAR_SEASON_KEYWORDS) {
    if (lower.includes(keyword)) return 10
  }
  return 6
}

// ---------------------------------------------------------------------------
// Team record scoring — higher combined win% = more important
// ---------------------------------------------------------------------------

function parseWinPercentage(record: string): number {
  if (!record) return 0.5
  const parts = record.split('-').map(Number)
  if (parts.length < 2 || !parts[0] || !parts[1]) return 0.5
  const wins = parts[0]
  const losses = parts[1]
  const total = wins + losses
  return total > 0 ? wins / total : 0.5
}

function scoreTeamRecords(homeRecord: string, awayRecord: string): number {
  const homeWin = parseWinPercentage(homeRecord)
  const awayWin = parseWinPercentage(awayRecord)
  const avgWin = (homeWin + awayWin) / 2
  return Math.round(avgWin * 10)
}

// ---------------------------------------------------------------------------
// Heuristic importance (0-40, no API call)
// ---------------------------------------------------------------------------

export function computeHeuristicImportance(event: NapkinbetsCachedEvent): number {
  const broadcastScore = scoreBroadcast(event.broadcast)
  const leagueTierScore = scoreLeagueTier(event.contextLabel, event.status)
  const recordScore = scoreTeamRecords(event.homeTeam?.record || '', event.awayTeam?.record || '')
  // Odds volume bonus: we don't have volume in the cached event, so skip for now
  const oddsScore = 0
  return Math.min(40, broadcastScore + leagueTierScore + recordScore + oddsScore)
}

// ---------------------------------------------------------------------------
// AI importance scoring (batch)
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50 // Increased to 50: gives Grok more grouped context for relative scoring

function serializeBatchForAi(batch: NapkinbetsCachedEvent[]): string {
  // We send a compact, pipe-delimited format to save tokens
  return batch
    .map((e) => {
      const parts = [
        e.id,
        e.sport,
        e.league,
        e.eventTitle,
        `${e.awayTeam.name} vs ${e.homeTeam.name}`,
        e.venueName,
        e.broadcast,
      ]
      return parts.join(' | ')
    })
    .join('\n')
}

/**
 * Sends a batch of events to Grok and parses the JSON response.
 */
async function scoreBatchWithAi(
  apiKey: string,
  model: string,
  batch: NapkinbetsCachedEvent[],
  systemPrompt: string,
): Promise<Map<string, { score: number; reason: string }>> {
  const result = new Map<string, { score: number; reason: string }>()
  if (batch.length === 0) return result

  const batchContext = serializeBatchForAi(batch)
  console.log(`[Importance AI] Scoring batch of ${batch.length} events...`)
  const startTime = Date.now()

  try {
    const aiResponse = await grokChat(
      apiKey,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: batchContext },
      ],
      model,
    )

    const durationMs = Date.now() - startTime
    console.log(`[Importance AI] Batch scored in ${durationMs}ms`)

    // The AI response should be a JSON array, either raw or wrapped in markdown
    let jsonString = aiResponse.trim()
    const jsonMatch = jsonString.match(/```json\n?([\s\S]*?)\n?```/)

    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim()
    }

    try {
      const parsed = JSON.parse(jsonString)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.eventId && typeof item.score === 'number' && typeof item.reason === 'string') {
            result.set(item.eventId, {
              score: Math.max(0, Math.min(60, item.score)), // Clamp 0-60
              reason: item.reason,
            })
          }
        }
      } else {
        console.warn('[Importance AI] Parsed JSON is not an array')
      }
    } catch (parseError) {
      console.warn('[Importance AI] Failed to parse JSON from Grok response:', parseError)
      console.log('[Importance AI] Raw Response:', aiResponse)
    }
  } catch (error) {
    console.error('[Importance AI] Batch scoring failed:', error)
  }

  return result
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scoreEventsWithAi(
  event: H3Event,
  options?: { forceAll?: boolean },
): Promise<{ scored: number; total?: number; error?: string; message?: string }> {
  const config = useRuntimeConfig(event)
  const settings = await loadNapkinbetsAiSettings(event)
  const db = useAppDatabase(event)

  if (!config.xaiApiKey) {
    return { scored: 0, error: 'xAI API key not configured' }
  }

  const model = settings.chatModel || config.xaiModel || 'grok-3-mini'
  const systemPrompt = await getSystemPrompt(event, 'event_importance')

  // Find events needing scoring: no score yet or stale (>12h old)
  const now = new Date()

  const queryRows = await db
    .select({
      id: napkinbetsEvents.id,
      source: napkinbetsEvents.source,
      sport: napkinbetsEvents.sport,
      sportLabel: napkinbetsEvents.sportLabel,
      contextKey: napkinbetsEvents.contextKey,
      contextLabel: napkinbetsEvents.contextLabel,
      league: napkinbetsEvents.league,
      leagueLabel: napkinbetsEvents.leagueLabel,
      eventTitle: napkinbetsEvents.eventTitle,
      summary: napkinbetsEvents.summary,
      status: napkinbetsEvents.status,
      state: napkinbetsEvents.state,
      shortStatus: napkinbetsEvents.shortStatus,
      startTime: napkinbetsEvents.startTime,
      venueName: napkinbetsEvents.venueName,
      venueLocation: napkinbetsEvents.venueLocation,
      broadcast: napkinbetsEvents.broadcast,
      homeTeamJson: napkinbetsEvents.homeTeamJson,
      awayTeamJson: napkinbetsEvents.awayTeamJson,
      leadersJson: napkinbetsEvents.leadersJson,
      ideasJson: napkinbetsEvents.ideasJson,
      importanceScore: napkinbetsEvents.importanceScore,
      importanceReason: napkinbetsEvents.importanceReason,
      lastSyncedAt: napkinbetsEvents.lastSyncedAt,
      sourceUpdatedAt: napkinbetsEvents.sourceUpdatedAt,
      importanceScoredAt: napkinbetsEvents.importanceScoredAt,
    })
    .from(napkinbetsEvents)
    .where(or(eq(napkinbetsEvents.state, 'in'), eq(napkinbetsEvents.state, 'pre')))

  // Filter to only stale/unscored events
  const staleRecords = options?.forceAll
    ? queryRows
    : queryRows.filter((row) => {
        if (!row.importanceScoredAt) return true
        const scoredAt = new Date(row.importanceScoredAt).getTime()
        return now.getTime() - scoredAt > 12 * 60 * 60 * 1000 // 12 hours
      })

  if (staleRecords.length === 0) {
    console.log('[Importance AI] No stale events found. Skipping scoring.')
    return { scored: 0, total: queryRows.length, message: 'All active events are fresh' }
  }

  console.log(
    `[Importance AI] Found ${staleRecords.length} events to process (forceAll: ${!!options?.forceAll})`,
  )

  // Load full cached events for context
  const { toCachedEvent } = await import('#server/services/napkinbets/event-queries')
  const cachedEvents = staleRecords.flatMap((row) => {
    const parsed = toCachedEvent(row as Parameters<typeof toCachedEvent>[0])
    return parsed ? [parsed] : []
  })

  // Process in batches
  let totalScored = 0
  const nowIso = new Date().toISOString()

  for (let i = 0; i < cachedEvents.length; i += BATCH_SIZE) {
    const batch = cachedEvents.slice(i, i + BATCH_SIZE)

    // Compute heuristic scores first
    const heuristicScores = new Map(batch.map((e) => [e.id, computeHeuristicImportance(e)]))

    // Get AI scores
    let aiScoreMap: Map<string, { score: number; reason: string }> = new Map()
    try {
      aiScoreMap = await scoreBatchWithAi(config.xaiApiKey, model, batch, systemPrompt)
    } catch (err) {
      console.warn('[importance] AI batch scoring failed, using heuristic only:', err)
    }

    // Update each event
    await Promise.all(
      // eslint-disable-next-line narduk/no-map-async-in-server -- Promise.all batching, not N+1
      batch.map(async (event) => {
        const heuristic = heuristicScores.get(event.id) ?? 0
        const ai = aiScoreMap.get(event.id)
        const aiScore = ai ? Math.min(60, Math.max(0, ai.score)) : 0
        const finalScore = heuristic + aiScore
        const reason = ai?.reason || ''

        await db
          .update(napkinbetsEvents)
          .set({
            importanceScore: finalScore,
            importanceReason: reason,
            importanceScoredAt: nowIso,
            updatedAt: nowIso,
          })
          .where(eq(napkinbetsEvents.id, event.id))

        totalScored++
      }),
    )
  }

  return { scored: totalScored, total: cachedEvents.length }
}

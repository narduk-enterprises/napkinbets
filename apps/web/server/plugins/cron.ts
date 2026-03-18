// ─── Cloudflare Scheduled Event Handler — Napkinbets Ingestion Crons ────────
//
// Dispatches Cloudflare cron triggers to the appropriate ingestion service.
//
//   * * * * *       → live-window  (refresh scores for games currently in progress)
//   every 5 min     → odds         (refresh actively traded Polymarket odds)
//   every 10 min    → next-48h     (upcoming events within 48 hours)
//   7 at every 6h   → next-7d      (events in next 7 days, 4x/day)
//   23 at every 12h → next-8w      (events in next 8 weeks, 2x/day)
//
// ⚠️  We invoke the service layer DIRECTLY instead of going through
//     nitroApp.localFetch. In a scheduled handler, localFetch causes
//     "Illegal invocation" errors because the D1 binding stub loses its
//     `this` reference when the context is serialized into a new H3 event.
//     By calling the service functions with a synthetic H3 event that
//     carries the real Cloudflare `env` object, bindings stay intact.
//
// Hook shape: Nitro's cloudflare-module preset calls
//   nitroApp.hooks.callHook('cloudflare:scheduled', { controller, env, context })
// — see nitropack/dist/presets/cloudflare/runtime/_module-handler.mjs.
// ─────────────────────────────────────────────────────────────────────────────

import type { H3Event } from 'h3'
import { refreshDiscoverEventCache } from '#server/services/napkinbets/events'
import { refreshAllActivelyTradedOdds } from '#server/services/napkinbets/odds'
import { useAppDatabase } from '#server/utils/database'

interface CloudflareScheduledHookPayload {
  controller: { cron: string; scheduledTime: number; type: string }
  env: Record<string, unknown>
  context: { waitUntil: (promise: Promise<unknown>) => void }
}

/**
 * Build a minimal H3-compatible event object whose `context.cloudflare.env`
 * points to the real Cloudflare Worker env (with live D1/KV/R2 bindings).
 *
 * `useAppDatabase(event)` only reads `event.context.cloudflare.env.DB` and
 * caches the Drizzle instance on `event.context._appDb`, so that's all we
 * need to provide.
 */
function buildScheduledH3Event(env: Record<string, unknown> | undefined): H3Event {
  return {
    context: {
      cloudflare: { env: env ?? {} },
    },
  } as unknown as H3Event
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (event: unknown) => {
    const payload = event as CloudflareScheduledHookPayload | undefined
    const env = payload?.env

    const cronToJob = {
      '* * * * *': { tier: 'live-window' as const, label: 'live-window refresh', type: 'events' },
      '*/5 * * * *': { tier: 'odds' as const, label: 'actively traded odds refresh', type: 'odds' },
      '*/10 * * * *': { tier: 'next-48h' as const, label: 'next-48h refresh', type: 'events' },
      '7 */6 * * *': { tier: 'next-7d' as const, label: 'next-7d refresh', type: 'events' },
      '23 */12 * * *': { tier: 'next-8w' as const, label: 'next-8w refresh', type: 'events' },
    } as const

    const cronExpression = payload?.controller?.cron
    const job = cronExpression
      ? (cronToJob[cronExpression as keyof typeof cronToJob] ?? cronToJob['* * * * *'])
      : cronToJob['* * * * *']

    console.log(`[napkinbets-cron] Triggered: cron="${cronExpression ?? 'unknown'}" → ${job.label}`)

    const h3Event = buildScheduledH3Event(env)

    try {
      if (job.type === 'odds') {
        const db = useAppDatabase(h3Event)
        const result = await refreshAllActivelyTradedOdds(db, 15)
        console.log(
          `[napkinbets-cron] Completed ${job.label}. Polymarket: ${result.polymarket?.updatedCount ?? 0} updated.`,
        )
      } else {
        const result = await refreshDiscoverEventCache(h3Event, job.tier)
        const totalEvents = result.runs.reduce((sum, run) => sum + run.eventCount, 0)
        console.log(
          `[napkinbets-cron] Completed ${job.label}. ${result.runs.length} leagues, ${totalEvents} events.`,
        )
      }
    } catch (error) {
      console.error(`[napkinbets-cron] Failed ${job.label}.`, error)
    }
  })
})

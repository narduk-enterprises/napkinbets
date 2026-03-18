// ─── Cloudflare Scheduled Event Handler — Napkinbets Ingestion Crons ────────
//
// Dispatches Cloudflare cron triggers to the appropriate internal API route.
// Each schedule targets a different data freshness tier:
//
//   * * * * *       → live-window  (refresh scores for games currently in progress)
//   every 5 min     → odds         (refresh actively traded Polymarket odds)
//   every 10 min    → next-48h     (upcoming events within 48 hours)
//   7 at every 6h   → next-7d      (events in next 7 days, 4x/day)
//   23 at every 12h → next-8w      (events in next 8 weeks, 2x/day)
//
// Cost: The 1-minute schedule runs 1,440 times/day. Each invocation should
// short-circuit (no-op) when there are no live games to minimize D1 reads.
//
// Idempotency: All cron handlers MUST be idempotent — duplicate or overlapping
// invocations must produce the same result without data corruption.
// ─────────────────────────────────────────────────────────────────────────────
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (scheduledEvent: unknown) => {
    const cloudflareEvent = scheduledEvent as
      | {
          cron?: string
          scheduledTime?: number
          env?: Record<string, unknown>
          context?: unknown
        }
      | undefined
    const config = useRuntimeConfig()
    const env = cloudflareEvent?.env
    const context = cloudflareEvent?.context
    const cronSecret =
      (typeof env?.CRON_SECRET === 'string' ? env.CRON_SECRET : null) ?? config.cronSecret

    if (!cronSecret) {
      console.error('[napkinbets-cron] Missing CRON_SECRET, skipping scheduled ingest.')
      return
    }

    const cloudflareCtx = {
      cloudflare: {
        env,
        context,
      },
    }

    const cronToJob = {
      '* * * * *': { tier: 'live-window', label: 'live-window refresh', type: 'events' },
      '*/5 * * * *': { tier: 'odds', label: 'actively traded odds refresh', type: 'odds' },
      '*/10 * * * *': { tier: 'next-48h', label: 'next-48h refresh', type: 'events' },
      '7 */6 * * *': { tier: 'next-7d', label: 'next-7d refresh', type: 'events' },
      '23 */12 * * *': { tier: 'next-8w', label: 'next-8w refresh', type: 'events' },
    } as const

    const job =
      (cloudflareEvent?.cron ? cronToJob[cloudflareEvent.cron as keyof typeof cronToJob] : null) ??
      cronToJob['* * * * *']

    try {
      if (job.type === 'odds') {
        await nitroApp.localFetch('/api/cron/napkinbets/odds', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
          },
          context: cloudflareCtx,
        })
      } else {
        await nitroApp.localFetch(`/api/cron/napkinbets/events?tier=${job.tier}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
          },
          context: cloudflareCtx,
        })
      }
      console.log(`[napkinbets-cron] Completed ${job.label}.`)
    } catch (error) {
      console.error(`[napkinbets-cron] Failed ${job.label}.`, error)
    }
  })
})

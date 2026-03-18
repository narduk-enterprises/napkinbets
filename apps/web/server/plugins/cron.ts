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
//
// Hook shape: Nitro's cloudflare-module preset calls
//   nitroApp.hooks.callHook('cloudflare:scheduled', { controller, env, context })
// — see nitropack/dist/presets/cloudflare/runtime/_module-handler.mjs.
// ─────────────────────────────────────────────────────────────────────────────

interface CloudflareScheduledHookPayload {
  controller: { cron: string; scheduledTime: number; type: string }
  env: Record<string, unknown>
  context: { waitUntil: (promise: Promise<unknown>) => void }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (event: unknown) => {
    const payload = event as CloudflareScheduledHookPayload | undefined

    const config = useRuntimeConfig()
    const env = payload?.env
    const cfContext = payload?.context
    const cronSecret =
      (typeof env?.CRON_SECRET === 'string' ? env.CRON_SECRET : null) ?? config.cronSecret

    if (!cronSecret) {
      console.error('[napkinbets-cron] Missing CRON_SECRET, skipping scheduled ingest.')
      return
    }

    // Build the Cloudflare platform context that Nitro's localFetch expects.
    // This mirrors the shape used in _module-handler.mjs → fetchHandler so
    // that `useAppDatabase` / `hubDatabase` can resolve the D1 binding.
    const localFetchContext = {
      waitUntil: cfContext?.waitUntil ?? (() => {}),
      _platform: {
        cloudflare: {
          env,
          context: cfContext,
        },
      },
    }

    const cronToJob = {
      '* * * * *': { tier: 'live-window', label: 'live-window refresh', type: 'events' },
      '*/5 * * * *': { tier: 'odds', label: 'actively traded odds refresh', type: 'odds' },
      '*/10 * * * *': { tier: 'next-48h', label: 'next-48h refresh', type: 'events' },
      '7 */6 * * *': { tier: 'next-7d', label: 'next-7d refresh', type: 'events' },
      '23 */12 * * *': { tier: 'next-8w', label: 'next-8w refresh', type: 'events' },
    } as const

    // Nitro wraps the Cloudflare args: { controller, env, context }.
    // The cron expression lives on controller.cron, not on the root object.
    const cronExpression = payload?.controller?.cron
    const job = cronExpression
      ? (cronToJob[cronExpression as keyof typeof cronToJob] ?? cronToJob['* * * * *'])
      : cronToJob['* * * * *']

    console.log(`[napkinbets-cron] Triggered: cron="${cronExpression ?? 'unknown'}" → ${job.label}`)

    try {
      let response: Response
      if (job.type === 'odds') {
        response = await nitroApp.localFetch('/api/cron/napkinbets/odds', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
          },
          context: localFetchContext,
        })
      } else {
        response = await nitroApp.localFetch(`/api/cron/napkinbets/events?tier=${job.tier}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
          },
          context: localFetchContext,
        })
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '(unreadable)')
        console.error(
          `[napkinbets-cron] ${job.label} returned ${response.status}: ${body.slice(0, 500)}`,
        )
      } else {
        console.log(`[napkinbets-cron] Completed ${job.label} (${response.status}).`)
      }
    } catch (error) {
      console.error(`[napkinbets-cron] Failed ${job.label}.`, error)
    }
  })
})

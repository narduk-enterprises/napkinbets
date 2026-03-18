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

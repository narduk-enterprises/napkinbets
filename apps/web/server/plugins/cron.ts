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
      '* * * * *': { tier: 'live-window', label: 'live-window refresh' },
      '*/10 * * * *': { tier: 'next-48h', label: 'next-48h refresh' },
      '7 */6 * * *': { tier: 'next-7d', label: 'next-7d refresh' },
      '23 */12 * * *': { tier: 'next-8w', label: 'next-8w refresh' },
    } as const

    const job =
      (cloudflareEvent?.cron
        ? cronToJob[cloudflareEvent.cron as keyof typeof cronToJob]
        : null) ??
      cronToJob['* * * * *']

    try {
      await nitroApp.localFetch(`/api/cron/napkinbets/events?tier=${job.tier}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
        context: cloudflareCtx,
      })
      console.log(`[napkinbets-cron] Completed ${job.label}.`)
    } catch (error) {
      console.error(`[napkinbets-cron] Failed ${job.label}.`, error)
    }
  })
})

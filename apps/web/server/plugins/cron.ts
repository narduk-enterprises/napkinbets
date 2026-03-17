export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (...args: unknown[]) => {
    const scheduledEvent = args[0] as { cron?: string } | undefined
    const env = args[1] as Record<string, unknown> | undefined
    const context = args[2]
    const config = useRuntimeConfig()

    if (!config.cronSecret) {
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
      (scheduledEvent?.cron ? cronToJob[scheduledEvent.cron as keyof typeof cronToJob] : null) ??
      cronToJob['* * * * *']

    try {
      await nitroApp.localFetch(`/api/cron/napkinbets/events?tier=${job.tier}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.cronSecret}`,
        },
        context: cloudflareCtx,
      })
      console.log(`[napkinbets-cron] Completed ${job.label}.`)
    } catch (error) {
      console.error(`[napkinbets-cron] Failed ${job.label}.`, error)
    }
  })
})

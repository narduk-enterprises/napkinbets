import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { defineAdminMutation, withValidatedBody } from '#layer/server/utils/mutation'
import { napkinbetsTaxonomyLeagues } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'

const leagueSchema = z.object({
  key: z.string().min(2).max(80),
  label: z.string().min(2).max(120),
  sportKey: z.string().min(2).max(40),
  primaryContextKey: z.string().min(2).max(40),
  contextKeys: z.array(z.string().min(2).max(40)).min(1),
  provider: z.enum(['espn', 'manual']).default('manual'),
  providerLeagueKey: z.string().max(120).optional().or(z.literal('')),
  entityProvider: z.enum(['manual', 'api-sports']).default('manual'),
  entityProviderSportKey: z
    .enum(['american-football', 'baseball', 'basketball', 'football', 'hockey'])
    .optional()
    .or(z.literal('')),
  entityProviderLeagueId: z.string().max(120).optional().or(z.literal('')),
  entityProviderSeason: z.string().max(80).optional().or(z.literal('')),
  entitySyncEnabled: z.boolean().default(false),
  scoreSyncEnabled: z.boolean().default(false),
  scoreboardQueryParams: z.record(z.string(), z.string()).default({}),
  eventShape: z.enum(['head-to-head', 'tournament']).optional().nullable(),
  activeMonths: z.array(z.number().int().min(1).max(12)).default([]),
  supportsDateWindow: z.boolean().default(true),
  supportsEventDiscovery: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

const RATE_LIMIT = {
  namespace: 'napkinbets-admin-taxonomy-leagues',
  maxRequests: 30,
  windowMs: 60_000,
}

export default defineAdminMutation(
  {
    rateLimit: RATE_LIMIT,
    parseBody: withValidatedBody(leagueSchema.parse),
  },
  async ({ event, body }) => {
    const db = useAppDatabase(event)
    const now = new Date().toISOString()
    const existing = await db
      .select({ key: napkinbetsTaxonomyLeagues.key, createdAt: napkinbetsTaxonomyLeagues.createdAt })
      .from(napkinbetsTaxonomyLeagues)
      .where(eq(napkinbetsTaxonomyLeagues.key, body.key))
      .limit(1)

    const values: typeof napkinbetsTaxonomyLeagues.$inferInsert = {
      key: body.key,
      label: body.label,
      sportKey: body.sportKey,
      primaryContextKey: body.primaryContextKey,
      contextKeysJson: JSON.stringify(body.contextKeys),
      provider: body.provider,
      providerLeagueKey: body.providerLeagueKey || null,
      entityProvider: body.entityProvider,
      entityProviderSportKey: body.entityProviderSportKey || null,
      entityProviderLeagueId: body.entityProviderLeagueId || null,
      entityProviderSeason: body.entityProviderSeason || null,
      entitySyncEnabled: body.entitySyncEnabled,
      scoreSyncEnabled: body.scoreSyncEnabled,
      entityLastSyncAt: existing[0]?.key ? undefined : null,
      entityLastSyncStatus: existing[0]?.key ? undefined : 'idle',
      entityLastSyncMessage: existing[0]?.key ? undefined : null,
      entityResolvedSeason: existing[0]?.key ? undefined : null,
      scoreboardQueryParamsJson: JSON.stringify(body.scoreboardQueryParams),
      eventShape: body.eventShape ?? null,
      activeMonthsJson: JSON.stringify(body.activeMonths),
      supportsDateWindow: body.supportsDateWindow,
      supportsEventDiscovery: body.supportsEventDiscovery,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
      createdAt: existing[0]?.createdAt ?? now,
      updatedAt: now,
    }

    await db
      .insert(napkinbetsTaxonomyLeagues)
      .values(values)
      .onConflictDoUpdate({
        target: napkinbetsTaxonomyLeagues.key,
        set: {
          label: values.label,
          sportKey: values.sportKey,
          primaryContextKey: values.primaryContextKey,
          contextKeysJson: values.contextKeysJson,
          provider: values.provider,
          providerLeagueKey: values.providerLeagueKey,
          entityProvider: values.entityProvider,
          entityProviderSportKey: values.entityProviderSportKey,
          entityProviderLeagueId: values.entityProviderLeagueId,
          entityProviderSeason: values.entityProviderSeason,
          entitySyncEnabled: values.entitySyncEnabled,
          scoreSyncEnabled: values.scoreSyncEnabled,
          scoreboardQueryParamsJson: values.scoreboardQueryParamsJson,
          eventShape: values.eventShape,
          activeMonthsJson: values.activeMonthsJson,
          supportsDateWindow: values.supportsDateWindow,
          supportsEventDiscovery: values.supportsEventDiscovery,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
          updatedAt: values.updatedAt,
        },
      })
      .run()

    return { ok: true }
  },
)

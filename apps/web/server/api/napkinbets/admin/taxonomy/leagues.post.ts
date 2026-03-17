import { createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { enforceRateLimit } from '#layer/server/utils/rateLimit'
import { requireAdmin } from '#layer/server/utils/auth'
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

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await enforceRateLimit(event, 'napkinbets-admin-taxonomy-leagues', 30, 60_000)

  const parsed = leagueSchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues.map((issue) => issue.message).join(', '),
    })
  }

  const db = useAppDatabase(event)
  const now = new Date().toISOString()
  const existing = await db
    .select({ key: napkinbetsTaxonomyLeagues.key, createdAt: napkinbetsTaxonomyLeagues.createdAt })
    .from(napkinbetsTaxonomyLeagues)
    .where(eq(napkinbetsTaxonomyLeagues.key, parsed.data.key))
    .limit(1)

  const values: typeof napkinbetsTaxonomyLeagues.$inferInsert = {
    key: parsed.data.key,
    label: parsed.data.label,
    sportKey: parsed.data.sportKey,
    primaryContextKey: parsed.data.primaryContextKey,
    contextKeysJson: JSON.stringify(parsed.data.contextKeys),
    provider: parsed.data.provider,
    providerLeagueKey: parsed.data.providerLeagueKey || null,
    entityProvider: parsed.data.entityProvider,
    entityProviderSportKey: parsed.data.entityProviderSportKey || null,
    entityProviderLeagueId: parsed.data.entityProviderLeagueId || null,
    entityProviderSeason: parsed.data.entityProviderSeason || null,
    entitySyncEnabled: parsed.data.entitySyncEnabled,
    scoreSyncEnabled: parsed.data.scoreSyncEnabled,
    entityLastSyncAt: existing[0]?.key ? undefined : null,
    entityLastSyncStatus: existing[0]?.key ? undefined : 'idle',
    entityLastSyncMessage: existing[0]?.key ? undefined : null,
    entityResolvedSeason: existing[0]?.key ? undefined : null,
    scoreboardQueryParamsJson: JSON.stringify(parsed.data.scoreboardQueryParams),
    eventShape: parsed.data.eventShape ?? null,
    activeMonthsJson: JSON.stringify(parsed.data.activeMonths),
    supportsDateWindow: parsed.data.supportsDateWindow,
    supportsEventDiscovery: parsed.data.supportsEventDiscovery,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
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
})

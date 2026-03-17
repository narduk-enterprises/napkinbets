import type { H3Event } from 'h3'
import { asc } from 'drizzle-orm'
import {
  napkinbetsTaxonomyContexts,
  napkinbetsTaxonomyLeagues,
  napkinbetsTaxonomySports,
} from '#server/database/schema'
import {
  NAPKINBETS_BOARD_TYPES,
  NAPKINBETS_DEFAULT_CONTEXTS,
  NAPKINBETS_DEFAULT_SPORTS,
  NAPKINBETS_LEAGUES,
  findNapkinbetsContext,
  findNapkinbetsSport,
  type NapkinbetsContextDefinition,
  type NapkinbetsContextKey,
  type NapkinbetsLeagueDefinition,
  type NapkinbetsSportDefinition,
  type NapkinbetsSportKey,
} from '#server/services/napkinbets/taxonomy'
import { useAppDatabase } from '#server/utils/database'

interface CreateWagerTaxonomyInput {
  boardType: string
  sport: string
  league?: string
  contextKey: string
  eventSource?: string
  eventId?: string
  customContextName?: string
}

function nowIso() {
  return new Date().toISOString()
}

function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

async function ensureNapkinbetsTaxonomySeeded(event: H3Event) {
  const db = useAppDatabase(event)
  const existingLeague = await db
    .select({ key: napkinbetsTaxonomyLeagues.key })
    .from(napkinbetsTaxonomyLeagues)
    .limit(1)

  if (existingLeague.length > 0) {
    return
  }

  const timestamp = nowIso()

  await db
    .insert(napkinbetsTaxonomySports)
    .values(
      NAPKINBETS_DEFAULT_SPORTS.map((sport, index) => ({
        key: sport.key,
        label: sport.label,
        icon: sport.icon,
        supportsEventDiscovery: sport.supportsEventDiscovery,
        sortOrder: index,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoNothing()
    .run()

  await db
    .insert(napkinbetsTaxonomyContexts)
    .values(
      NAPKINBETS_DEFAULT_CONTEXTS.map((context, index) => ({
        key: context.key,
        label: context.label,
        description: context.description,
        sortOrder: index,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoNothing()
    .run()

  await db
    .insert(napkinbetsTaxonomyLeagues)
    .values(
      NAPKINBETS_LEAGUES.map((league, index) => ({
        key: league.key,
        label: league.label,
        sportKey: league.sportKey,
        primaryContextKey: league.primaryContextKey,
        contextKeysJson: JSON.stringify(league.contextKeys),
        provider: league.provider,
        providerLeagueKey: league.providerLeagueKey ?? null,
        entityProvider: league.entityProvider ?? 'manual',
        entityProviderSportKey: league.entityProviderSportKey ?? null,
        entityProviderLeagueId: league.entityProviderLeagueId ?? null,
        entityProviderSeason: league.entityProviderSeason ?? null,
        entitySyncEnabled: league.entitySyncEnabled ?? false,
        scoreSyncEnabled: league.scoreSyncEnabled ?? false,
        entityLastSyncAt: league.entityLastSyncAt ?? null,
        entityLastSyncStatus: league.entityLastSyncStatus ?? 'idle',
        entityLastSyncMessage: league.entityLastSyncMessage ?? null,
        entityResolvedSeason: league.entityResolvedSeason ?? null,
        scoreboardQueryParamsJson: JSON.stringify(league.scoreboardQueryParams ?? {}),
        eventShape: league.eventShape ?? null,
        activeMonthsJson: JSON.stringify([...league.activeMonths]),
        supportsDateWindow: league.supportsDateWindow !== false,
        supportsEventDiscovery: league.supportsEventDiscovery,
        sortOrder: index,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoNothing()
    .run()
}

export async function loadNapkinbetsTaxonomyCatalog(event: H3Event) {
  await ensureNapkinbetsTaxonomySeeded(event)

  const db = useAppDatabase(event)
  const [sportRows, contextRows, leagueRows] = await Promise.all([
    db
      .select()
      .from(napkinbetsTaxonomySports)
      .orderBy(asc(napkinbetsTaxonomySports.sortOrder), asc(napkinbetsTaxonomySports.label)),
    db
      .select()
      .from(napkinbetsTaxonomyContexts)
      .orderBy(asc(napkinbetsTaxonomyContexts.sortOrder), asc(napkinbetsTaxonomyContexts.label)),
    db
      .select()
      .from(napkinbetsTaxonomyLeagues)
      .orderBy(asc(napkinbetsTaxonomyLeagues.sortOrder), asc(napkinbetsTaxonomyLeagues.label)),
  ])

  const sports = sportRows
    .filter((row) => row.isActive)
    .map<NapkinbetsSportDefinition>((row) => ({
      key: row.key as NapkinbetsSportKey,
      label: row.label,
      icon: row.icon,
      supportsEventDiscovery: row.supportsEventDiscovery,
    }))

  const contexts = contextRows
    .filter((row) => row.isActive)
    .map<NapkinbetsContextDefinition>((row) => ({
      key: row.key as NapkinbetsContextKey,
      label: row.label,
      description: row.description,
    }))

  const sportsByKey = new Map(sports.map((sport) => [sport.key, sport]))
  const contextsByKey = new Map(contexts.map((context) => [context.key, context]))

  const leagues = leagueRows
    .filter((row) => row.isActive)
    .map<NapkinbetsLeagueDefinition>((row) => ({
      key: row.key,
      label: row.label,
      sportKey: row.sportKey as NapkinbetsSportKey,
      sportLabel:
        sportsByKey.get(row.sportKey as NapkinbetsSportKey)?.label ??
        findNapkinbetsSport(row.sportKey)?.label ??
        row.sportKey,
      primaryContextKey: row.primaryContextKey as NapkinbetsContextKey,
      primaryContextLabel:
        contextsByKey.get(row.primaryContextKey as NapkinbetsContextKey)?.label ??
        findNapkinbetsContext(row.primaryContextKey)?.label ??
        row.primaryContextKey,
      contextKeys: parseJsonValue<NapkinbetsContextKey[]>(row.contextKeysJson, [
        row.primaryContextKey as NapkinbetsContextKey,
      ]),
      provider: row.provider as 'espn' | 'manual',
      providerLeagueKey: row.providerLeagueKey ?? undefined,
      entityProvider: (row.entityProvider as 'manual' | 'api-sports') ?? 'manual',
      entityProviderSportKey:
        (row.entityProviderSportKey as
          | 'american-football'
          | 'baseball'
          | 'basketball'
          | 'football'
          | 'hockey'
          | null) ?? undefined,
      entityProviderLeagueId: row.entityProviderLeagueId ?? undefined,
      entityProviderSeason: row.entityProviderSeason ?? undefined,
      entitySyncEnabled: row.entitySyncEnabled,
      scoreSyncEnabled: row.scoreSyncEnabled,
      entityLastSyncAt: row.entityLastSyncAt ?? null,
      entityLastSyncStatus:
        (row.entityLastSyncStatus as 'idle' | 'success' | 'error' | 'partial') ?? 'idle',
      entityLastSyncMessage: row.entityLastSyncMessage ?? null,
      entityResolvedSeason: row.entityResolvedSeason ?? null,
      scoreboardQueryParams: parseJsonValue<Record<string, string>>(
        row.scoreboardQueryParamsJson,
        {},
      ),
      eventShape: (row.eventShape as 'head-to-head' | 'tournament' | null) ?? undefined,
      activeMonths: parseJsonValue<number[]>(row.activeMonthsJson, []),
      supportsDateWindow: row.supportsDateWindow,
      supportsEventDiscovery: row.supportsEventDiscovery,
    }))

  return {
    sports,
    contexts,
    leagues,
  }
}

export async function loadNapkinbetsLeaguesFromStore(
  event: H3Event,
  options?: {
    sportKey?: string
    contextKey?: string
    eventBackedOnly?: boolean
  },
) {
  const { leagues } = await loadNapkinbetsTaxonomyCatalog(event)

  return leagues.filter((league) => {
    if (options?.eventBackedOnly && !league.supportsEventDiscovery) {
      return false
    }

    if (options?.sportKey && league.sportKey !== options.sportKey) {
      return false
    }

    if (
      options?.contextKey &&
      !league.contextKeys.includes(options.contextKey as NapkinbetsContextKey)
    ) {
      return false
    }

    return true
  })
}

export async function findNapkinbetsLeagueFromStore(event: H3Event, key: string) {
  return (await loadNapkinbetsLeaguesFromStore(event)).find((league) => league.key === key) ?? null
}

export async function normalizeCreateWagerTaxonomyInputFromStore(
  event: H3Event,
  input: CreateWagerTaxonomyInput,
) {
  const { sports, contexts, leagues } = await loadNapkinbetsTaxonomyCatalog(event)

  const boardType = NAPKINBETS_BOARD_TYPES.find((value) => value === input.boardType)
  if (!boardType) {
    throw new Error('Select a valid bet format before saving the bet.')
  }

  const sport = sports.find((item) => item.key === input.sport)
  if (!sport) {
    throw new Error('Select a supported sport before saving the napkin.')
  }

  const rawLeague = input.league?.trim() || ''
  const league = rawLeague ? leagues.find((item) => item.key === rawLeague) : null
  if (rawLeague && !league) {
    throw new Error('Select a supported league before saving the napkin.')
  }

  const contextFromLeague = league?.primaryContextKey ?? null
  const resolvedContextKey =
    boardType === 'event-backed' ? contextFromLeague || input.contextKey : input.contextKey
  const context = contexts.find((item) => item.key === resolvedContextKey)

  if (!context) {
    throw new Error('Select a valid competition context before saving the napkin.')
  }

  if (league) {
    if (league.sportKey !== sport.key) {
      throw new Error('The selected league does not match the chosen sport.')
    }

    if (!league.contextKeys.includes(context.key)) {
      throw new Error('The selected league does not match the chosen competition context.')
    }
  }

  if (boardType === 'event-backed') {
    if (!(input.eventSource?.trim() && input.eventId?.trim())) {
      throw new Error('Event-backed napkins need an attached event.')
    }

    if (!league) {
      throw new Error('Event-backed napkins need a valid league attached from Events.')
    }
  }

  return {
    boardType,
    sport: sport.key,
    league: league?.key ?? '',
    contextKey: context.key,
    customContextName: input.customContextName?.trim() || '',
  }
}

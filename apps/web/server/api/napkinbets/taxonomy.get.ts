import { loadNapkinbetsTaxonomyCatalog } from '#server/services/napkinbets/taxonomy-store'

export default defineEventHandler(async (event) => {
  const taxonomy = await loadNapkinbetsTaxonomyCatalog(event)

  return {
    sports: taxonomy.sports.map((sport) => ({
      value: sport.key,
      label: sport.label,
      icon: sport.icon,
      supportsEventDiscovery: sport.supportsEventDiscovery,
    })),
    contexts: taxonomy.contexts.map((context) => ({
      value: context.key,
      label: context.label,
      description: context.description,
    })),
    leagues: taxonomy.leagues.map((league) => ({
      value: league.key,
      label: league.label,
      sport: league.sportKey,
      contextKey: league.primaryContextKey,
      contextKeys: league.contextKeys,
      supportsEventDiscovery: league.supportsEventDiscovery,
    })),
  }
})

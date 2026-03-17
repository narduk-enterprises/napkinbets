import {
  getNapkinbetsContexts,
  getNapkinbetsLeagues,
  getNapkinbetsSports,
} from '#server/services/napkinbets/taxonomy'

export default defineEventHandler(() => {
  return {
    sports: getNapkinbetsSports().map((sport) => ({
      value: sport.key,
      label: sport.label,
      icon: sport.icon,
      supportsEventDiscovery: sport.supportsEventDiscovery,
    })),
    contexts: getNapkinbetsContexts().map((context) => ({
      value: context.key,
      label: context.label,
      description: context.description,
    })),
    leagues: getNapkinbetsLeagues().map((league) => ({
      value: league.key,
      label: league.label,
      sport: league.sportKey,
      contextKey: league.primaryContextKey,
      contextKeys: league.contextKeys,
      supportsEventDiscovery: league.supportsEventDiscovery,
    })),
  }
})

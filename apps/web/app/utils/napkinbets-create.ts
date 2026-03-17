import type {
  NapkinbetsCreatePrefillQuery,
  NapkinbetsEventCard,
  NapkinbetsEventIdea,
} from '../../types/napkinbets'

interface NapkinbetsCreateLinkOptions {
  format?: string
  sideOptions?: string[]
}

export function buildNapkinbetsCreatePrefill(
  event: NapkinbetsEventCard,
  idea?: NapkinbetsEventIdea,
): NapkinbetsCreatePrefillQuery {
  const isMatchupEvent = event.awayTeam.homeAway === 'away' && event.homeTeam.homeAway === 'home'

  return {
    source: event.source,
    eventId: event.id,
    eventTitle: event.eventTitle,
    eventStartsAt: event.startTime,
    eventStatus: event.status,
    sport: event.sport,
    contextKey: event.contextKey,
    league: event.league,
    venueName: event.venueName,
    homeTeamName: isMatchupEvent ? event.homeTeam.name : '',
    awayTeamName: isMatchupEvent ? event.awayTeam.name : '',
    format: idea?.format || (event.sport === 'golf' ? 'golf-draft' : 'sports-game'),
    sideOptions: idea?.sideOptions ?? [],
  }
}

export function buildNapkinbetsCreateLink(
  prefill: NapkinbetsCreatePrefillQuery,
  options?: NapkinbetsCreateLinkOptions,
) {
  return {
    path: '/napkins/create',
    query: {
      createMode: 'event',
      source: prefill.source,
      eventId: prefill.eventId,
      eventTitle: prefill.eventTitle,
      eventStartsAt: prefill.eventStartsAt,
      eventStatus: prefill.eventStatus,
      sport: prefill.sport,
      contextKey: prefill.contextKey,
      league: prefill.league,
      venueName: prefill.venueName,
      homeTeamName: prefill.homeTeamName,
      awayTeamName: prefill.awayTeamName,
      format: options?.format || prefill.format,
      sideOptions: (options?.sideOptions ?? prefill.sideOptions).join('\n'),
    },
  }
}

export function formatNapkinbetsDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

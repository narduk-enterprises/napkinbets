import type {
  NapkinbetsCreatePrefillQuery,
  NapkinbetsEventCard,
  NapkinbetsEventIdea,
} from '../../types/napkinbets'
import {
  buildNapkinbetsTemplateCreateQuery,
  getNapkinbetsDefaultTemplateKey,
  normalizeNapkinbetsTemplateKey,
} from './napkinbets-game-templates'

interface NapkinbetsCreateLinkOptions {
  format?: string
  sideOptions?: string[]
}

export function buildNapkinbetsCreatePrefill(
  event: NapkinbetsEventCard,
  idea?: NapkinbetsEventIdea,
): NapkinbetsCreatePrefillQuery {
  const isMatchupEvent = event.awayTeam.homeAway === 'away' && event.homeTeam.homeAway === 'home'
  const templateKey = idea?.format
    ? normalizeNapkinbetsTemplateKey(idea.format, event.sport)
    : getNapkinbetsDefaultTemplateKey({
        sport: event.sport,
        createMode: 'event',
        napkinType: 'pool',
      })

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
    format: templateKey,
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
      ...buildNapkinbetsTemplateCreateQuery(options?.format || prefill.format, {
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
        sideOptions: (options?.sideOptions ?? prefill.sideOptions).join('\n'),
      }),
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

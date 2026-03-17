import type { H3Event } from 'h3'

export type NapkinbetsApiSportsProduct =
  | 'american-football'
  | 'baseball'
  | 'basketball'
  | 'football'
  | 'hockey'

export interface NapkinbetsApiSportsLeagueSeason {
  season: string
  current: boolean
  players: boolean
  standings: boolean
}

export interface NapkinbetsApiSportsLeagueMetadata {
  id: string
  name: string
  logoUrl: string
  country: string
  seasons: NapkinbetsApiSportsLeagueSeason[]
}

export interface NapkinbetsApiSportsVenuePayload {
  externalId: string | null
  name: string
  city: string
  stateRegion: string
  country: string
  address: string
  postalCode: string
  timezone: string
  latitude: string
  longitude: string
  capacity: number | null
  surface: string
  roofType: string
  imageUrl: string
  metadata: Record<string, unknown>
}

export interface NapkinbetsApiSportsTeamPayload {
  externalId: string
  name: string
  shortName: string
  abbreviation: string
  city: string
  country: string
  logoUrl: string
  isNational: boolean
  foundedYear: number | null
  venue: NapkinbetsApiSportsVenuePayload | null
  metadata: Record<string, unknown>
  rawPayload: unknown
}

export interface NapkinbetsApiSportsPlayerPayload {
  externalId: string
  displayName: string
  firstName: string
  lastName: string
  shortName: string
  nationality: string
  age: number | null
  birthDate: string | null
  height: string
  weight: string
  position: string
  groupLabel: string
  jerseyNumber: string
  imageUrl: string
  metadata: Record<string, unknown>
  rawPayload: unknown
}

interface ApiSportsResponseEnvelope<T> {
  errors?: Record<string, string> | string[] | null
  response?: T[]
  results?: number
}

const API_SPORTS_BASE_URLS: Record<NapkinbetsApiSportsProduct, string> = {
  'american-football': 'https://v1.american-football.api-sports.io',
  baseball: 'https://v1.baseball.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  football: 'https://v3.football.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
}

export class NapkinbetsApiSportsError extends Error {
  code: 'config' | 'plan' | 'endpoint' | 'request'

  constructor(code: 'config' | 'plan' | 'endpoint' | 'request', message: string) {
    super(message)
    this.name = 'NapkinbetsApiSportsError'
    this.code = code
  }
}

function stringifySeason(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function normalizeErrors(errors: ApiSportsResponseEnvelope<unknown>['errors']) {
  if (!errors) {
    return []
  }

  if (Array.isArray(errors)) {
    return errors.filter(Boolean)
  }

  return Object.values(errors).filter(Boolean)
}

function splitLocation(value: string) {
  const [city = '', stateRegion = ''] = value.split(',').map((part) => part.trim())
  return { city, stateRegion }
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  if (parts.length === 1) {
    return { firstName: parts[0] ?? '', lastName: '' }
  }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeLeagueCountry(row: Record<string, unknown>) {
  const nestedCountry = row.country
  if (nestedCountry && typeof nestedCountry === 'object') {
    return String((nestedCountry as { name?: unknown }).name ?? '')
  }

  const nested = row.league
  if (nested && typeof nested === 'object') {
    const leagueCountry = (row.country as { name?: unknown } | undefined)?.name
    return String(leagueCountry ?? '')
  }

  return ''
}

function parseLeagueSeasons(row: Record<string, unknown>) {
  const seasons = Array.isArray(row.seasons)
    ? row.seasons
    : Array.isArray((row.league as { seasons?: unknown[] } | undefined)?.seasons)
      ? ((row.league as { seasons?: unknown[] }).seasons ?? [])
      : []

  return seasons
    .map((seasonRow) => {
      if (!seasonRow || typeof seasonRow !== 'object') {
        return null
      }

      const typed = seasonRow as Record<string, unknown>
      const coverage = (typed.coverage as Record<string, unknown> | undefined) ?? {}
      const players =
        coverage.players === true ||
        ((coverage.statistics as Record<string, unknown> | undefined)?.season as Record<string, unknown>
          | undefined)?.players === true
      const standings = coverage.standings === true

      return {
        season: stringifySeason(typed.season ?? typed.year),
        current: Boolean(typed.current),
        players,
        standings,
      } satisfies NapkinbetsApiSportsLeagueSeason
    })
    .filter((season): season is NapkinbetsApiSportsLeagueSeason => Boolean(season?.season))
}

function parseVenueFromTeam(
  product: NapkinbetsApiSportsProduct,
  row: Record<string, unknown>,
): NapkinbetsApiSportsVenuePayload | null {
  const country =
    typeof row.country === 'string'
      ? row.country
      : typeof (row.country as { name?: unknown } | undefined)?.name === 'string'
        ? String((row.country as { name?: unknown }).name)
        : ''

  if (product === 'american-football') {
    const stadium = typeof row.stadium === 'string' ? row.stadium.trim() : ''
    if (!stadium) {
      return null
    }

    return {
      externalId: null,
      name: stadium,
      city: typeof row.city === 'string' ? row.city : '',
      stateRegion: '',
      country,
      address: '',
      postalCode: '',
      timezone: '',
      latitude: '',
      longitude: '',
      capacity: null,
      surface: '',
      roofType: '',
      imageUrl: '',
      metadata: {
        coach: row.coach ?? null,
        owner: row.owner ?? null,
      },
    }
  }

  const arena = row.arena
  if (arena && typeof arena === 'object') {
    const typedArena = arena as Record<string, unknown>
    const { city, stateRegion } = splitLocation(String(typedArena.location ?? ''))
    const name = String(typedArena.name ?? '').trim()
    if (!name) {
      return null
    }

    return {
      externalId: stringifySeason(typedArena.id) || null,
      name,
      city,
      stateRegion,
      country,
      address: '',
      postalCode: '',
      timezone: '',
      latitude: '',
      longitude: '',
      capacity:
        typeof typedArena.capacity === 'number' ? typedArena.capacity : Number(typedArena.capacity || '') || null,
      surface: '',
      roofType: '',
      imageUrl: '',
      metadata: {},
    }
  }

  const venue = row.venue
  if (venue && typeof venue === 'object') {
    const typedVenue = venue as Record<string, unknown>
    const city = String(typedVenue.city ?? '')
    const stateRegion = String(typedVenue.address ?? '')

    return {
      externalId: stringifySeason(typedVenue.id) || null,
      name: String(typedVenue.name ?? ''),
      city,
      stateRegion,
      country,
      address: String(typedVenue.address ?? ''),
      postalCode: '',
      timezone: String(typedVenue.timezone ?? ''),
      latitude: String(typedVenue.lat ?? ''),
      longitude: String(typedVenue.lng ?? ''),
      capacity:
        typeof typedVenue.capacity === 'number' ? typedVenue.capacity : Number(typedVenue.capacity || '') || null,
      surface: String(typedVenue.surface ?? ''),
      roofType: '',
      imageUrl: String(typedVenue.image ?? ''),
      metadata: {},
    }
  }

  return null
}

function parseTeam(
  product: NapkinbetsApiSportsProduct,
  row: Record<string, unknown>,
): NapkinbetsApiSportsTeamPayload | null {
  const externalId = stringifySeason(row.id)
  const name = String(row.name ?? '').trim()
  if (!externalId || !name) {
    return null
  }

  const city = String(row.city ?? '')
  const country =
    typeof row.country === 'string'
      ? row.country
      : String((row.country as { name?: unknown } | undefined)?.name ?? '')
  const abbreviation = String(row.code ?? row.abbreviation ?? '')
  const shortName = city && name.startsWith(city) ? name.slice(city.length).trim() : name
  const foundedValue = row.founded ?? row.established
  const foundedYear =
    typeof foundedValue === 'number' ? foundedValue : Number.parseInt(String(foundedValue ?? ''), 10) || null

  return {
    externalId,
    name,
    shortName,
    abbreviation,
    city,
    country,
    logoUrl: String(row.logo ?? ''),
    isNational: Boolean(row.national ?? row.nationnal),
    foundedYear,
    venue: parseVenueFromTeam(product, row),
    metadata: {
      colors: row.colors ?? null,
      coach: row.coach ?? null,
      owner: row.owner ?? null,
      type: row.type ?? null,
    },
    rawPayload: row,
  }
}

function parsePlayer(row: Record<string, unknown>): NapkinbetsApiSportsPlayerPayload | null {
  const externalId = stringifySeason(row.id)
  const displayName = String(row.name ?? row.player ?? '').trim()
  if (!externalId || !displayName) {
    return null
  }

  const firstName = String(row.firstname ?? row.firstName ?? splitDisplayName(displayName).firstName)
  const lastName = String(row.lastname ?? row.lastName ?? splitDisplayName(displayName).lastName)

  return {
    externalId,
    displayName,
    firstName,
    lastName,
    shortName: String(row.shortName ?? displayName),
    nationality: String(row.nationality ?? row.country ?? ''),
    age: typeof row.age === 'number' ? row.age : Number.parseInt(String(row.age ?? ''), 10) || null,
    birthDate: String((row.birth as { date?: unknown } | undefined)?.date ?? row.birthDate ?? '') || null,
    height: String(row.height ?? ''),
    weight: String(row.weight ?? ''),
    position: String(row.position ?? ''),
    groupLabel: String(row.group ?? ''),
    jerseyNumber: String(row.number ?? ''),
    imageUrl: String(row.image ?? row.photo ?? ''),
    metadata: {
      college: row.college ?? null,
      salary: row.salary ?? null,
      experience: row.experience ?? null,
    },
    rawPayload: row,
  }
}

async function fetchApiSports<T>(
  event: H3Event,
  product: NapkinbetsApiSportsProduct,
  path: string,
  query: Record<string, string>,
) {
  const config = useRuntimeConfig(event)
  if (!config.apiSportsKey) {
    throw new NapkinbetsApiSportsError('config', 'API_SPORTS_KEY is not configured.')
  }

  const url = new URL(path, API_SPORTS_BASE_URLS[product])
  for (const [key, value] of Object.entries(query)) {
    if (!value) {
      continue
    }

    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-apisports-key': config.apiSportsKey,
    },
  })

  if (!response.ok) {
    throw new NapkinbetsApiSportsError(
      'request',
      `API-Sports ${product} ${path} returned ${response.status}.`,
    )
  }

  const payload = (await response.json()) as ApiSportsResponseEnvelope<T>
  const errors = normalizeErrors(payload.errors)
  if (errors.length > 0) {
    const message = errors.join('; ')
    if (message.toLowerCase().includes('free plans')) {
      throw new NapkinbetsApiSportsError('plan', message)
    }

    if (message.toLowerCase().includes('endpoint')) {
      throw new NapkinbetsApiSportsError('endpoint', message)
    }

    throw new NapkinbetsApiSportsError('request', message)
  }

  return payload.response ?? []
}

export async function fetchApiSportsLeagueMetadata(
  event: H3Event,
  product: NapkinbetsApiSportsProduct,
  leagueId: string,
): Promise<NapkinbetsApiSportsLeagueMetadata | null> {
  const rows = await fetchApiSports<Record<string, unknown>>(event, product, '/leagues', { id: leagueId })
  const first = rows[0]
  if (!first) {
    return null
  }

  const leagueContainer =
    first.league && typeof first.league === 'object'
      ? (first.league as Record<string, unknown>)
      : first

  return {
    id: stringifySeason(leagueContainer.id),
    name: String(leagueContainer.name ?? ''),
    logoUrl: String(leagueContainer.logo ?? ''),
    country: normalizeLeagueCountry(first),
    seasons: parseLeagueSeasons(first),
  }
}

export async function fetchApiSportsTeams(
  event: H3Event,
  product: NapkinbetsApiSportsProduct,
  leagueId: string,
  season: string,
) {
  const rows = await fetchApiSports<Record<string, unknown>>(event, product, '/teams', {
    league: leagueId,
    season,
  })

  return rows
    .map((row) => parseTeam(product, row))
    .filter((team): team is NapkinbetsApiSportsTeamPayload => Boolean(team))
}

export async function fetchApiSportsPlayersByTeam(
  event: H3Event,
  product: NapkinbetsApiSportsProduct,
  teamId: string,
  season: string,
) {
  const rows = await fetchApiSports<Record<string, unknown>>(event, product, '/players', {
    team: teamId,
    season,
  })

  return rows
    .map((row) => parsePlayer(row))
    .filter((player): player is NapkinbetsApiSportsPlayerPayload => Boolean(player))
}

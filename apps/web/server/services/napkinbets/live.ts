interface EspnScoreboardResponse {
  events?: Array<{
    id?: string
    name?: string
    shortName?: string
    status?: { type?: { description?: string } }
    competitions?: Array<{
      competitors?: Array<{
        homeAway?: string
        score?: string
        team?: {
          abbreviation?: string
          displayName?: string
        }
      }>
    }>
  }>
}

interface OpenMeteoResponse {
  current?: {
    time?: string
    temperature_2m?: number
    apparent_temperature?: number
    wind_speed_10m?: number
    weather_code?: number
  }
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
  }
}

export interface NapkinbetsLiveGame {
  id: string
  name: string
  shortName: string
  status: string
  sport: string
  league: string
  competitors: Array<{
    name: string
    abbreviation: string
    score: string
    homeAway: string
  }>
}

export interface NapkinbetsWeatherSnapshot {
  location: string
  forecastTime: string
  temperatureF: number
  feelsLikeF: number
  windMph: number
  highF: number | null
  lowF: number | null
  conditions: string
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
}

export async function getESPNScores(
  sport: string,
  league: string,
): Promise<NapkinbetsLiveGame[]> {
  if (!sport || !league) {
    return []
  }

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${encodeURIComponent(sport)}/${encodeURIComponent(league)}/scoreboard`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'napkinbets-prototype',
      },
    })

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as EspnScoreboardResponse
    const events = payload.events ?? []
    const games: NapkinbetsLiveGame[] = []

    for (const event of events.slice(0, 4)) {
      const competition = event.competitions?.[0]
      const competitors = competition?.competitors ?? []
      games.push({
        id: event.id ?? crypto.randomUUID(),
        name: event.name ?? `${sport} ${league}`,
        shortName: event.shortName ?? event.name ?? `${sport} ${league}`,
        status: event.status?.type?.description ?? 'Scheduled',
        sport,
        league,
        competitors: competitors.map((competitor) => ({
          name: competitor.team?.displayName ?? 'TBD',
          abbreviation: competitor.team?.abbreviation ?? '--',
          score: competitor.score ?? '0',
          homeAway: competitor.homeAway ?? 'away',
        })),
      })
    }

    return games
  } catch {
    return []
  }
}

export async function getWeatherForecast(
  latitude: string | null,
  longitude: string | null,
  location: string,
): Promise<NapkinbetsWeatherSnapshot | null> {
  if (!latitude || !longitude) {
    return null
  }

  try {
    const params = new URLSearchParams({
      latitude,
      longitude,
      current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      timezone: 'auto',
      forecast_days: '1',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'napkinbets-prototype',
      },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as OpenMeteoResponse
    const current = payload.current
    if (!current) {
      return null
    }

    const code = current.weather_code ?? 0
    return {
      location,
      forecastTime: current.time ?? new Date().toISOString(),
      temperatureF: Math.round(current.temperature_2m ?? 0),
      feelsLikeF: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
      windMph: Math.round(current.wind_speed_10m ?? 0),
      highF: payload.daily?.temperature_2m_max?.[0] ?? null,
      lowF: payload.daily?.temperature_2m_min?.[0] ?? null,
      conditions: WEATHER_CODES[code] ?? 'Conditions unavailable',
    }
  } catch {
    return null
  }
}

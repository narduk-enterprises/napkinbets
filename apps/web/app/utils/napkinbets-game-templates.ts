import type { CreateWagerInput } from '../../types/napkinbets'

export type NapkinbetsTemplateSupport = 'ready-now' | 'contract-next'

export interface NapkinbetsGameTemplate {
  key: string
  label: string
  categoryKey: 'quick-games' | 'group-pools' | 'golf-pools' | 'tournament-pools'
  categoryLabel: string
  sportKey: 'general' | 'football' | 'basketball' | 'golf' | 'multi-sport'
  sportLabel: string
  summary: string
  playersLabel: string
  durationLabel: string
  setupLabel: string
  scoringLabel: string
  support: NapkinbetsTemplateSupport
  featured: boolean
  eventBackedPreferred: boolean
  defaultCreateMode: 'event' | 'manual'
  prefill: Partial<CreateWagerInput>
}

const BASE_GAME_PREFILL: Partial<CreateWagerInput> = {
  creatorName: '',
  groupId: '',
  latitude: '',
  longitude: '',
  paymentHandle: '',
}

export const NAPKINBETS_GAME_TEMPLATES: readonly NapkinbetsGameTemplate[] = [
  {
    key: 'head-to-head',
    label: 'Head-to-Head Challenge',
    categoryKey: 'quick-games',
    categoryLabel: 'Quick Games',
    sportKey: 'general',
    sportLabel: 'Any event',
    summary: 'One opponent, one clean side, one simple result.',
    playersLabel: '2 players',
    durationLabel: 'Single event or one-off challenge',
    setupLabel: 'Pick a side, set a stake, invite one person',
    scoringLabel: 'Winner takes all',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: true,
    defaultCreateMode: 'manual',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Head-to-head challenge',
      description:
        'A simple one-on-one challenge with one clear side, one stake, and manual settle-up after the result is official.',
      napkinType: 'simple-bet',
      boardType: 'community-created',
      format: 'head-to-head',
      sport: 'basketball',
      contextKey: 'pro',
      league: 'nba',
      sideOptions: 'Side A\nSide B',
      participantNames: '',
      potRules: 'Winner: 100',
      entryFeeDollars: 20,
      paymentService: 'Venmo',
      venueName: 'Group chat or watch party',
      terms:
        'Friendly games only. Napkin Bets records the game, reminders, and proof, but all transfers happen manually through your preferred payment app.',
    },
  },
  {
    key: 'winner-pool',
    label: 'Winner Pool',
    categoryKey: 'group-pools',
    categoryLabel: 'Group Pools',
    sportKey: 'multi-sport',
    sportLabel: 'Sports',
    summary: 'A clean winner-based pool for a featured matchup, playoff game, or weekend slate.',
    playersLabel: '4 to 24 players',
    durationLabel: 'Single game, single event, or short slate',
    setupLabel: 'Attach an event or define the sides and seats',
    scoringLabel: 'Most-correct or winner-take-all',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Winner pool',
      description:
        'A fast group pool built around a featured event, with clear sides, standings, and manual settle-up after the final.',
      napkinType: 'pool',
      boardType: 'event-backed',
      format: 'winner-pool',
      sport: 'football',
      contextKey: 'pro',
      league: 'nfl',
      sideOptions: 'Favorite\nUnderdog\nField upset',
      participantNames: '',
      potRules: 'Winner: 100',
      entryFeeDollars: 20,
      paymentService: 'Venmo',
      venueName: 'Watch party',
      scoringRule: 'most-correct',
      terms:
        'Friendly games only. Napkin Bets keeps the pool organized, but payment still happens manually after the result is official.',
    },
  },
  {
    key: 'event-prediction-pool',
    label: 'Event Prediction Pool',
    categoryKey: 'group-pools',
    categoryLabel: 'Group Pools',
    sportKey: 'multi-sport',
    sportLabel: 'Sports and events',
    summary: 'A multi-question pool for a sports weekend, award show, finale, or playoff round.',
    playersLabel: '4 to 30 players',
    durationLabel: 'Single event or single weekend',
    setupLabel: 'Add questions, answers, and tiebreak logic',
    scoringLabel: 'Most-correct or closest-answer scoring',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: false,
    defaultCreateMode: 'manual',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Event prediction pool',
      description:
        'A multi-question pool with simple standings, a clear lock time, and manual settle-up after the event wraps.',
      napkinType: 'pool',
      boardType: 'manual-curated',
      format: 'event-prediction-pool',
      sport: 'other',
      contextKey: 'community',
      league: '',
      sideOptions: 'Entry A\nEntry B\nEntry C\nEntry D',
      participantNames: '',
      potRules: 'Winner: 70\nTiebreak winner: 30',
      entryFeeDollars: 20,
      paymentService: 'Venmo',
      venueName: 'Group chat',
      scoringRule: 'most-correct',
      terms:
        'Friendly games only. The host sets the questions and the group settles manually after the final answers are official.',
    },
  },
  {
    key: 'golf-winner-pool',
    label: 'Golf Winner Pool',
    categoryKey: 'golf-pools',
    categoryLabel: 'Golf Pools',
    sportKey: 'golf',
    sportLabel: 'Golf',
    summary: 'A clean tournament pool for picking the winning golfer or best finisher.',
    playersLabel: '4 to 24 players',
    durationLabel: 'Single tournament',
    setupLabel: 'Attach a golf event, pick lanes, and post the purse or point logic',
    scoringLabel: 'Winner-based payout',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Golf winner pool',
      description:
        'A tournament winner pool with clear lanes, standings, and manual settle-up after the leaderboard goes final.',
      napkinType: 'pool',
      boardType: 'event-backed',
      format: 'golf-winner-pool',
      sport: 'golf',
      contextKey: 'tournament',
      league: 'pga',
      sideOptions: 'Featured golfer A\nFeatured golfer B\nFeatured golfer C',
      participantNames: '',
      potRules: 'Champion: 100',
      entryFeeDollars: 25,
      paymentService: 'Venmo',
      venueName: 'Clubhouse or text chain',
      scoringRule: 'most-correct',
      terms:
        'Friendly games only. Golf pools settle manually after the official leaderboard is posted.',
    },
  },
  {
    key: 'golf-major-challenge',
    label: 'Golf Major Challenge',
    categoryKey: 'golf-pools',
    categoryLabel: 'Golf Pools',
    sportKey: 'golf',
    sportLabel: 'Golf',
    summary:
      'A major-week format with multiple lanes, side outcomes, and standings that the room can track together.',
    playersLabel: '4 to 20 players',
    durationLabel: 'Major week or tournament weekend',
    setupLabel: 'Attach the event and customize the side-action questions',
    scoringLabel: 'Most-correct plus side-pot splits',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Golf major challenge',
      description:
        'A golf-first group challenge for major week, with featured golfer lanes, side questions, and a clear closeout flow after the final round.',
      napkinType: 'pool',
      boardType: 'event-backed',
      format: 'golf-major-challenge',
      sport: 'golf',
      contextKey: 'tournament',
      league: 'pga',
      sideOptions: 'Champion\nLow round\nWeekend charge',
      participantNames: '',
      potRules: 'Champion: 50\nLow round: 25\nWeekend charge: 25',
      entryFeeDollars: 25,
      paymentService: 'Venmo',
      venueName: 'Major-week room',
      scoringRule: 'most-correct',
      terms:
        'Friendly games only. Major-week challenges settle manually after the official result is posted.',
    },
  },
  {
    key: 'custom-side-game',
    label: 'Custom Side Game',
    categoryKey: 'quick-games',
    categoryLabel: 'Quick Games',
    sportKey: 'general',
    sportLabel: 'Any event',
    summary: 'A flexible format for watch-party props, side action, and quick group competition.',
    playersLabel: '2 to 24 players',
    durationLabel: 'One game, one room, or one short series',
    setupLabel: 'Write the sides or questions and publish fast',
    scoringLabel: 'Flexible payout and scoring rules',
    support: 'ready-now',
    featured: true,
    eventBackedPreferred: false,
    defaultCreateMode: 'manual',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Custom side game',
      description:
        'A flexible social game for side action, prop bundles, and room-specific competition with manual settle-up after the result is clear.',
      napkinType: 'pool',
      boardType: 'manual-curated',
      format: 'custom-side-game',
      sport: 'other',
      contextKey: 'community',
      league: '',
      sideOptions: 'Yes\nNo\nCloser call',
      participantNames: '',
      potRules: 'Winner: 70\nCloser call: 30',
      entryFeeDollars: 10,
      paymentService: 'Venmo',
      venueName: 'Watch party',
      scoringRule: 'proportional',
      terms:
        'Friendly games only. The room agrees on the rules and settles manually once the result is official.',
    },
  },
  {
    key: 'pickem-slate',
    label: "Pick'em Slate",
    categoryKey: 'group-pools',
    categoryLabel: 'Group Pools',
    sportKey: 'football',
    sportLabel: 'Football and playoffs',
    summary: 'Pick winners across a slate of games and compare standings with the group.',
    playersLabel: '6 to 50 players',
    durationLabel: 'Weekly or round-based',
    setupLabel: 'Requires matchup list and bulk pick entry experience',
    scoringLabel: 'Most-correct standings',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: "Pick'em slate",
      napkinType: 'pool',
      format: 'pickem-slate',
    },
  },
  {
    key: 'confidence-pool',
    label: 'Confidence Pool',
    categoryKey: 'group-pools',
    categoryLabel: 'Group Pools',
    sportKey: 'football',
    sportLabel: 'Football and playoffs',
    summary: 'Assign confidence points to picks instead of treating every answer equally.',
    playersLabel: '6 to 50 players',
    durationLabel: 'Weekly or round-based',
    setupLabel: 'Requires weighted pick entry and score display',
    scoringLabel: 'Confidence-weighted standings',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Confidence pool',
      napkinType: 'pool',
      format: 'confidence-pool',
    },
  },
  {
    key: 'survivor-knockout',
    label: 'Survivor / Knockout',
    categoryKey: 'tournament-pools',
    categoryLabel: 'Tournament Pools',
    sportKey: 'football',
    sportLabel: 'Football',
    summary: 'Pick one winner each round or week without repeats and survive the longest.',
    playersLabel: '6 to 50 players',
    durationLabel: 'Weekly or season-long',
    setupLabel: 'Requires no-repeat enforcement and elimination states',
    scoringLabel: 'Last active entry wins',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Survivor pool',
      napkinType: 'pool',
      format: 'survivor-knockout',
    },
  },
  {
    key: 'football-squares',
    label: 'Football Squares',
    categoryKey: 'tournament-pools',
    categoryLabel: 'Tournament Pools',
    sportKey: 'football',
    sportLabel: 'Football',
    summary: 'Claim squares on a grid and settle by quarter or final score shells.',
    playersLabel: '10 to 100 players',
    durationLabel: 'Single featured game',
    setupLabel: 'Requires grid ownership and quarter-based payouts',
    scoringLabel: 'Quarter and final payout blocks',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Football squares',
      napkinType: 'pool',
      format: 'football-squares',
    },
  },
  {
    key: 'bracket-challenge',
    label: 'Bracket Challenge',
    categoryKey: 'tournament-pools',
    categoryLabel: 'Tournament Pools',
    sportKey: 'basketball',
    sportLabel: 'Tournament play',
    summary: 'Run a bracket or bracket-lite challenge with round scoring and tiebreaks.',
    playersLabel: '6 to 100 players',
    durationLabel: 'Tournament run',
    setupLabel: 'Requires bracket state and round scoring shells',
    scoringLabel: 'Round-based scoring',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Bracket challenge',
      napkinType: 'pool',
      format: 'bracket-challenge',
    },
  },
  {
    key: 'golf-one-and-done',
    label: 'Golf One-and-Done',
    categoryKey: 'golf-pools',
    categoryLabel: 'Golf Pools',
    sportKey: 'golf',
    sportLabel: 'Golf',
    summary: 'Pick one golfer per event with no repeats across the season or series.',
    playersLabel: '6 to 30 players',
    durationLabel: 'Season-long or multi-event',
    setupLabel: 'Requires no-repeat golfer tracking across events',
    scoringLabel: 'Points, purse, or finish-based scoring',
    support: 'contract-next',
    featured: false,
    eventBackedPreferred: true,
    defaultCreateMode: 'event',
    prefill: {
      ...BASE_GAME_PREFILL,
      title: 'Golf one-and-done',
      napkinType: 'pool',
      format: 'golf-one-and-done',
    },
  },
] as const

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  'sports-game': 'winner-pool',
  'sports-prop': 'event-prediction-pool',
  'sports-race': 'event-prediction-pool',
  'golf-draft': 'golf-major-challenge',
  'custom-prop': 'custom-side-game',
  'head-to-head': 'head-to-head',
}

export function normalizeNapkinbetsTemplateKey(templateKey: string, sport?: string) {
  const normalized = (templateKey || '').trim().toLowerCase()
  if (!normalized) {
    return sport === 'golf' ? 'golf-major-challenge' : 'winner-pool'
  }

  if (LEGACY_TEMPLATE_ALIASES[normalized]) {
    return LEGACY_TEMPLATE_ALIASES[normalized]
  }

  if (normalized.includes('golf')) {
    return normalized === 'golf' ? 'golf-major-challenge' : normalized
  }

  return normalized
}

export function findNapkinbetsGameTemplate(templateKey: string, sport?: string) {
  const normalizedKey = normalizeNapkinbetsTemplateKey(templateKey, sport)
  return NAPKINBETS_GAME_TEMPLATES.find((template) => template.key === normalizedKey) ?? null
}

export function getNapkinbetsTemplateFormatLabel(templateKey: string, sport?: string) {
  return findNapkinbetsGameTemplate(templateKey, sport)?.label ?? 'Custom game'
}

export function getNapkinbetsTemplateSupportLabel(support: NapkinbetsTemplateSupport) {
  return support === 'ready-now' ? 'Ready now' : 'Contract next'
}

export function getNapkinbetsTemplateSupportColor(support: NapkinbetsTemplateSupport) {
  return support === 'ready-now' ? 'success' : 'warning'
}

export function getNapkinbetsTemplateCreatePrefill(templateKey: string, sport?: string) {
  return findNapkinbetsGameTemplate(templateKey, sport)?.prefill ?? {}
}

export function isNapkinbetsGolfTemplate(templateKey: string, sport?: string) {
  return findNapkinbetsGameTemplate(templateKey, sport)?.categoryKey === 'golf-pools'
}

export function buildNapkinbetsTemplateCreateQuery(
  templateKey: string,
  overrides?: Record<string, string | undefined>,
) {
  const template = findNapkinbetsGameTemplate(templateKey)
  const napkinType = template?.prefill.napkinType === 'simple-bet' ? 'simple-bet' : 'pool'

  return {
    template: template?.key ?? normalizeNapkinbetsTemplateKey(templateKey),
    createMode: template?.defaultCreateMode ?? 'manual',
    napkinType,
    ...overrides,
  }
}

export function getNapkinbetsFeaturedTemplates() {
  return NAPKINBETS_GAME_TEMPLATES.filter(
    (template) => template.featured && template.support === 'ready-now',
  )
}

export function getNapkinbetsGolfTemplates() {
  return NAPKINBETS_GAME_TEMPLATES.filter((template) => template.categoryKey === 'golf-pools')
}

export function getNapkinbetsReadyNowTemplates() {
  return NAPKINBETS_GAME_TEMPLATES.filter((template) => template.support === 'ready-now')
}

export function getNapkinbetsContractNextTemplates() {
  return NAPKINBETS_GAME_TEMPLATES.filter((template) => template.support === 'contract-next')
}

export function getNapkinbetsCreatePoolTemplates() {
  return getNapkinbetsReadyNowTemplates().filter((template) => template.key !== 'head-to-head')
}

export function getNapkinbetsDefaultTemplateKey(options?: {
  sport?: string
  templateKey?: string
  napkinType?: 'simple-bet' | 'pool'
  createMode?: 'event' | 'manual'
}) {
  if (options?.napkinType === 'simple-bet') {
    return 'head-to-head'
  }

  if (options?.templateKey) {
    return normalizeNapkinbetsTemplateKey(options.templateKey, options.sport)
  }

  if (options?.sport === 'golf') {
    return options.createMode === 'manual' ? 'golf-winner-pool' : 'golf-major-challenge'
  }

  return options?.createMode === 'manual' ? 'custom-side-game' : 'winner-pool'
}

export interface NapkinbetsTourHero {
  kicker: string
  title: string
  summary: string
  callouts: string[]
}

export interface NapkinbetsTourSlide {
  id: string
  kicker: string
  title: string
  summary: string
  icon: string
  status: string
  tags: string[]
  imageSrc: string
  imageAlt: string
  accentClass: string
  details: string[]
}

export interface NapkinbetsTourFlowStep {
  id: string
  title: string
  summary: string
  signal: string
}

const hero: NapkinbetsTourHero = {
  kicker: 'First look',
  title: 'What Napkinbets is, in one guided lap.',
  summary:
    'Napkinbets turns a side bet, pool, or prop idea into a clean board with real event context, room management, and off-platform closeout.',
  callouts: [
    'Discovery starts from live and upcoming sports instead of asking people to type everything from scratch.',
    'Boards track seats, picks, reminders, and leaderboards without turning into a sportsbook.',
    'Money stays outside the app. Venmo, PayPal, Cash App, and Zelle still handle the transfer.',
  ],
}

const slides: NapkinbetsTourSlide[] = [
  {
    id: 'discover',
    kicker: 'Slide 1',
    title: 'Start from what is happening now',
    summary:
      'The intake path is the slate: live games, next-up events, and a few curated golf spots when they are worth attention.',
    icon: 'i-lucide-radar',
    status: 'Real events first',
    tags: ['Live slate', 'Filters', 'Quick board'],
    imageSrc: '/brand/imagery/discovery-paper-grid.webp',
    imageAlt: 'Napkinbets discovery board background',
    accentClass: 'from-emerald-100/90 via-amber-100/70 to-white',
    details: [
      'Pick a game or tournament and prefill the board in one tap.',
      'Use filters for sport, league, and live status instead of typing them by hand.',
      'Keep prop ideas visible without burying the real event context.',
    ],
  },
  {
    id: 'board',
    kicker: 'Slide 2',
    title: 'Turn the napkin into a board',
    summary:
      'Each board keeps the group aligned on sides, entry, format, and room rules without losing the informal energy.',
    icon: 'i-lucide-ticket-plus',
    status: 'Structured, not stiff',
    tags: ['Seats', 'Draft order', 'Side options'],
    imageSrc: '/brand/imagery/live-room-editorial.webp',
    imageAlt: 'Napkinbets live room editorial illustration',
    accentClass: 'from-amber-100/90 via-white to-emerald-100/75',
    details: [
      'Manual boards still work for things outside the ESPN data spine.',
      'Preset patterns cut down on freeform entry for common wager styles.',
      'The room sees one source of truth instead of a messy chat thread.',
    ],
  },
  {
    id: 'golf',
    kicker: 'Slide 3',
    title: 'Golf gets support, not the whole brand',
    summary:
      'Tournament pools and Masters-week boards are supported deeply, but the product still reads as general-purpose.',
    icon: 'i-lucide-flag',
    status: 'Curated when useful',
    tags: ['Masters', 'Draft pool', 'Leaderboard cues'],
    imageSrc: '/brand/imagery/masters-week-editorial.webp',
    imageAlt: 'Napkinbets Masters week editorial illustration',
    accentClass: 'from-emerald-200/80 via-amber-100/80 to-white',
    details: [
      'Editorial golf cards help big weeks feel special without making the whole app golf-only.',
      'Featured golfer lanes and cut sweat ideas are ready out of the box.',
      'The same board model still works for NBA, MLB, NHL, and college slates.',
    ],
  },
  {
    id: 'closeout',
    kicker: 'Slide 4',
    title: 'Close it out with proof, not payments',
    summary:
      'Napkinbets keeps payout cleanup accountable while leaving the actual transfer to the payment app people already use.',
    icon: 'i-lucide-wallet-cards',
    status: 'Off-platform settlement',
    tags: ['Proof', 'Confirmation', 'Payment rails'],
    imageSrc: '/brand/imagery/auth-table-scene.webp',
    imageAlt: 'Napkinbets tabletop onboarding illustration',
    accentClass: 'from-white via-amber-100/70 to-emerald-100/85',
    details: [
      'Players share handles and preferred rails on their account.',
      'Closeout tracks proof submitted, confirmed, or rejected for cleanup.',
      'The app organizes the payout process without creating gambling-processing risk.',
    ],
  },
]

const flowSteps: NapkinbetsTourFlowStep[] = [
  {
    id: 'step-discover',
    title: 'Discover',
    summary: 'Choose a live or upcoming event, or start from a compact custom board flow.',
    signal: 'The slate is the intake.',
  },
  {
    id: 'step-run',
    title: 'Run the board',
    summary: 'Manage participants, seats, picks, and reminders in one room-friendly workspace.',
    signal: 'The board is the source of truth.',
  },
  {
    id: 'step-closeout',
    title: 'Closeout',
    summary: 'Submit proof and confirm who paid where after the result is final.',
    signal: 'Money still moves outside the app.',
  },
]

export function useNapkinbetsTour() {
  return {
    hero,
    slides,
    flowSteps,
  }
}

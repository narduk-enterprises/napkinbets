export interface NapkinbetsTourAction {
  label: string
  to: string
  icon: string
  color: 'neutral' | 'primary'
  variant?: 'ghost' | 'soft' | 'solid'
}

export interface NapkinbetsTourSlide {
  id: string
  step: string
  title: string
  summary: string
  imageSrc: string
  imageAlt: string
  accentClass: string
  highlights: string[]
  footnote: string
  actions?: NapkinbetsTourAction[]
}

const slides: NapkinbetsTourSlide[] = [
  {
    id: 'tour-intro',
    step: 'Napkinbets',
    title: 'Friendly side bets, finally organized.',
    summary:
      'Take the side bet out of the chat thread and put it in one clear pool the whole room can follow.',
    imageSrc: '/brand/imagery/live-room-editorial.webp',
    imageAlt: 'Napkinbets live room editorial illustration',
    accentClass: 'from-white via-amber-100/80 to-emerald-100/75',
    highlights: [
      'Works for games, pools, props, drafts, and custom room bets.',
      'Keeps the tone social instead of looking like a sportsbook.',
      'Money still moves through Venmo, PayPal, Cash App, or Zelle.',
    ],
    footnote: 'Friendly bets only.',
  },
  {
    id: 'tour-discovery',
    step: '01 · Events',
    title: 'Start with the games.',
    summary:
      'Pick from live and upcoming games first, then launch a pool from real context instead of typing everything by hand.',
    imageSrc: '/brand/imagery/discovery-paper-grid.webp',
    imageAlt: 'Napkinbets discovery background illustration',
    accentClass: 'from-emerald-100/90 via-white to-amber-100/80',
    highlights: [
      'See what is live, what is next, and what is worth a quick pool right now.',
      'Use sport, league, and status filters instead of freeform entry.',
      'Golf fits the same intake flow without taking over the product.',
    ],
    footnote: 'Events are the intake path.',
  },
  {
    id: 'tour-board',
    step: '02 · Pool',
    title: 'Run the room in one pool.',
    summary:
      'Players, sides, picks, reminders, and leaderboard state all stay attached to the pool instead of scattered across messages.',
    imageSrc: '/brand/imagery/masters-week-editorial.webp',
    imageAlt: 'Napkinbets tournament pool illustration',
    accentClass: 'from-amber-100/85 via-white to-emerald-100/70',
    highlights: [
      'Quick presets reduce setup friction for common bet shapes.',
      'Event-backed and custom pools use the same core model.',
      'The room sees one source of truth for what the bet actually is.',
    ],
    footnote: 'The pool is the source of truth.',
  },
  {
    id: 'tour-closeout',
    step: '03 · Settle up',
    title: 'Settle up with proof.',
    summary:
      'When the result is final, Napkinbets tracks who submitted proof and who confirmed it, without ever processing the payment itself.',
    imageSrc: '/brand/imagery/auth-table-scene.webp',
    imageAlt: 'Napkinbets tabletop closeout illustration',
    accentClass: 'from-white via-emerald-100/75 to-amber-100/80',
    highlights: [
      'People share their preferred payment rails on their account.',
      'Proof can be submitted, confirmed, or sent back for correction.',
      'The settle-up flow stays clean without creating compliance problems.',
    ],
    footnote: 'Money stays off-platform.',
  },
  {
    id: 'tour-next',
    step: '04 · Coming next',
    title: 'What gets deeper from here.',
    summary:
      'The live product already handles the core flow. The next phase makes it broader, smarter, and easier to populate.',
    imageSrc: '/brand/imagery/discovery-paper-grid.webp',
    imageAlt: 'Napkinbets roadmap background illustration',
    accentClass: 'from-white via-amber-100/75 to-emerald-100/80',
    highlights: [
      'Broader event ingestion across major sports, college schedules, and higher-signal special events, with better imagery and logos.',
      'Community-created events so a pool can start from local tournaments, school sports, or one-off room ideas.',
      'Smarter assistive flows for filling gaps, suggesting structure, and reducing manual setup even further.',
    ],
    footnote: 'The roadmap is about less friction and broader coverage.',
  },
  {
    id: 'tour-cta',
    step: '05 · Try it',
    title: 'See the app for yourself.',
    summary:
      'Register, open the games, and see the real product flow with current data instead of reading more explanation.',
    imageSrc: '/brand/imagery/live-room-editorial.webp',
    imageAlt: 'Napkinbets onboarding illustration',
    accentClass: 'from-emerald-100/80 via-white to-white',
    highlights: [
      'Register to save payment rails and join pools.',
      'Open Events to start from the current schedule.',
      'Use the app directly after this instead of staying in the tour.',
    ],
    footnote: 'This page should get out of the way quickly.',
    actions: [
      {
        label: 'See the demo account',
        to: '/demo',
        icon: 'i-lucide-zap',
        color: 'primary',
        variant: 'solid',
      },
      {
        label: 'Register',
        to: '/register',
        icon: 'i-lucide-user-plus',
        color: 'neutral',
        variant: 'soft',
      },
      {
        label: 'Browse games',
        to: '/events',
        icon: 'i-lucide-radar',
        color: 'neutral',
        variant: 'soft',
      },
    ],
  },
]

export function useNapkinbetsTour() {
  return {
    slides,
  }
}

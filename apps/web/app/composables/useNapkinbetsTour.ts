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
    title: 'Friendly wagers, organized.',
    summary:
      'Take the side bet out of the chat thread and put it on one clear board the whole room can follow.',
    imageSrc: '/brand/imagery/live-room-editorial.webp',
    imageAlt: 'Napkinbets live room editorial illustration',
    accentClass: 'from-white via-amber-100/80 to-emerald-100/75',
    highlights: [
      'Works for games, pools, props, drafts, and custom room bets.',
      'Keeps the tone social instead of looking like a sportsbook.',
      'Money still moves through Venmo, PayPal, Cash App, or Zelle.',
    ],
    footnote: 'Friendly wagers only.',
  },
  {
    id: 'tour-discovery',
    step: '01 · Discover',
    title: 'Start with the slate.',
    summary:
      'Pick from live and upcoming events first, then launch a board from real context instead of typing everything by hand.',
    imageSrc: '/brand/imagery/discovery-paper-grid.webp',
    imageAlt: 'Napkinbets discovery background illustration',
    accentClass: 'from-emerald-100/90 via-white to-amber-100/80',
    highlights: [
      'See what is live, what is next, and what is worth a quick board right now.',
      'Use sport, league, and status filters instead of freeform entry.',
      'Golf support fits into the same intake flow without taking over the product.',
    ],
    footnote: 'Discovery is the intake path.',
  },
  {
    id: 'tour-board',
    step: '02 · Board',
    title: 'Run the room on one board.',
    summary:
      'Participants, sides, seats, picks, reminders, and leaderboard state all stay attached to the wager instead of scattered across messages.',
    imageSrc: '/brand/imagery/masters-week-editorial.webp',
    imageAlt: 'Napkinbets tournament board illustration',
    accentClass: 'from-amber-100/85 via-white to-emerald-100/70',
    highlights: [
      'Quick presets reduce setup friction for common wager patterns.',
      'Event-backed and custom boards use the same core model.',
      'The room sees one source of truth for what the bet actually is.',
    ],
    footnote: 'The board is the source of truth.',
  },
  {
    id: 'tour-closeout',
    step: '03 · Closeout',
    title: 'Close it out with proof.',
    summary:
      'When the result is final, Napkinbets tracks who submitted proof and who confirmed it, without ever processing the payment itself.',
    imageSrc: '/brand/imagery/auth-table-scene.webp',
    imageAlt: 'Napkinbets tabletop closeout illustration',
    accentClass: 'from-white via-emerald-100/75 to-amber-100/80',
    highlights: [
      'People share their preferred payment rails on their account.',
      'Proof can be submitted, confirmed, or sent back for correction.',
      'The closeout flow stays clean without creating compliance problems.',
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
      'Broader event ingestion across major sports, college slates, and higher-signal special events, with better imagery and logos.',
      'Community-created events so a board can start from local tournaments, school sports, or one-off room ideas.',
      'Smarter assistive flows for filling gaps, suggesting structure, and reducing manual setup even further.',
    ],
    footnote: 'The roadmap is about less friction and broader coverage.',
  },
  {
    id: 'tour-cta',
    step: '05 · Try it',
    title: 'Take your own lap.',
    summary:
      'Register, open the slate, and see the real product flow with current data instead of reading more explanation.',
    imageSrc: '/brand/imagery/live-room-editorial.webp',
    imageAlt: 'Napkinbets onboarding illustration',
    accentClass: 'from-emerald-100/80 via-white to-white',
    highlights: [
      'Register to save payment rails and join boards.',
      'Open discovery to start from the current slate.',
      'Use the app directly after this instead of staying in the tour.',
    ],
    footnote: 'This page should get out of the way quickly.',
    actions: [
      {
        label: 'Register',
        to: '/register',
        icon: 'i-lucide-user-plus',
        color: 'primary',
        variant: 'solid',
      },
      {
        label: 'Explore the slate',
        to: '/discover',
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

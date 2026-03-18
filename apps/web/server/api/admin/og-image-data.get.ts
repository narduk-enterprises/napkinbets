import { desc, eq } from 'drizzle-orm'
import { useAppDatabase } from '#server/utils/database'
import { napkinbetsWagers, napkinbetsGroups, napkinbetsEvents } from '../../database/schema'

/**
 * Builds OG image preview data for the admin tab.
 *
 * Instead of scraping HTML (which fails on auth-gated and redirect pages),
 * we construct the OG URLs directly from the `/_og/d/` route using the
 * same params that `useSeo({ ogImage: { ... } })` would produce.
 */

function buildOgUrl(params: { title: string; description: string; icon: string }): string {
  const encoded = [
    `c_Default`,
    `title_${params.title}`,
    `description_${params.description}`,
    `icon_${params.icon}`,
  ].join(',')

  return `/_og/d/${encoded}.png`
}

interface OgPreviewItem {
  label: string
  path: string
  ogUrl: string
}

interface OgPreviewSection {
  category: string
  items: OgPreviewItem[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useAppDatabase(event)

  const [wagers, groups, events] = await Promise.all([
    db
      .select({
        slug: napkinbetsWagers.slug,
        title: napkinbetsWagers.title,
        description: napkinbetsWagers.description,
        status: napkinbetsWagers.status,
        napkinType: napkinbetsWagers.napkinType,
        sport: napkinbetsWagers.sport,
      })
      .from(napkinbetsWagers)
      .orderBy(desc(napkinbetsWagers.createdAt))
      .limit(6),

    db
      .select({
        slug: napkinbetsGroups.slug,
        name: napkinbetsGroups.name,
        description: napkinbetsGroups.description,
      })
      .from(napkinbetsGroups)
      .orderBy(desc(napkinbetsGroups.createdAt))
      .limit(4),

    db
      .select({
        id: napkinbetsEvents.id,
        eventTitle: napkinbetsEvents.eventTitle,
        summary: napkinbetsEvents.summary,
        sport: napkinbetsEvents.sport,
        state: napkinbetsEvents.state,
      })
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.state, 'pre'))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(4),
  ])

  // ── Static pages ──────────────────────────────────────────
  const pages: OgPreviewSection = {
    category: 'Pages',
    items: [
      {
        label: 'Home Page',
        path: '/',
        ogUrl: buildOgUrl({
          title: 'Pick a game. Start a bet. Settle after the final.',
          description: 'Real games first. Simple bets second.',
          icon: '🎯',
        }),
      },
      {
        label: 'Dashboard',
        path: '/dashboard',
        ogUrl: buildOgUrl({
          title: 'Dashboard',
          description: 'Manage the bets you started, the ones you joined, and pending invitations.',
          icon: '📊',
        }),
      },
      {
        label: 'Events',
        path: '/events',
        ogUrl: buildOgUrl({
          title: 'Browse live and upcoming games',
          description: 'Pick a game then start a bet.',
          icon: '📡',
        }),
      },
      {
        label: 'Guide',
        path: '/guide',
        ogUrl: buildOgUrl({
          title: 'How Napkinbets works',
          description: 'Events, bets, settle-up — in plain English.',
          icon: '📘',
        }),
      },
      {
        label: 'Games',
        path: '/games',
        ogUrl: buildOgUrl({
          title: 'All games',
          description: 'Browse a full schedule across all leagues and sports.',
          icon: '🗓️',
        }),
      },
      {
        label: 'Tour',
        path: '/tour',
        ogUrl: buildOgUrl({
          title: 'See how Napkinbets works',
          description: 'A guided walkthrough for new users.',
          icon: '🎬',
        }),
      },
      {
        label: 'Ledger',
        path: '/ledger',
        ogUrl: buildOgUrl({
          title: 'Ledger',
          description: 'See who owes what and track settlement history.',
          icon: '📖',
        }),
      },
    ],
  }

  const sections: OgPreviewSection[] = [pages]

  // ── Wagers ────────────────────────────────────────────────
  if (wagers.length > 0) {
    sections.push({
      category: `Napkins (${wagers.length})`,
      items: wagers.map((w) => ({
        label: w.title,
        path: `/napkins/${w.slug}`,
        ogUrl: buildOgUrl({
          title: w.title,
          description: w.description || 'Bet detail and picks.',
          icon: '🧾',
        }),
      })),
    })
  }

  // ── Groups ────────────────────────────────────────────────
  if (groups.length > 0) {
    sections.push({
      category: `Groups (${groups.length})`,
      items: groups.map((g) => ({
        label: g.name,
        path: `/groups/${g.slug}`,
        ogUrl: buildOgUrl({
          title: g.name,
          description: g.description || 'View group details and members.',
          icon: '👥',
        }),
      })),
    })
  }

  // ── Events ────────────────────────────────────────────────
  if (events.length > 0) {
    sections.push({
      category: `Events (${events.length})`,
      items: events.map((e) => ({
        label: e.eventTitle,
        path: `/events/${e.id}`,
        ogUrl: buildOgUrl({
          title: e.eventTitle,
          description: e.summary || 'View event details, odds, and start a bet.',
          icon: '⚡',
        }),
      })),
    })
  }

  return { sections }
})

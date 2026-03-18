import { desc, eq, sql } from 'drizzle-orm'
import { useAppDatabase } from '#server/utils/database'
import {
  napkinbetsWagers,
  napkinbetsGroups,
  napkinbetsEvents,
  napkinbetsParticipants,
} from '../../database/schema'

/**
 * Builds OG image preview data for the admin tab.
 *
 * Constructs /_og/d/ URLs directly with enriched contextual tags
 * from DB data — no HTML scraping needed.
 */

function buildOgUrl(params: {
  title: string
  description: string
  icon: string
  tag?: string
  tagColor?: string
}): string {
  const parts = [
    `c_Default`,
    `title_${params.title}`,
    `description_${params.description}`,
    `icon_${params.icon}`,
  ]

  if (params.tag) parts.push(`tag_${params.tag}`)
  if (params.tagColor) parts.push(`tagColor_${params.tagColor}`)

  return `/_og/d/${parts.join(',')}.png`
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
        category: napkinbetsWagers.category,
      })
      .from(napkinbetsWagers)
      .orderBy(desc(napkinbetsWagers.createdAt))
      .limit(6),

    db
      .select({
        slug: napkinbetsGroups.slug,
        name: napkinbetsGroups.name,
        description: napkinbetsGroups.description,
        memberCount:
          sql<number>`(SELECT COUNT(*) FROM napkinbets_group_members WHERE group_id = ${napkinbetsGroups.id})`.as(
            'member_count',
          ),
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
        sportLabel: napkinbetsEvents.sportLabel,
        leagueLabel: napkinbetsEvents.leagueLabel,
        state: napkinbetsEvents.state,
      })
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.state, 'pre'))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(4),
  ])

  // Get participant counts for wagers in a single query
  const wagerIds = wagers.map((w) => w.slug)
  const participantCounts: Record<string, number> = {}
  if (wagerIds.length > 0) {
    const slugToId = new Map<string, string>()
    // We need wager IDs, so let's just fetch counts per slug
    const wagerRows = await db
      .select({
        slug: napkinbetsWagers.slug,
        id: napkinbetsWagers.id,
      })
      .from(napkinbetsWagers)
      .where(
        sql`${napkinbetsWagers.slug} IN (${sql.join(
          wagerIds.map((s) => sql`${s}`),
          sql`, `,
        )})`,
      )

    for (const row of wagerRows) {
      slugToId.set(row.id, row.slug)
    }

    const ids = wagerRows.map((r) => r.id)
    if (ids.length > 0) {
      const counts = await db
        .select({
          wagerId: napkinbetsParticipants.wagerId,
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(napkinbetsParticipants)
        .where(
          sql`${napkinbetsParticipants.wagerId} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .groupBy(napkinbetsParticipants.wagerId)

      for (const c of counts) {
        const slug = slugToId.get(c.wagerId)
        if (slug) participantCounts[slug] = c.count
      }
    }
  }

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
          tag: 'Your bets',
        }),
      },
      {
        label: 'Events',
        path: '/events',
        ogUrl: buildOgUrl({
          title: 'Browse live and upcoming games',
          description: 'Pick a game then start a bet.',
          icon: '📡',
          tag: 'Live & Upcoming',
          tagColor: '#22c55e',
        }),
      },
      {
        label: 'Guide',
        path: '/guide',
        ogUrl: buildOgUrl({
          title: 'How Napkinbets works',
          description: 'Events, bets, settle-up — in plain English.',
          icon: '📘',
          tag: 'Getting Started',
          tagColor: '#3b82f6',
        }),
      },
      {
        label: 'Games',
        path: '/games',
        ogUrl: buildOgUrl({
          title: 'All games',
          description: 'Browse a full schedule across all leagues and sports.',
          icon: '🗓️',
          tag: 'Full Schedule',
        }),
      },
      {
        label: 'Tour',
        path: '/tour',
        ogUrl: buildOgUrl({
          title: 'See how Napkinbets works',
          description: 'A guided walkthrough for new users.',
          icon: '🎬',
          tag: 'Walkthrough',
          tagColor: '#8b5cf6',
        }),
      },
      {
        label: 'Ledger',
        path: '/ledger',
        ogUrl: buildOgUrl({
          title: 'Ledger',
          description: 'See who owes what and track settlement history.',
          icon: '📖',
          tag: 'Settle Up',
          tagColor: '#f59e0b',
        }),
      },
    ],
  }

  const sections: OgPreviewSection[] = [pages]

  // ── Wagers ────────────────────────────────────────────────
  if (wagers.length > 0) {
    sections.push({
      category: `Napkins (${wagers.length})`,
      items: wagers.map((w) => {
        const typeLabel = w.napkinType === 'h2h' ? 'Head to Head' : 'Pool'
        const statusLabel =
          (w.status || 'open').charAt(0).toUpperCase() + (w.status || 'open').slice(1)
        const count = participantCounts[w.slug] || 0
        const countPart = count > 0 ? ` · ${count} players` : ''

        const statusColor =
          w.status === 'settled' ? '#f59e0b' : w.status === 'closed' ? '#ef4444' : '#22c55e'

        return {
          label: `${w.title} (${statusLabel})`,
          path: `/napkins/${w.slug}`,
          ogUrl: buildOgUrl({
            title: w.title,
            description: w.description || 'Bet detail and picks.',
            icon: w.status === 'settled' ? '🏆' : w.status === 'closed' ? '🔒' : '🧾',
            tag: `${typeLabel} · ${statusLabel}${countPart}`,
            tagColor: statusColor,
          }),
        }
      }),
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
          tag: `Group · ${g.memberCount || 0} members`,
          tagColor: '#8b5cf6',
        }),
      })),
    })
  }

  // ── Events ────────────────────────────────────────────────
  if (events.length > 0) {
    sections.push({
      category: `Events (${events.length})`,
      items: events.map((e) => {
        const stateLabel = e.state === 'in' ? 'Live' : e.state === 'post' ? 'Final' : 'Upcoming'

        const stateColor = e.state === 'in' ? '#22c55e' : e.state === 'post' ? '#64748b' : '#3b82f6'

        return {
          label: e.eventTitle,
          path: `/events/${e.id}`,
          ogUrl: buildOgUrl({
            title: e.eventTitle,
            description: e.summary || 'View event details, odds, and start a bet.',
            icon: e.state === 'in' ? '🔴' : e.state === 'post' ? '🏁' : '⚡',
            tag: `${e.leagueLabel || e.sportLabel || 'Sports'} · ${stateLabel}`,
            tagColor: stateColor,
          }),
        }
      }),
    })
  }

  return { sections }
})

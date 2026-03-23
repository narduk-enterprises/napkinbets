import { desc, eq, sql } from 'drizzle-orm'
import { useAppDatabase } from '#server/utils/database'
import {
  napkinbetsWagers,
  napkinbetsGroups,
  napkinbetsEvents,
  napkinbetsParticipants,
} from '#server/database/schema'

/**
 * Builds OG image preview data for the admin tab.
 *
 * Constructs /_og/d/ URLs directly with enriched contextual data
 * from DB — team logos, start times, player counts, etc.
 */

function buildOgUrl(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}_${v}`)

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

interface TeamJson {
  name?: string
  shortName?: string
  abbreviation?: string
  logoUrl?: string
}

function parseTeamJson(json: string): TeamJson {
  try {
    return JSON.parse(json) as TeamJson
  } catch {
    return {}
  }
}

function formatStartTime(iso: string): string {
  try {
    const d = new Date(iso)
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'America/New_York' })
    const day = d.getDate()
    const time = d.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    })
    return `${month} ${day} · ${time} ET`
  } catch {
    return ''
  }
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
        stakeCents: napkinbetsWagers.entryFeeCents,
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
        startTime: napkinbetsEvents.startTime,
        venueName: napkinbetsEvents.venueName,
        broadcast: napkinbetsEvents.broadcast,
        homeTeamJson: napkinbetsEvents.homeTeamJson,
        awayTeamJson: napkinbetsEvents.awayTeamJson,
      })
      .from(napkinbetsEvents)
      .where(eq(napkinbetsEvents.state, 'pre'))
      .orderBy(desc(napkinbetsEvents.startTime))
      .limit(4),
  ])

  // Get participant counts for wagers
  const wagerSlugs = wagers.map((w) => w.slug)
  const participantCounts: Record<string, number> = {}
  if (wagerSlugs.length > 0) {
    const wagerRows = await db
      .select({
        slug: napkinbetsWagers.slug,
        id: napkinbetsWagers.id,
      })
      .from(napkinbetsWagers)
      .where(
        sql`${napkinbetsWagers.slug} IN (${sql.join(
          wagerSlugs.map((s) => sql`${s}`),
          sql`, `,
        )})`,
      )

    const slugToId = new Map<string, string>()
    for (const row of wagerRows) slugToId.set(row.id, row.slug)

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
          c: 'Default',
          title: 'Pick a game. Start a bet. Settle after the final.',
          description: 'Real games first. Simple bets second.',
          icon: '🎯',
        }),
      },
      {
        label: 'Dashboard',
        path: '/dashboard',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'Dashboard',
          description: 'Your bets, invitations, and settle-up tasks — all in one place.',
          icon: '📊',
          tag: 'Your Bets',
          tagColor: '#166534',
        }),
      },
      {
        label: 'Events',
        path: '/events',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'Browse live and upcoming games',
          description: 'NFL, NBA, MLB, NHL, MLS and more. Pick a game, then start a bet.',
          icon: '📡',
          tag: 'Live & Upcoming',
          tagColor: '#166534',
        }),
      },
      {
        label: 'Guide',
        path: '/guide',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'How Napkinbets works',
          description: 'Events → Bets → Settle. The whole flow in plain English.',
          icon: '📘',
          tag: 'Getting Started',
          tagColor: '#3b82f6',
        }),
      },
      {
        label: 'Games',
        path: '/games',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'Full game schedule',
          description: 'Every league, every sport. Find the game you want to bet on.',
          icon: '🗓️',
          tag: 'All Leagues',
          tagColor: '#166534',
        }),
      },
      {
        label: 'Tour',
        path: '/tour',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'See how Napkinbets works',
          description: 'A quick guided walkthrough for new users.',
          icon: '🎬',
          tag: 'Walkthrough',
          tagColor: '#8b5cf6',
        }),
      },
      {
        label: 'Ledger',
        path: '/ledger',
        ogUrl: buildOgUrl({
          c: 'Default',
          title: 'Ledger',
          description: 'Who owes what And who already paid. Track every settlement.',
          icon: '📖',
          tag: 'Settle Up',
          tagColor: '#c67a12',
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
        const typeLabel = w.napkinType === 'simple-bet' ? 'Head to Head' : 'Pool'
        const statusLabel =
          (w.status || 'open').charAt(0).toUpperCase() + (w.status || 'open').slice(1)
        const count = participantCounts[w.slug] || 0
        const countPart = count > 0 ? ` · ${count} players` : ''
        const stakePart =
          w.stakeCents && w.stakeCents > 0 ? ` · $${(w.stakeCents / 100).toFixed(0)}` : ''

        const statusColor =
          w.status === 'settled' ? '#c67a12' : w.status === 'closed' ? '#8a2d14' : '#166534'

        return {
          label: `${w.title} (${statusLabel})`,
          path: `/napkins/${w.slug}`,
          ogUrl: buildOgUrl({
            c: 'Default',
            title: w.title,
            description: w.description || 'Bet detail, picks, and settlement.',
            icon: w.status === 'settled' ? '🏆' : w.status === 'closed' ? '🔒' : '🧾',
            tag: `${typeLabel} · ${statusLabel}${countPart}`,
            tagColor: statusColor,
            meta: `${w.category || w.sport || 'Custom'}${stakePart}`,
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
          c: 'Default',
          title: g.name,
          description: g.description || 'Private betting group. Members only.',
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

        const stateColor = e.state === 'in' ? '#166534' : e.state === 'post' ? '#64748b' : '#3b82f6'

        const home = parseTeamJson(e.homeTeamJson)
        const away = parseTeamJson(e.awayTeamJson)

        const metaParts = [formatStartTime(e.startTime)]
        if (e.broadcast) metaParts.push(e.broadcast)
        if (e.venueName) metaParts.push(e.venueName)
        const metaLine = metaParts.filter(Boolean).join(' · ')

        return {
          label: e.eventTitle,
          path: `/events/${e.id}`,
          ogUrl: buildOgUrl({
            c: 'Default',
            title: e.eventTitle,
            description: e.summary || 'View event details, odds, and start a bet.',
            icon: e.state === 'in' ? '🔴' : e.state === 'post' ? '🏁' : '⚡',
            tag: `${e.leagueLabel || e.sportLabel || 'Sports'} · ${stateLabel}`,
            tagColor: stateColor,
            meta: metaLine,
            homeLogo: home.logoUrl || '',
            awayLogo: away.logoUrl || '',
            homeLabel: home.abbreviation || home.shortName || '',
            awayLabel: away.abbreviation || away.shortName || '',
          }),
        }
      }),
    })
  }

  return { sections }
})

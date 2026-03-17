import { requireAuth } from '#layer/server/utils/auth'
import { loadPoolData } from '#server/services/napkinbets/pools'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const dashboard = await loadPoolData(event, { includeContext: false })

  const ownedWagers = dashboard.wagers.filter((wager) => wager.ownerUserId === user.id)
  const joinedWagers = dashboard.wagers.filter(
    (wager) =>
      wager.ownerUserId !== user.id &&
      wager.participants.some((participant) => participant.userId === user.id),
  )

  const reminders = [...ownedWagers, ...joinedWagers]
    .flatMap((wager) => wager.notifications)
    .filter((notification) => notification.deliveryStatus === 'queued')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8)

  const openSettlements =
    ownedWagers
      .flatMap((wager) => wager.participants)
      .filter((participant) => participant.paymentStatus !== 'confirmed').length +
    joinedWagers
      .flatMap((wager) => wager.participants)
      .filter(
        (participant) =>
          participant.userId === user.id && participant.paymentStatus !== 'confirmed',
      ).length

  return {
    metrics: [
      {
        label: 'Boards you own',
        value: String(ownedWagers.length),
        hint: 'managed from your dashboard',
        icon: 'i-lucide-layout-dashboard',
      },
      {
        label: 'Boards you joined',
        value: String(joinedWagers.length),
        hint: 'friendly wagers where you have a seat',
        icon: 'i-lucide-users',
      },
      {
        label: 'Queued reminders',
        value: String(reminders.length),
        hint: 'manual follow-up items',
        icon: 'i-lucide-bell-ring',
      },
      {
        label: 'Open settlements',
        value: String(openSettlements),
        hint: 'entries still waiting on proof',
        icon: 'i-lucide-wallet',
      },
    ],
    ownedWagers,
    joinedWagers,
    reminders,
    refreshedAt: dashboard.refreshedAt,
  }
})

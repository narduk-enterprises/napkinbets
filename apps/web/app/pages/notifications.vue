<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const notificationsState = useNapkinbetsNotifications()
const notifications = computed(() => notificationsState.data.value?.notifications ?? [])

function kindIcon(kind: string) {
  switch (kind) {
    case 'acceptance':
      return 'i-lucide-user-check'
    case 'reminder':
      return 'i-lucide-bell-ring'
    case 'results':
      return 'i-lucide-trophy'
    case 'payment':
      return 'i-lucide-wallet'
    default:
      return 'i-lucide-bell'
  }
}

function kindColor(kind: string) {
  switch (kind) {
    case 'acceptance':
      return 'info'
    case 'reminder':
      return 'warning'
    case 'results':
      return 'success'
    case 'payment':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function timeAgo(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

useSeo({
  title: 'Notifications',
  description: 'All your bet notifications — invites, reminders, results, and payment updates.',
  ogImage: {
    title: 'Napkinbets Notifications',
    description: 'Stay on top of every bet update.',
    icon: '🔔',
  },
})

useWebPageSchema({
  name: 'Napkinbets Notifications',
  description: 'A list of all notifications across the bets you started and joined.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="space-y-3">
        <p class="napkinbets-kicker">Notifications</p>
        <h1 class="napkinbets-section-title">Everything that needs your attention.</h1>
        <p class="napkinbets-hero-lede">
          Invites, reminders, results, and payment follow-ups from every bet you are part of.
        </p>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your notifications.</p>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          v-if="notificationsState.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Failed to load notifications"
          :description="notificationsState.error.value.message"
        />

        <div v-else-if="notifications.length" class="space-y-3">
          <NuxtLink
            v-for="notification in notifications"
            :key="notification.id"
            :to="`/napkins/${notification.wagerSlug}`"
            class="napkinbets-notification-row"
          >
            <div class="napkinbets-notification-row-icon">
              <UIcon :name="kindIcon(notification.kind)" class="size-4" />
            </div>

            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-default">{{ notification.title }}</p>
                <UBadge
                  v-if="notification.deliveryStatus === 'queued'"
                  color="primary"
                  variant="soft"
                  size="xs"
                >
                  new
                </UBadge>
              </div>
              <p class="text-sm text-muted">{{ notification.body }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <UBadge :color="kindColor(notification.kind)" variant="subtle" size="xs">
                  {{ notification.kind }}
                </UBadge>
                <span class="text-xs text-dimmed">
                  {{ notification.wagerTitle }} · {{ timeAgo(notification.createdAt) }}
                </span>
              </div>
            </div>

            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
          </NuxtLink>
        </div>

        <UAlert
          v-else
          color="neutral"
          variant="soft"
          icon="i-lucide-bell-off"
          title="No notifications"
          description="You don't have any notifications yet. They'll show up here once you start or join bets."
        />
      </div>
    </ClientOnly>
  </div>
</template>

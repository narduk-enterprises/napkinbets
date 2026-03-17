<script setup lang="ts">
const { loggedIn } = useAuth()
const notificationsState = loggedIn.value ? useNapkinbetsNotifications() : null

const unreadCount = computed(() => notificationsState?.data.value?.unreadCount ?? 0)
const latestNotifications = computed(() =>
  (notificationsState?.data.value?.notifications ?? []).slice(0, 5),
)

const isOpen = ref(false)

function handleNotificationClick(id: string) {
  isOpen.value = false
  notificationsState?.markAsRead(id)
}

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
    case 'friend_request':
      return 'i-lucide-users'
    default:
      return 'i-lucide-bell'
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
</script>

<template>
  <ClientOnly>
    <UPopover v-if="loggedIn" v-model:open="isOpen">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-bell"
        aria-label="Notifications"
        class="relative"
      >
        <span v-if="unreadCount > 0" class="napkinbets-notification-badge">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </UButton>

      <template #content>
        <div class="napkinbets-notification-dropdown">
          <div class="napkinbets-notification-dropdown-header">
            <p class="napkinbets-kicker">Notifications</p>
            <UBadge v-if="unreadCount > 0" color="primary" variant="soft" size="sm">
              {{ unreadCount }} new
            </UBadge>
          </div>

          <div v-if="latestNotifications.length" class="napkinbets-notification-dropdown-list">
            <NuxtLink
              v-for="notification in latestNotifications"
              :key="notification.id"
              :to="
                notification.wagerSlug
                  ? `/napkins/${notification.wagerSlug}`
                  : notification.kind === 'friend_request'
                    ? '/friends'
                    : '/notifications'
              "
              class="napkinbets-notification-dropdown-item"
              @click="handleNotificationClick(notification.id)"
            >
              <div class="napkinbets-notification-dropdown-icon">
                <UIcon :name="kindIcon(notification.kind)" class="size-3.5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="napkinbets-notification-dropdown-title">{{ notification.title }}</p>
                <p class="napkinbets-notification-dropdown-body">{{ notification.body }}</p>
                <p class="napkinbets-notification-dropdown-meta">
                  <template v-if="notification.wagerTitle"
                    >{{ notification.wagerTitle }} · </template
                  >{{ timeAgo(notification.createdAt) }}
                </p>
              </div>
              <UBadge
                v-if="notification.deliveryStatus === 'queued'"
                color="primary"
                variant="soft"
                size="xs"
              >
                new
              </UBadge>
            </NuxtLink>
          </div>

          <div v-else class="napkinbets-notification-dropdown-empty">
            <UIcon name="i-lucide-bell-off" class="size-5 text-dimmed" />
            <p class="text-sm text-muted">No notifications yet</p>
          </div>

          <div class="napkinbets-notification-dropdown-footer">
            <UButton
              to="/notifications"
              color="neutral"
              variant="ghost"
              size="sm"
              block
              trailing-icon="i-lucide-arrow-right"
              @click="isOpen = false"
            >
              View all notifications
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </ClientOnly>
</template>

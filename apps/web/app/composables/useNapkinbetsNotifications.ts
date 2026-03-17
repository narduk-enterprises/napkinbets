import type { NapkinbetsNotificationsResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_NOTIFICATIONS: NapkinbetsNotificationsResponse = {
  notifications: [],
  unreadCount: 0,
}

export function useNapkinbetsNotifications() {
  const api = useNapkinbetsApi()

  const data = useState<NapkinbetsNotificationsResponse>(
    'napkinbets-notifications:data',
    () => EMPTY_NOTIFICATIONS,
  )

  const asyncState = useAsyncData(
    'napkinbets-notifications-fetch',
    async () => {
      const response = await api.getNotifications()
      data.value = response
      return true
    },
    {
      server: false,
      lazy: true,
      getCachedData() {
        if (data.value && data.value.notifications.length > 0) {
          return true
        }
        return
      },
    },
  )

  async function markAsRead(id: string) {
    if (!data.value) return
    const notification = data.value.notifications.find((n) => n.id === id)
    if (!notification || notification.deliveryStatus !== 'queued') return

    // Optimistically update read state in shared store
    notification.deliveryStatus = 'read'
    data.value.unreadCount = Math.max(0, data.value.unreadCount - 1)

    try {
      await api.markNotificationRead(id)
    } catch {
      // Revert if API fails
      asyncState.refresh()
    }
  }

  return {
    data,
    pending: asyncState.pending,
    error: asyncState.error,
    refresh: asyncState.refresh,
    markAsRead,
  }
}

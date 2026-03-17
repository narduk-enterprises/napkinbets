import type { NapkinbetsNotificationsResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_NOTIFICATIONS: NapkinbetsNotificationsResponse = {
  notifications: [],
  unreadCount: 0,
}

export function useNapkinbetsNotifications() {
  const api = useNapkinbetsApi()

  const state = useAsyncData<NapkinbetsNotificationsResponse>(
    'napkinbets-notifications',
    () => api.getNotifications(),
    {
      default: () => EMPTY_NOTIFICATIONS,
      server: false,
      lazy: true,
    },
  )

  async function markAsRead(id: string) {
    if (!state.data.value) return
    const notification = state.data.value.notifications.find((n) => n.id === id)
    if (!notification || notification.deliveryStatus !== 'queued') return

    // Optimistically update read state
    notification.deliveryStatus = 'read'
    state.data.value.unreadCount = Math.max(0, state.data.value.unreadCount - 1)

    try {
      await api.markNotificationRead(id)
    } catch {
      // Revert if API fails
      state.refresh()
    }
  }

  return {
    ...state,
    markAsRead,
  }
}

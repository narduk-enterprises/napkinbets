import type { NapkinbetsNotificationsResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_NOTIFICATIONS: NapkinbetsNotificationsResponse = {
  notifications: [],
  unreadCount: 0,
}

export function useNapkinbetsNotifications() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsNotificationsResponse>(
    'napkinbets-notifications',
    () => api.getNotifications(),
    {
      default: () => EMPTY_NOTIFICATIONS,
      server: false,
      lazy: true,
    },
  )
}

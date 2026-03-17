import type { NapkinbetsWorkspaceResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

type NapkinbetsAsyncOptions = {
  server?: boolean
  lazy?: boolean
}

const EMPTY_WORKSPACE: NapkinbetsWorkspaceResponse = {
  metrics: [],
  ownedWagers: [],
  joinedWagers: [],
  invitedWagers: [],
  reminders: [],
  refreshedAt: '',
}

export function useNapkinbetsWorkspace(options?: NapkinbetsAsyncOptions) {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsWorkspaceResponse>(
    'napkinbets-workspace',
    () => api.getWorkspace(),
    {
      default: () => EMPTY_WORKSPACE,
      ...options,
    },
  )
}

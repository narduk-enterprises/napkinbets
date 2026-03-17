import type { NapkinbetsWorkspaceResponse } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

const EMPTY_WORKSPACE: NapkinbetsWorkspaceResponse = {
  metrics: [],
  ownedWagers: [],
  joinedWagers: [],
  reminders: [],
  refreshedAt: '',
}

export function useNapkinbetsWorkspace() {
  const api = useNapkinbetsApi()

  return useAsyncData<NapkinbetsWorkspaceResponse>(
    'napkinbets-workspace',
    () => api.getWorkspace(),
    {
      default: () => EMPTY_WORKSPACE,
    },
  )
}

import type { NapkinbetsGroup } from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

interface NapkinbetsGroupsLoadingState {
  bundle: boolean
  mutate: boolean
}

export function useNapkinbetsGroupsStore() {
  const api = useNapkinbetsApi()
  const groups = useState<NapkinbetsGroup[]>('napkinbets-groups:groups', () => [])
  const myGroups = useState<NapkinbetsGroup[]>('napkinbets-groups:mine', () => [])
  const error = useState<string | null>('napkinbets-groups:error', () => null)
  const loading = useState<NapkinbetsGroupsLoadingState>('napkinbets-groups:loading', () => ({
    bundle: false,
    mutate: false,
  }))

  const groupOptions = computed(() =>
    myGroups.value.map((group) => ({
      label: group.name,
      value: group.id,
      description: group.description,
    })),
  )

  async function fetchBundle() {
    loading.value.bundle = true
    error.value = null

    try {
      const bundle = await api.getGroups()
      groups.value = bundle.groups
      myGroups.value = bundle.myGroups
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Failed to load groups.'
      throw caught
    } finally {
      loading.value.bundle = false
    }
  }

  async function runMutation<T>(runner: () => Promise<T>) {
    loading.value.mutate = true
    error.value = null

    try {
      const result = await runner()
      await fetchBundle()
      return result
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Group action failed.'
      throw caught
    } finally {
      loading.value.mutate = false
    }
  }

  return {
    groups,
    myGroups,
    groupOptions,
    error,
    loading,
    fetchBundle,
    createGroup(payload: {
      name: string
      description: string
      visibility: 'public' | 'private'
      joinPolicy: 'open' | 'invite-only' | 'closed'
    }) {
      return runMutation(() => api.createGroup(payload))
    },
    joinGroup(groupId: string) {
      return runMutation(() => api.joinGroup(groupId))
    },
  }
}

import type {
  NapkinbetsFriend,
  NapkinbetsFriendRequest,
  NapkinbetsFriendSearchResult,
} from '../../types/napkinbets'
import { useNapkinbetsApi } from '../services/napkinbets-api'

interface NapkinbetsFriendsLoadingState {
  bundle: boolean
  search: boolean
  mutate: boolean
}

export function useNapkinbetsFriendsStore() {
  const api = useNapkinbetsApi()
  const friends = useState<NapkinbetsFriend[]>('napkinbets-friends:friends', () => [])
  const incomingRequests = useState<NapkinbetsFriendRequest[]>(
    'napkinbets-friends:incoming',
    () => [],
  )
  const outgoingRequests = useState<NapkinbetsFriendRequest[]>(
    'napkinbets-friends:outgoing',
    () => [],
  )
  const searchResults = useState<NapkinbetsFriendSearchResult[]>(
    'napkinbets-friends:search-results',
    () => [],
  )
  const error = useState<string | null>('napkinbets-friends:error', () => null)
  const loading = useState<NapkinbetsFriendsLoadingState>('napkinbets-friends:loading', () => ({
    bundle: false,
    search: false,
    mutate: false,
  }))

  const friendOptions = computed(() =>
    friends.value.map((friend) => ({
      label: friend.displayName,
      value: friend.id,
      description: friend.email,
    })),
  )

  async function fetchBundle() {
    loading.value.bundle = true
    error.value = null

    try {
      const bundle = await api.getFriends()
      friends.value = bundle.friends
      incomingRequests.value = bundle.incomingRequests
      outgoingRequests.value = bundle.outgoingRequests
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Failed to load friends.'
      throw caught
    } finally {
      loading.value.bundle = false
    }
  }

  async function searchUsers(query: string) {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      searchResults.value = []
      return
    }

    loading.value.search = true
    try {
      const response = await api.searchUsers(normalizedQuery)
      searchResults.value = response.results
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Failed to search users.'
      throw caught
    } finally {
      loading.value.search = false
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
      error.value = caught instanceof Error ? caught.message : 'Friend action failed.'
      throw caught
    } finally {
      loading.value.mutate = false
    }
  }

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    friendOptions,
    error,
    loading,
    fetchBundle,
    searchUsers,
    clearSearch() {
      searchResults.value = []
    },
    sendFriendRequest(targetUserId: string) {
      return runMutation(() => api.sendFriendRequest(targetUserId))
    },
    acceptFriendRequest(requestId: string) {
      return runMutation(() => api.acceptFriendRequest(requestId))
    },
    declineFriendRequest(requestId: string) {
      return runMutation(() => api.declineFriendRequest(requestId))
    },
    removeFriend(friendshipId: string) {
      return runMutation(() => api.removeFriend(friendshipId))
    },
  }
}

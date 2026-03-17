<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const toast = useToast()
const friendsStore = useNapkinbetsFriendsStore()
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

await callOnce(
  'napkinbets-friends-page',
  async () => {
    await friendsStore.fetchBundle()
  },
  { mode: 'navigation' },
)

watch(searchQuery, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(async () => {
    if (!value.trim()) {
      friendsStore.clearSearch()
      return
    }

    await friendsStore.searchUsers(value)
  }, 250)
})

async function handleSendRequest(userId: string) {
  try {
    await friendsStore.sendFriendRequest(userId)
    searchQuery.value = ''
    friendsStore.clearSearch()
    toast.add({ title: 'Friend request sent', color: 'success' })
  } catch {
    toast.add({ title: 'Friend request failed', color: 'error' })
  }
}

async function handleAccept(requestId: string) {
  try {
    await friendsStore.acceptFriendRequest(requestId)
    toast.add({ title: 'Friend added', color: 'success' })
  } catch {
    toast.add({ title: 'Could not accept request', color: 'error' })
  }
}

async function handleDecline(requestId: string) {
  try {
    await friendsStore.declineFriendRequest(requestId)
    toast.add({ title: 'Request cleared', color: 'success' })
  } catch {
    toast.add({ title: 'Could not update request', color: 'error' })
  }
}

async function handleRemove(friendshipId: string) {
  try {
    await friendsStore.removeFriend(friendshipId)
    toast.add({ title: 'Friend removed', color: 'success' })
  } catch {
    toast.add({ title: 'Could not remove friend', color: 'error' })
  }
}

useSeo({
  title: 'Friends',
  description: 'Add the people you actually bet with so one-on-one napkins are fast to start.',
  image: '/brand/og/dashboard.webp',
})

useWebPageSchema({
  name: 'Napkinbets Friends',
  description: 'Manage friends for quick one-on-one napkins and shared rooms.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Friends</p>
        <h1 class="napkinbets-section-title">Keep the people handy before you start the napkin.</h1>
        <p class="napkinbets-hero-lede">
          Add regular opponents once, then spin up a simple bet without retyping names every time.
        </p>
      </div>
    </div>

    <UAlert
      v-if="friendsStore.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Friends failed to load"
      :description="friendsStore.error.value"
    />

    <div class="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Find people</p>
            <h2 class="napkinbets-subsection-title">Search by name or email</h2>
          </div>

          <UInput
            v-model="searchQuery"
            class="w-full"
            icon="i-lucide-search"
            placeholder="Olivia Ramos or olivia@napkinbets.app"
          />

          <div v-if="friendsStore.loading.value.search" class="napkinbets-aside-note">
            <p class="napkinbets-support-copy">Searching users…</p>
          </div>

          <div v-else-if="friendsStore.searchResults.value.length" class="space-y-3">
            <div
              v-for="result in friendsStore.searchResults.value"
              :key="result.id"
              class="napkinbets-surface flex items-center justify-between gap-3"
            >
              <div class="min-w-0 space-y-1">
                <p class="font-semibold text-default">{{ result.displayName }}</p>
                <p class="truncate text-sm text-muted">{{ result.email }}</p>
              </div>

              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-user-plus"
                :loading="friendsStore.loading.value.mutate"
                @click="handleSendRequest(result.id)"
              >
                Add
              </UButton>
            </div>
          </div>

          <UAlert
            v-else
            color="neutral"
            variant="soft"
            icon="i-lucide-search"
            title="Search stays light"
            description="Type at least two characters to find another account."
          />
        </div>
      </UCard>

      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Your bench</p>
                <h2 class="napkinbets-subsection-title">Friends ready for a simple bet</h2>
              </div>
              <UBadge color="neutral" variant="subtle">{{
                friendsStore.friends.value.length
              }}</UBadge>
            </div>

            <div v-if="friendsStore.friends.value.length" class="space-y-3">
              <div
                v-for="friend in friendsStore.friends.value"
                :key="friend.friendshipId"
                class="napkinbets-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0 space-y-1">
                  <p class="font-semibold text-default">{{ friend.displayName }}</p>
                  <p class="truncate text-sm text-muted">{{ friend.email }}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    :to="`/napkins/create?napkinType=simple-bet&friendId=${friend.id}`"
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-ticket-plus"
                  >
                    Start simple bet
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-user-minus"
                    :loading="friendsStore.loading.value.mutate"
                    @click="handleRemove(friend.friendshipId)"
                  >
                    Remove
                  </UButton>
                </div>
              </div>
            </div>

            <UAlert
              v-else
              color="info"
              variant="soft"
              icon="i-lucide-users"
              title="No friends yet"
              description="Add one person here and the simple-bet flow gets much faster."
            />
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-3">
                <div class="space-y-1">
                  <p class="napkinbets-kicker">Incoming</p>
                  <h2 class="napkinbets-subsection-title">Requests waiting on you</h2>
                </div>

                <div v-if="friendsStore.incomingRequests.value.length" class="space-y-3">
                  <div
                    v-for="request in friendsStore.incomingRequests.value"
                    :key="request.friendshipId"
                    class="napkinbets-surface space-y-3"
                  >
                    <div class="space-y-1">
                      <p class="font-semibold text-default">{{ request.displayName }}</p>
                      <p class="text-sm text-muted">{{ request.email }}</p>
                    </div>
                    <div class="flex gap-2">
                      <UButton
                        color="primary"
                        variant="soft"
                        size="sm"
                        :loading="friendsStore.loading.value.mutate"
                        @click="handleAccept(request.friendshipId)"
                      >
                        Accept
                      </UButton>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :loading="friendsStore.loading.value.mutate"
                        @click="handleDecline(request.friendshipId)"
                      >
                        Decline
                      </UButton>
                    </div>
                  </div>
                </div>

                <p v-else class="text-sm text-muted">Nothing waiting on you right now.</p>
              </div>

              <div class="space-y-3">
                <div class="space-y-1">
                  <p class="napkinbets-kicker">Outgoing</p>
                  <h2 class="napkinbets-subsection-title">Requests you already sent</h2>
                </div>

                <div v-if="friendsStore.outgoingRequests.value.length" class="space-y-3">
                  <div
                    v-for="request in friendsStore.outgoingRequests.value"
                    :key="request.friendshipId"
                    class="napkinbets-surface flex items-center justify-between gap-3"
                  >
                    <div class="min-w-0 space-y-1">
                      <p class="font-semibold text-default">{{ request.displayName }}</p>
                      <p class="truncate text-sm text-muted">{{ request.email }}</p>
                    </div>

                    <UBadge color="warning" variant="soft">Pending</UBadge>
                  </div>
                </div>

                <p v-else class="text-sm text-muted">No pending invites sent.</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

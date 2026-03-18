<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const slug = route.params.slug as string
const toast = useToast()
const groupsStore = useNapkinbetsGroupsStore()

const { data, pending, error, refresh: refreshGroup } = useNapkinbetsGroupDetail(slug)
const {
  data: wagersData,
  status: wagersStatus,
  error: wagersError,
} = useNapkinbetsGroupWagers(slug)

const { filterChips, activeFilter, filterWagerList, groupWagersByStage } =
  useNapkinbetsWagerListFilter()

const wagers = computed(() => wagersData.value?.wagers ?? [])
const wagersByStage = computed(() => groupWagersByStage(wagers.value))
const filteredWagers = computed(() => filterWagerList(wagers.value))
const showGrouped = computed(() => activeFilter.value === 'all')

function setWagerFilter(
  v: import('../../composables/useNapkinbetsWagerListFilter').NapkinbetsWagerListFilterValue,
) {
  activeFilter.value = v
}

const canJoin = computed(
  () =>
    data.value?.group &&
    !data.value.group.userRole &&
    data.value.group.visibility === 'public' &&
    data.value.group.joinPolicy === 'open',
)
const canLeave = computed(
  () => data.value?.group?.userRole && data.value.group.userRole !== 'owner',
)
const joinLeavePending = computed(() => groupsStore.loading.value.mutate)

async function handleJoin() {
  if (!data.value?.group) return
  try {
    await groupsStore.joinGroup(data.value.group.id)
    await refreshGroup()
    toast.add({ title: 'Joined group', color: 'success' })
  } catch {
    toast.add({ title: 'Could not join group', color: 'error' })
  }
}

async function handleLeave() {
  if (!data.value?.group) return
  try {
    await groupsStore.leaveGroup(data.value.group.id)
    await refreshGroup()
    toast.add({ title: 'Left group', color: 'success' })
  } catch {
    toast.add({ title: 'Could not leave group', color: 'error' })
  }
}

useSeo({
  title: () => data.value?.group.name || 'Group Details',
  description: () => data.value?.group.description || 'View group details and members.',
  ogImage: {
    title: data.value?.group.name || 'Group Details',
    description: data.value?.group.description || 'View group details and members.',
    icon: '👥',
  },
})

useWebPageSchema({
  name: () => data.value?.group.name || 'Group Details',
  description: () => data.value?.group.description || 'View group details and members.',
})
</script>

<template>
  <div class="napkinbets-page">
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Failed to load group"
      :description="
        error.message || 'The group might not exist or you do not have permission to view it.'
      "
      class="mb-6"
    />

    <template v-else-if="pending && !data">
      <div class="flex items-center justify-center p-12">
        <UIcon name="i-lucide-loader-circle" class="text-muted h-8 w-8 animate-spin" />
      </div>
    </template>

    <template v-else-if="data?.group">
      <div class="napkinbets-hero">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <p class="napkinbets-kicker">Group</p>
            <UBadge color="neutral" variant="subtle">{{ data.group.visibility }}</UBadge>
            <UBadge v-if="data.group.userRole" color="success" variant="soft">{{
              data.group.userRole
            }}</UBadge>
          </div>
          <h1 class="napkinbets-section-title font-sans">{{ data.group.name }}</h1>
          <p v-if="data.group.description" class="napkinbets-hero-lede">
            {{ data.group.description }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1fr_0.4fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <p class="napkinbets-kicker">Members</p>
                <h2 class="napkinbets-subsection-title">People in this group</h2>
              </div>
              <UBadge color="neutral" variant="subtle">{{ data.group.memberCount }}</UBadge>
            </div>

            <div v-if="data.members.length" class="space-y-3">
              <div
                v-for="member in data.members"
                :key="member.id"
                class="napkinbets-surface flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-3">
                  <UAvatar
                    :src="member.avatarUrl || undefined"
                    :alt="member.displayName"
                    size="sm"
                  />
                  <p class="text-default font-semibold">{{ member.displayName }}</p>
                </div>
                <UBadge color="neutral" variant="subtle">{{ member.role }}</UBadge>
              </div>
            </div>
            <UAlert
              v-else
              color="info"
              variant="soft"
              icon="i-lucide-users"
              title="No members yet"
              description="This group has no members listed yet."
            />
          </div>
        </UCard>

        <UCard class="napkinbets-panel self-start">
          <div class="space-y-4">
            <h3 class="text-default font-semibold">Details</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Owner</span>
                <span class="text-default">{{ data.group.ownerName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Join Policy</span>
                <span class="text-default capitalize">{{
                  data.group.joinPolicy.replace('-', ' ')
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Visibility</span>
                <span class="text-default capitalize">{{ data.group.visibility }}</span>
              </div>
            </div>

            <div class="mt-6 space-y-2">
              <UButton
                v-if="canJoin"
                color="primary"
                block
                :loading="joinLeavePending"
                icon="i-lucide-user-plus"
                @click="handleJoin"
              >
                Join group
              </UButton>
              <UButton
                v-if="canLeave"
                color="neutral"
                variant="soft"
                block
                :loading="joinLeavePending"
                icon="i-lucide-user-minus"
                @click="handleLeave"
              >
                Leave group
              </UButton>
              <UButton
                v-if="data.group.userRole"
                :to="`/napkins/create?groupId=${data.group.id}`"
                color="primary"
                block
                icon="i-lucide-ticket-plus"
              >
                Start Group Bet
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <div class="mt-8 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="napkinbets-subsection-title">Group Bets</h2>
          <UBadge v-if="wagers.length" color="neutral" variant="subtle">
            {{ wagers.length }}
          </UBadge>
        </div>

        <template v-if="wagersStatus === 'pending' && !wagersData">
          <div class="flex items-center justify-center p-8">
            <UIcon name="i-lucide-loader-circle" class="text-muted h-6 w-6 animate-spin" />
          </div>
        </template>

        <UAlert
          v-else-if="wagersError"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Failed to load wagers"
          :description="wagersError.message || 'There was an error loading the wagers.'"
        />

        <template v-else-if="wagers.length">
          <NapkinbetsWagerListFilters
            :chips="filterChips"
            :model-value="activeFilter"
            @update:model-value="setWagerFilter"
          />

          <template v-if="showGrouped">
            <section v-if="wagersByStage.upcoming.length" class="space-y-3">
              <h3 class="text-sm font-semibold tracking-wide text-muted uppercase">Upcoming</h3>
              <div class="space-y-2">
                <NapkinbetsNapkinSummaryCard
                  v-for="wager in wagersByStage.upcoming"
                  :key="wager.id"
                  :wager="wager"
                />
              </div>
            </section>
            <section v-if="wagersByStage.live.length" class="space-y-3">
              <h3 class="text-sm font-semibold tracking-wide text-muted uppercase">In progress</h3>
              <div class="space-y-2">
                <NapkinbetsNapkinSummaryCard
                  v-for="wager in wagersByStage.live"
                  :key="wager.id"
                  :wager="wager"
                />
              </div>
            </section>
            <section v-if="wagersByStage.finished.length" class="space-y-3">
              <h3 class="text-sm font-semibold tracking-wide text-muted uppercase">Finished</h3>
              <div class="space-y-2">
                <NapkinbetsNapkinSummaryCard
                  v-for="wager in wagersByStage.finished"
                  :key="wager.id"
                  :wager="wager"
                />
              </div>
            </section>
          </template>

          <template v-else>
            <div class="space-y-2">
              <NapkinbetsNapkinSummaryCard
                v-for="wager in filteredWagers"
                :key="wager.id"
                :wager="wager"
              />
            </div>
            <UAlert
              v-if="filteredWagers.length === 0"
              color="neutral"
              variant="soft"
              icon="i-lucide-filter-x"
              title="No bets match this filter"
              description="Try a different filter or start a new group bet."
            />
          </template>
        </template>

        <div v-else class="space-y-3">
          <UAlert
            color="info"
            variant="soft"
            icon="i-lucide-ticket"
            title="No bets yet"
            description="Start the first bet for this group to get things rolling."
          />
          <UButton
            v-if="data?.group?.userRole"
            :to="`/napkins/create?groupId=${data.group.id}`"
            color="primary"
            variant="soft"
            icon="i-lucide-ticket-plus"
          >
            Start group bet
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>

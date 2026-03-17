<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const toast = useToast()
const groupsStore = useNapkinbetsGroupsStore()
const createState = reactive({
  name: '',
  description: '',
  visibility: 'private' as 'public' | 'private',
  joinPolicy: 'invite-only' as 'open' | 'invite-only' | 'closed',
})

await callOnce(
  'napkinbets-groups-page',
  async () => {
    await groupsStore.fetchBundle()
  },
  { mode: 'navigation' },
)

async function handleCreate() {
  try {
    const result = await groupsStore.createGroup(createState)
    Object.assign(createState, {
      name: '',
      description: '',
      visibility: 'private',
      joinPolicy: 'invite-only',
    })
    toast.add({
      title: `${result.group.name} created`,
      color: 'success',
    })
  } catch {
    toast.add({ title: 'Group creation failed', color: 'error' })
  }
}

async function handleJoin(groupId: string) {
  try {
    await groupsStore.joinGroup(groupId)
    toast.add({ title: 'Group joined', color: 'success' })
  } catch {
    toast.add({ title: 'Could not join group', color: 'error' })
  }
}

useSeo({
  title: 'Groups',
  description: 'Keep recurring rooms together so napkins start with the right crowd and context.',
  image: '/brand/og/dashboard.webp',
})

useWebPageSchema({
  name: 'Napkinbets Groups',
  description: 'Create or join groups for recurring rooms, watch parties, and tournament threads.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Groups</p>
        <h1 class="napkinbets-section-title">Put the recurring room in one place.</h1>
        <p class="napkinbets-hero-lede">
          Use a group when the same people bet together often, whether it is a watch party, text
          chain, office room, or majors thread.
        </p>
      </div>
    </div>

    <UAlert
      v-if="groupsStore.error.value"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Groups failed to load"
      :description="groupsStore.error.value"
    />

    <div class="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Start a room</p>
            <h2 class="napkinbets-subsection-title">Create a group once</h2>
            <p class="napkinbets-support-copy">
              Use public for open watch groups, or private when it should stay invite-only.
            </p>
          </div>

          <UForm :state="createState" class="space-y-4" @submit.prevent="handleCreate">
            <UFormField name="name" label="Group name">
              <UInput v-model="createState.name" class="w-full" placeholder="Friday Night Watch" />
            </UFormField>

            <UFormField name="description" label="What is this room for?">
              <UInput
                v-model="createState.description"
                class="w-full"
                placeholder="Quick one-on-ones, weekend games, and a light room when everyone shows."
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField name="visibility" label="Visibility">
                <USelect
                  v-model="createState.visibility"
                  class="w-full"
                  :items="[
                    { label: 'Private', value: 'private' },
                    { label: 'Public', value: 'public' },
                  ]"
                />
              </UFormField>

              <UFormField name="joinPolicy" label="Join policy">
                <USelect
                  v-model="createState.joinPolicy"
                  class="w-full"
                  :items="[
                    { label: 'Invite only', value: 'invite-only' },
                    { label: 'Open', value: 'open' },
                    { label: 'Closed', value: 'closed' },
                  ]"
                />
              </UFormField>
            </div>

            <UButton
              type="submit"
              color="primary"
              :loading="groupsStore.loading.value.mutate"
              block
            >
              Create group
            </UButton>
          </UForm>
        </div>
      </UCard>

      <div class="space-y-4">
        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <p class="napkinbets-kicker">My groups</p>
                <h2 class="napkinbets-subsection-title">Rooms you already belong to</h2>
              </div>
              <UBadge color="neutral" variant="subtle">{{
                groupsStore.myGroups.value.length
              }}</UBadge>
            </div>

            <div v-if="groupsStore.myGroups.value.length" class="space-y-3">
              <div
                v-for="group in groupsStore.myGroups.value"
                :key="group.id"
                class="napkinbets-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-default">{{ group.name }}</p>
                    <UBadge color="neutral" variant="subtle">{{
                      group.userRole || 'member'
                    }}</UBadge>
                  </div>
                  <p class="text-sm text-muted">{{ group.description || 'No group note yet.' }}</p>
                </div>

                <UButton
                  :to="`/napkins/create?groupId=${group.id}`"
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-ticket-plus"
                >
                  Start a napkin
                </UButton>
              </div>
            </div>

            <UAlert
              v-else
              color="info"
              variant="soft"
              icon="i-lucide-users"
              title="No groups yet"
              description="Start with one room for the people you bet with most often."
            />
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-1">
              <p class="napkinbets-kicker">Discover public groups</p>
              <h2 class="napkinbets-subsection-title">Open rooms you can join now</h2>
            </div>

            <div v-if="groupsStore.groups.value.length" class="space-y-3">
              <div
                v-for="group in groupsStore.groups.value"
                :key="group.id"
                class="napkinbets-surface flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-default">{{ group.name }}</p>
                    <UBadge color="neutral" variant="subtle"
                      >{{ group.memberCount }} members</UBadge
                    >
                  </div>
                  <p class="text-sm text-muted">{{ group.description || 'Public room' }}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UBadge color="info" variant="soft">{{ group.joinPolicy }}</UBadge>
                  <UButton
                    v-if="!group.userRole && group.joinPolicy === 'open'"
                    color="primary"
                    variant="soft"
                    size="sm"
                    :loading="groupsStore.loading.value.mutate"
                    @click="handleJoin(group.id)"
                  >
                    Join
                  </UButton>
                  <UBadge v-else-if="group.userRole" color="success" variant="soft">Joined</UBadge>
                </div>
              </div>
            </div>

            <p v-else class="text-sm text-muted">There are no public groups yet.</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

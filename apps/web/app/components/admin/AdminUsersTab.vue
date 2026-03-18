<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'

const api = useNapkinbetsApi()
const { refresh: refreshAdmin } = useNapkinbetsAdmin()
const actions = useNapkinbetsActions(refreshAdmin)

const perPage = 20
const page = ref(1)

const { data: usersData, refresh: refreshUsers } = useAsyncData(
  'napkinbets-admin-users',
  () => api.getAdminUsers({ page: page.value, limit: perPage }),
  {
    watch: [page],
    default: () => ({ users: [], total: 0 }),
  },
)

const total = computed(() => usersData.value.total)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage)))
const paginatedUsers = computed(() => usersData.value.users)

function prevPage() {
  if (page.value > 1) page.value -= 1
}
function nextPage() {
  if (page.value < totalPages.value) page.value += 1
}

async function toggleAdmin(userId: string, isAdmin: boolean) {
  await actions.setAdminStatus(userId, !isAdmin)
  await refreshUsers()
}
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel">
      <div class="flex flex-col">
        <div
          class="sticky top-0 z-10 flex flex-col gap-3 border-b border-default bg-default/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-default/80"
        >
          <div class="space-y-2">
            <p class="napkinbets-kicker">Users</p>
            <h2 class="napkinbets-subsection-title">Registration and admin roles</h2>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm text-muted">
              Showing {{ (page - 1) * perPage + 1 }}-{{ Math.min(page * perPage, total) }} of
              {{ total }}
            </p>
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-chevron-left"
                :disabled="page <= 1"
                aria-label="Previous page"
                @click="prevPage"
              />
              <span class="min-w-[6ch] text-center text-sm text-muted">
                {{ page }} / {{ totalPages }}
              </span>
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-chevron-right"
                :disabled="page >= totalPages"
                aria-label="Next page"
                @click="nextPage"
              />
            </div>
          </div>
        </div>

        <div class="max-h-[60vh] overflow-y-auto">
          <div class="space-y-3 p-4">
            <div
              v-for="adminUser in paginatedUsers"
              :key="adminUser.id"
              class="napkinbets-note-row"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="adminUser.avatarUrl || undefined"
                  :alt="adminUser.name || adminUser.email"
                  size="sm"
                />
                <div>
                  <p class="font-semibold text-default">{{ adminUser.name || adminUser.email }}</p>
                  <p class="text-sm text-muted">
                    {{ adminUser.email }} • {{ adminUser.ownedWagerCount }} owned •
                    {{ adminUser.joinedWagerCount }} joined
                  </p>
                </div>
              </div>

              <UButton
                color="neutral"
                variant="soft"
                :icon="adminUser.isAdmin ? 'i-lucide-shield-off' : 'i-lucide-shield-check'"
                :loading="actions.activeAction.value === `admin-role:${adminUser.id}`"
                @click="toggleAdmin(adminUser.id, adminUser.isAdmin)"
              >
                {{ adminUser.isAdmin ? 'Remove admin' : 'Make admin' }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

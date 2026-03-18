<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type {
  NapkinbetsAdminWager,
  NapkinbetsAdminWagerCreateInput,
  NapkinbetsAdminWagerUpdateInput,
  NapkinbetsWagerStatus,
} from '../../../types/napkinbets'

const api = useNapkinbetsApi()
const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)

// Pagination & Search State
const page = ref(1)
const limit = ref(20)
const search = ref('')
const searchInput = ref('') // temporary state for the input before hitting Enter
const total = ref(0)
const wagers = ref<NapkinbetsAdminWager[]>([])
const isLoading = ref(false)

async function loadWagers() {
  isLoading.value = true
  try {
    const response = await api.getAdminWagers({
      page: page.value,
      limit: limit.value,
      search: search.value,
    })
    wagers.value = response.wagers
    total.value = response.total
  } catch (err) {
    console.error('Failed to load wagers', err)
    wagers.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// Watchers for pagination and search
watch(
  [page, limit, search],
  () => {
    loadWagers()
  },
  { immediate: true },
)

function handleSearch() {
  page.value = 1
  search.value = searchInput.value
}

// Table Config
const columns = [
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'league', header: 'League' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'ownerEmail', header: 'Owner' },
  { accessorKey: 'participantCount', header: 'Participants' },
  { accessorKey: 'createdAt', header: 'Created' },
  { accessorKey: 'actions', header: '' },
]

function timeAgo(value: string | null) {
  if (!value) return 'never'
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const tableData = computed(() => {
  return wagers.value.map((w) => ({
    ...w,
    leagueDisplay: w.league.toUpperCase() || '—',
    ownerDisplay: w.ownerEmail || w.creatorName || 'System',
    createdDisplay: timeAgo(w.createdAt),
    participantDisplay: `${w.participantCount} (${w.openSettlementCount} open)`,
  }))
})

// Modals State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedWager = ref<NapkinbetsAdminWager | null>(null)

// Forms State
const createForm = ref<NapkinbetsAdminWagerCreateInput>({
  title: '',
  description: '',
  status: 'open',
  league: '',
  eventTitle: '',
  slug: '',
})

const editForm = ref<NapkinbetsAdminWagerUpdateInput>({})

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Locked', value: 'locked' },
  { label: 'Live', value: 'live' },
  { label: 'Settling', value: 'settling' },
  { label: 'Settled', value: 'settled' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' },
]

// Actions
function openCreateModal() {
  createForm.value = {
    title: '',
    description: '',
    status: 'open',
    league: '',
    eventTitle: '',
    slug: '',
  }
  showCreateModal.value = true
}

async function submitCreate() {
  await actions.createAdminWager(createForm.value)
  showCreateModal.value = false
  await loadWagers()
}

function openEditModal(wager: NapkinbetsAdminWager) {
  selectedWager.value = wager
  editForm.value = {
    title: wager.title,
    description: '', // Not fetching full description in list, ideally fetched, but leaving blank to not update
    status: wager.status as NapkinbetsWagerStatus,
    league: wager.league,
    eventTitle: wager.eventTitle,
    slug: wager.slug,
  }
  showEditModal.value = true
}

async function submitEdit() {
  if (!selectedWager.value) return
  const payload = { ...editForm.value }
  // Only send description if it was explicitly filled out
  if (!payload.description) {
    delete payload.description
  }
  await actions.updateAdminWager(selectedWager.value.id, payload)
  showEditModal.value = false
  await loadWagers()
}

function openDeleteModal(wager: NapkinbetsAdminWager) {
  selectedWager.value = wager
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!selectedWager.value) return
  await actions.deleteAdminWager(selectedWager.value.id)
  showDeleteModal.value = false
  await loadWagers()
}
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Bets</p>
            <h2 class="napkinbets-subsection-title">Manage all system wagers</h2>
          </div>

          <div class="flex items-center gap-2">
            <UInput
              v-model="searchInput"
              icon="i-lucide-search"
              placeholder="Search by title or slug..."
              class="w-full"
              @keyup.enter="handleSearch"
            />
            <UButton color="primary" variant="soft" icon="i-lucide-plus" @click="openCreateModal">
              Create bet
            </UButton>
          </div>
        </div>

        <div class="overflow-x-auto">
          <UTable :data="tableData" :columns="columns" :loading="isLoading">
            <template #status-cell="{ row }">
              <UBadge color="neutral" variant="subtle">{{ row.original.status }}</UBadge>
            </template>
            <template #league-cell="{ row }">
              <UBadge v-if="row.original.league" color="warning" variant="soft">
                {{ row.original.leagueDisplay }}
              </UBadge>
              <span v-else class="text-muted">—</span>
            </template>
            <template #ownerEmail-cell="{ row }">
              <span class="text-sm text-default">{{ row.original.ownerDisplay }}</span>
            </template>
            <template #participantCount-cell="{ row }">
              <span class="text-sm text-default">{{ row.original.participantDisplay }}</span>
            </template>
            <template #createdAt-cell="{ row }">
              <span class="text-sm text-muted">{{ row.original.createdDisplay }}</span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-2">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-pencil"
                  @click="openEditModal(row.original)"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-trash-2"
                  @click="openDeleteModal(row.original)"
                />
                <UButton
                  :to="`/napkins/${row.original.slug}`"
                  target="_blank"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-external-link"
                />
              </div>
            </template>
          </UTable>
        </div>

        <div class="flex justify-end p-2 border-t border-default">
          <UPagination v-model:page="page" :total="total" :items-per-page="limit" />
        </div>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="showCreateModal" title="Create new bet">
      <template #body>
        <UForm :state="createForm" class="space-y-4" @submit="submitCreate">
          <UFormField label="Title" required>
            <UInput v-model="createForm.title" placeholder="Super Bowl LVIII" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="createForm.description"
              placeholder="Description of the bet"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="League">
              <UInput v-model="createForm.league" placeholder="nfl" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="createForm.status" :items="statusOptions" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Event Title">
            <UInput v-model="createForm.eventTitle" placeholder="Chiefs vs 49ers" class="w-full" />
          </UFormField>

          <UFormField label="Custom Slug (optional)">
            <UInput
              v-model="createForm.slug"
              placeholder="super-bowl-lviii-custom"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="showCreateModal = false"
              >Cancel</UButton
            >
            <UButton
              type="submit"
              color="primary"
              :loading="actions.activeAction.value === 'admin-wager-create'"
            >
              Create
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="showEditModal" title="Edit bet">
      <template #body>
        <UForm :state="editForm" class="space-y-4" @submit="submitEdit">
          <UFormField label="Title">
            <UInput v-model="editForm.title" class="w-full" />
          </UFormField>

          <UFormField label="Description (Leave blank to keep existing)">
            <UTextarea
              v-model="editForm.description"
              placeholder="New description..."
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="League">
              <UInput v-model="editForm.league" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="editForm.status" :items="statusOptions" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Event Title">
            <UInput v-model="editForm.eventTitle" class="w-full" />
          </UFormField>

          <UFormField label="Slug">
            <UInput v-model="editForm.slug" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="showEditModal = false">Cancel</UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="actions.activeAction.value === `admin-wager-update:${selectedWager?.id}`"
            >
              Save changes
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #body>
        <div class="space-y-4 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <UIcon name="i-lucide-alert-triangle" class="h-6 w-6 text-error" />
          </div>
          <div>
            <h3 class="font-semibold text-default">Delete bet?</h3>
            <p class="text-sm text-muted mt-2">
              Are you sure you want to delete
              <span class="font-medium text-default">{{ selectedWager?.title }}</span
              >? This action cannot be undone and will remove all associated picks, pots, and
              participants.
            </p>
          </div>
          <div class="flex justify-center gap-3 pt-2">
            <UButton color="neutral" variant="soft" @click="showDeleteModal = false"
              >Cancel</UButton
            >
            <UButton
              color="error"
              :loading="actions.activeAction.value === `admin-wager-delete:${selectedWager?.id}`"
              @click="confirmDelete"
            >
              Delete bet
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'
import type { NapkinbetsAdminFeaturedBet, SaveFeaturedBetInput } from '../../../types/napkinbets'

const api = useNapkinbetsApi()
const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)

const featuredBets = ref<NapkinbetsAdminFeaturedBet[]>([])
const showFeaturedForm = ref(false)
const editingFeaturedBet = ref<NapkinbetsAdminFeaturedBet | null>(null)
const featuredForm = ref<SaveFeaturedBetInput>({
  label: '',
  title: '',
  subtitle: '',
  summary: '',
  windowLabel: '',
  venueLabel: '',
  accent: 'tour',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
  prefillJson: '{}',
})

async function loadFeaturedBets() {
  try {
    const response = await api.getAdminFeaturedBets()
    featuredBets.value = response.featuredBets
  } catch {
    featuredBets.value = []
  }
}

await loadFeaturedBets()

function resetFeaturedForm() {
  editingFeaturedBet.value = null
  featuredForm.value = {
    label: '',
    title: '',
    subtitle: '',
    summary: '',
    windowLabel: '',
    venueLabel: '',
    accent: 'tour',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
    prefillJson: '{}',
  }
  showFeaturedForm.value = false
}

function editFeaturedBet(bet: NapkinbetsAdminFeaturedBet) {
  editingFeaturedBet.value = bet
  featuredForm.value = {
    id: bet.id,
    label: bet.label,
    title: bet.title,
    subtitle: bet.subtitle,
    summary: bet.summary,
    windowLabel: bet.windowLabel,
    venueLabel: bet.venueLabel,
    accent: bet.accent as 'major' | 'tour' | 'watch',
    imageUrl: bet.imageUrl,
    sortOrder: bet.sortOrder,
    isActive: bet.isActive,
    prefillJson: bet.prefillJson,
  }
  showFeaturedForm.value = true
}

async function saveFeaturedBet() {
  await actions.saveFeaturedBet(featuredForm.value)
  resetFeaturedForm()
  await loadFeaturedBets()
}

async function toggleFeaturedActive(bet: NapkinbetsAdminFeaturedBet) {
  await actions.saveFeaturedBet({
    id: bet.id,
    label: bet.label,
    title: bet.title,
    isActive: !bet.isActive,
  })
  await loadFeaturedBets()
}

async function removeFeaturedBet(id: string) {
  await actions.deleteFeaturedBet(id)
  await loadFeaturedBets()
}

function openFeaturedForm() {
  resetFeaturedForm()
  showFeaturedForm.value = true
}
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="flex items-end justify-between gap-3">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Featured bets</p>
            <h2 class="napkinbets-subsection-title">Manage events page featured cards</h2>
          </div>

          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-plus"
            @click="openFeaturedForm"
          >
            Add
          </UButton>
        </div>

        <div v-if="showFeaturedForm" class="space-y-3 rounded-lg bg-elevated p-4">
          <p class="font-semibold text-default">
            {{ editingFeaturedBet ? 'Edit featured bet' : 'New featured bet' }}
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <UInput
              v-model="featuredForm.label"
              placeholder="Label (e.g. Major watch)"
              class="w-full"
            />
            <UInput v-model="featuredForm.title" placeholder="Title" class="w-full" />
            <UInput v-model="featuredForm.subtitle" placeholder="Subtitle" class="w-full" />
            <UInput
              v-model="featuredForm.windowLabel"
              placeholder="Window label (e.g. Apr 6-12)"
              class="w-full"
            />
            <UInput
              v-model="featuredForm.venueLabel"
              placeholder="Venue label"
              class="w-full"
            />
            <UInput v-model="featuredForm.imageUrl" placeholder="Image URL" class="w-full" />
            <USelect
              v-model="featuredForm.accent"
              :items="[
                { label: 'Major', value: 'major' },
                { label: 'Tour', value: 'tour' },
                { label: 'Watch', value: 'watch' },
              ]"
              class="w-full"
            />
            <UInput
              v-model.number="featuredForm.sortOrder"
              type="number"
              placeholder="Sort order"
              class="w-full"
            />
          </div>

          <UTextarea
            v-model="featuredForm.summary"
            placeholder="Summary"
            class="w-full"
            :rows="2"
          />
          <UTextarea
            v-model="featuredForm.prefillJson"
            placeholder="Prefill JSON"
            class="w-full"
            :rows="3"
          />

          <div class="flex gap-2">
            <UButton
              color="primary"
              size="sm"
              :loading="actions.activeAction.value === 'featured-bet:save'"
              @click="saveFeaturedBet"
            >
              {{ editingFeaturedBet ? 'Update' : 'Create' }}
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" @click="resetFeaturedForm">
              Cancel
            </UButton>
          </div>
        </div>

        <div v-if="featuredBets.length === 0 && !showFeaturedForm" class="text-sm text-muted">
          No featured bets configured. Auto-generated spotlights will be used.
        </div>

        <div class="space-y-3">
          <div v-for="bet in featuredBets" :key="bet.id" class="napkinbets-note-row">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge :color="bet.isActive ? 'success' : 'neutral'" variant="soft" size="sm">
                  {{ bet.isActive ? 'Active' : 'Inactive' }}
                </UBadge>
                <UBadge color="warning" variant="soft" size="sm">
                  {{ bet.accent }}
                </UBadge>
                <span v-if="bet.windowLabel" class="text-xs text-muted">{{
                  bet.windowLabel
                }}</span>
              </div>
              <p class="font-semibold text-default">{{ bet.title }}</p>
              <p class="text-sm text-muted">
                {{ bet.subtitle || bet.summary || 'No description' }}
              </p>
            </div>

            <div class="flex gap-2 shrink-0">
              <UButton
                :color="bet.isActive ? 'neutral' : 'success'"
                variant="soft"
                size="sm"
                :icon="bet.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                @click="toggleFeaturedActive(bet)"
              >
                {{ bet.isActive ? 'Deactivate' : 'Activate' }}
              </UButton>
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                icon="i-lucide-pencil"
                @click="editFeaturedBet(bet)"
              >
                Edit
              </UButton>
              <UButton
                color="error"
                variant="soft"
                size="sm"
                icon="i-lucide-trash-2"
                @click="removeFeaturedBet(bet.id)"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

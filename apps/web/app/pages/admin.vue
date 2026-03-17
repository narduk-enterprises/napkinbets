<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const admin = computed(() => adminState.data.value)

async function toggleAdmin(userId: string, isAdmin: boolean) {
  await actions.setAdminStatus(userId, !isAdmin)
}

async function setStatus(wagerId: string, status: string) {
  await actions.setWagerStatus(wagerId, status)
}

useSeo({
  title: 'Admin board controls',
  description:
    'Manage registered users, promote admins, and update wager status across the Napkinbets prototype.',
  ogImage: {
    title: 'Napkinbets Admin',
    description: 'User and wager management for the prototype.',
    icon: '🛡️',
  },
})

useWebPageSchema({
  name: 'Napkinbets Admin',
  description:
    'Administrative overview for users and wager boards in the Napkinbets prototype.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Admin</p>
        <h1 class="napkinbets-section-title">Manage the prototype’s users and wager states.</h1>
        <p class="napkinbets-hero-lede">
          This route exists so the product has a real operational back office for user roles and board status changes.
        </p>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="actions.feedback.value.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-alert'"
      :title="actions.feedback.value.type === 'success' ? 'Admin update applied' : 'Admin action failed'"
      :description="actions.feedback.value.text"
    />

    <div class="napkinbets-metric-grid">
      <NapkinbetsMetricCard
        v-for="metric in admin.metrics"
        :key="metric.label"
        :metric="metric"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Users</p>
            <h2 class="napkinbets-subsection-title">Registration and admin roles</h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="adminUser in admin.users"
              :key="adminUser.id"
              class="napkinbets-note-row"
            >
              <div>
                <p class="font-semibold text-default">{{ adminUser.name || adminUser.email }}</p>
                <p class="text-sm text-muted">
                  {{ adminUser.email }} • {{ adminUser.ownedWagerCount }} owned • {{ adminUser.joinedWagerCount }} joined
                </p>
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
      </UCard>

      <UCard class="napkinbets-panel">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Boards</p>
            <h2 class="napkinbets-subsection-title">Status management</h2>
          </div>

          <div class="space-y-4">
            <div
              v-for="wager in admin.wagers"
              :key="wager.id"
              class="napkinbets-admin-board"
            >
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge color="neutral" variant="subtle">{{ wager.status }}</UBadge>
                  <UBadge v-if="wager.league" color="warning" variant="soft">{{ wager.league.toUpperCase() }}</UBadge>
                </div>
                <p class="font-semibold text-default">{{ wager.title }}</p>
                <p class="text-sm text-muted">
                  {{ wager.ownerEmail || wager.creatorName }} • {{ wager.participantCount }} participants • {{ wager.openSettlementCount }} open settlements
                </p>
              </div>

              <div class="napkinbets-card-actions">
                <UButton
                  color="success"
                  variant="soft"
                  size="sm"
                  :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                  @click="setStatus(wager.id, 'live')"
                >
                  Set live
                </UButton>
                <UButton
                  color="warning"
                  variant="soft"
                  size="sm"
                  :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                  @click="setStatus(wager.id, 'settling')"
                >
                  Set settling
                </UButton>
                <UButton
                  color="neutral"
                  variant="soft"
                  size="sm"
                  :loading="actions.activeAction.value === `admin-status:${wager.id}`"
                  @click="setStatus(wager.id, 'archived')"
                >
                  Archive
                </UButton>
                <UButton
                  :to="`/wagers/${wager.slug}`"
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-arrow-right"
                >
                  Open board
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

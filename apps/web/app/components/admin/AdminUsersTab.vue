<script setup lang="ts">
const adminState = await useNapkinbetsAdmin()
const actions = useNapkinbetsActions(adminState.refresh)
const admin = computed(() => adminState.data.value)

async function toggleAdmin(userId: string, isAdmin: boolean) {
  await actions.setAdminStatus(userId, !isAdmin)
}
</script>

<template>
  <div class="space-y-4">
    <UCard class="napkinbets-panel">
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Users</p>
          <h2 class="napkinbets-subsection-title">Registration and admin roles</h2>
        </div>

        <div class="space-y-3">
          <div v-for="adminUser in admin.users" :key="adminUser.id" class="napkinbets-note-row">
            <div>
              <p class="font-semibold text-default">{{ adminUser.name || adminUser.email }}</p>
              <p class="text-sm text-muted">
                {{ adminUser.email }} • {{ adminUser.ownedWagerCount }} owned •
                {{ adminUser.joinedWagerCount }} joined
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
  </div>
</template>

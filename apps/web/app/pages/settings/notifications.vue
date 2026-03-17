<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'

definePageMeta({ middleware: ['auth'] })

const api = useNapkinbetsApi()

const settingsState = await useAsyncData(
  'napkinbets-settings-notifications',
  () => api.getNotificationSettings(),
  {
    server: false,
    lazy: true,
  },
)

const isSaving = ref(false)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const formState = reactive({
  notifyFriendRequests: true,
  notifyGroupInvites: true,
  notifyWagerUpdates: true,
})

watch(
  () => settingsState.data.value,
  (val) => {
    if (val) {
      formState.notifyFriendRequests = val.notifyFriendRequests
      formState.notifyGroupInvites = val.notifyGroupInvites
      formState.notifyWagerUpdates = val.notifyWagerUpdates
    }
  },
  { immediate: true },
)

async function handleSave() {
  isSaving.value = true
  feedback.value = null

  try {
    await api.updateNotificationSettings({
      notifyFriendRequests: formState.notifyFriendRequests,
      notifyGroupInvites: formState.notifyGroupInvites,
      notifyWagerUpdates: formState.notifyWagerUpdates,
    })
    feedback.value = { type: 'success', text: 'Notification settings saved.' }
  } catch (error) {
    feedback.value = {
      type: 'error',
      text: error instanceof Error ? error.message : 'Failed to save settings.',
    }
  } finally {
    isSaving.value = false
  }
}

useSeo({
  title: 'Notification Settings',
  description: 'Manage how and when you receive notifications on Napkinbets.',
  ogImage: {
    title: 'Notification Settings',
    description: 'Manage your alerts.',
    icon: '🔔',
  },
})

useWebPageSchema({
  name: 'Napkinbets Notification Settings',
  description: 'Manage your notification preferences.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="space-y-4 mb-8">
      <UButton to="/settings" variant="ghost" color="neutral" icon="i-lucide-arrow-left" class="-ml-2">
        Back to Settings
      </UButton>
      <div>
        <p class="napkinbets-kicker">Preferences</p>
        <h1 class="napkinbets-section-title">Notification Settings</h1>
        <p class="napkinbets-hero-lede">
          Choose which alerts you care about. We try to keep noise to a minimum.
        </p>
      </div>
    </div>

    <UAlert
      v-if="feedback"
      :color="feedback.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="feedback.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-alert'"
      :title="feedback.type === 'success' ? 'Saved' : 'Error'"
      :description="feedback.text"
      class="mb-6"
    />

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your preferences.</p>
        </div>
      </template>

      <div class="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-6">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Social</p>
              <h2 class="napkinbets-subsection-title">Friend & Group Invites</h2>
            </div>
            
            <UFormField
              name="notifyFriendRequests"
              label="Friend Requests"
              description="Get notified when someone sends you a friend request or accepts yours."
            >
              <USwitch v-model="formState.notifyFriendRequests" />
            </UFormField>

            <USeparator />

            <UFormField
              name="notifyGroupInvites"
              label="Group Invites"
              description="Get notified when you are invited to join a group."
            >
              <USwitch v-model="formState.notifyGroupInvites" />
            </UFormField>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-6">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Wagers</p>
              <h2 class="napkinbets-subsection-title">Updates & Settlements</h2>
            </div>
            
            <UFormField
              name="notifyWagerUpdates"
              label="Wager Activity"
              description="Get notified about new picks, reminders, and settlement status updates on your bets."
            >
              <USwitch v-model="formState.notifyWagerUpdates" />
            </UFormField>
            
            <div class="pt-6">
              <UButton color="primary" icon="i-lucide-save" :loading="isSaving" @click="handleSave" class="w-full justify-center">
                Save Preferences
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </ClientOnly>
  </div>
</template>

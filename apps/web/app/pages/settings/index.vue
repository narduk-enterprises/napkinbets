<script setup lang="ts">
import { useNapkinbetsApi } from '../../services/napkinbets-api'

definePageMeta({ middleware: ['auth'] })

const api = useNapkinbetsApi()
const { fetchUser } = useAuth()

const profileState = await useAsyncData('napkinbets-settings-profile', () => api.getProfile(), {
  server: false,
  lazy: true,
})

const profile = computed(() => profileState.data.value)
const isSaving = ref(false)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const formName = ref('')
const previewAvatarUrl = ref('')

watch(
  profile,
  (val) => {
    if (val) {
      formName.value = val.name
      previewAvatarUrl.value = val.avatarUrl
    }
  },
  { immediate: true },
)

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    feedback.value = { type: 'error', text: 'Please select an image file.' }
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    feedback.value = { type: 'error', text: 'Image must be under 2MB.' }
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 128
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Crop to square center
      const srcSize = Math.min(img.width, img.height)
      const srcX = (img.width - srcSize) / 2
      const srcY = (img.height - srcSize) / 2
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size)

      previewAvatarUrl.value = canvas.toDataURL('image/webp', 0.8)
      feedback.value = null
    }
    img.src = reader.result as string
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  previewAvatarUrl.value = ''
}

async function handleSave() {
  isSaving.value = true
  feedback.value = null

  try {
    await api.updateProfile({
      name: formName.value.trim(),
      avatarUrl: previewAvatarUrl.value,
    })
    await Promise.all([profileState.refresh(), fetchUser()])
    feedback.value = { type: 'success', text: 'Profile updated.' }
  } catch (error) {
    feedback.value = {
      type: 'error',
      text: error instanceof Error ? error.message : 'Failed to save.',
    }
  } finally {
    isSaving.value = false
  }
}

const initials = computed(() => {
  const name = formName.value || profile.value?.email || ''
  if (!name) return '?'
  const parts = name.split(/[\s@]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

useSeo({
  title: 'Profile settings',
  description: 'Update your name, avatar, and account preferences.',
  ogImage: {
    title: 'Napkinbets Profile',
    description: 'Manage your Napkinbets identity.',
    icon: '⚙️',
  },
})

useWebPageSchema({
  name: 'Napkinbets Profile Settings',
  description: 'Profile and account preferences for Napkinbets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero napkinbets-hero-compact">
      <div class="space-y-3">
        <p class="napkinbets-kicker">Settings</p>
        <h1 class="napkinbets-section-title">Your account and preferences.</h1>
        <p class="napkinbets-hero-lede">
          Update your profile details. Changes show up across all your bets and shared views.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton to="/settings/payments" color="neutral" variant="soft" icon="i-lucide-wallet-cards">
            Payment profiles
          </UButton>
          <UButton to="/notifications" color="neutral" variant="soft" icon="i-lucide-bell">
            Notifications
          </UButton>
        </div>
      </div>
    </div>

    <UAlert
      v-if="feedback"
      :color="feedback.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="feedback.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-alert'"
      :title="feedback.type === 'success' ? 'Saved' : 'Error'"
      :description="feedback.text"
    />

    <ClientOnly>
      <template #fallback>
        <div class="napkinbets-aside-note">
          <p class="napkinbets-kicker">Loading</p>
          <p class="napkinbets-support-copy">Pulling your profile.</p>
        </div>
      </template>

      <div class="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <UCard class="napkinbets-panel">
          <div class="space-y-5">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Profile</p>
              <h2 class="napkinbets-subsection-title">Your identity</h2>
            </div>

            <div class="flex items-center gap-4">
              <div class="napkinbets-settings-avatar-wrapper">
                <span v-if="previewAvatarUrl" class="napkinbets-settings-avatar">
                  <img :src="previewAvatarUrl" alt="Avatar preview" class="napkinbets-user-avatar-img" />
                </span>
                <span v-else class="napkinbets-settings-avatar napkinbets-user-avatar-initials">
                  {{ initials }}
                </span>
              </div>

              <div class="space-y-2">
                <div class="flex flex-wrap gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-upload"
                    @click="($refs.fileInput as HTMLInputElement)?.click()"
                  >
                    Upload photo
                  </UButton>
                  <UButton
                    v-if="previewAvatarUrl"
                    color="error"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-trash-2"
                    @click="removeAvatar"
                  >
                    Remove
                  </UButton>
                </div>
                <p class="text-xs text-dimmed">Square images work best. Max 2 MB.</p>
                <!-- eslint-disable-next-line narduk/no-native-input -- hidden file picker; UInput does not support type="file" -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onFileSelect"
                />
              </div>
            </div>

            <UFormField name="name" label="Display name">
              <UInput v-model="formName" class="w-full" placeholder="Your name" />
            </UFormField>

            <UFormField name="email" label="Email">
              <UInput :model-value="profile?.email ?? ''" class="w-full" disabled />
            </UFormField>

            <UButton
              color="primary"
              icon="i-lucide-save"
              :loading="isSaving"
              @click="handleSave"
            >
              Save changes
            </UButton>
          </div>
        </UCard>

        <UCard class="napkinbets-panel">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="napkinbets-kicker">Quick links</p>
              <h2 class="napkinbets-subsection-title">Other settings</h2>
            </div>

            <div class="space-y-2">
              <UButton
                to="/settings/payments"
                color="neutral"
                variant="ghost"
                icon="i-lucide-wallet-cards"
                class="w-full justify-start"
              >
                Payment profiles
              </UButton>
              <UButton
                to="/friends"
                color="neutral"
                variant="ghost"
                icon="i-lucide-user-round-plus"
                class="w-full justify-start"
              >
                Friends
              </UButton>
              <UButton
                to="/groups"
                color="neutral"
                variant="ghost"
                icon="i-lucide-users-round"
                class="w-full justify-start"
              >
                Groups
              </UButton>
              <UButton
                to="/notifications"
                color="neutral"
                variant="ghost"
                icon="i-lucide-bell"
                class="w-full justify-start"
              >
                Notifications
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </ClientOnly>
  </div>
</template>

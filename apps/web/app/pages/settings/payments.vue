<script setup lang="ts">
import { reactive } from 'vue'
import type { CreatePaymentProfileInput } from '../../../types/napkinbets'

definePageMeta({ middleware: ['auth'] })

const paymentProfilesState = useNapkinbetsPaymentProfiles({
  server: false,
  lazy: true,
})
const actions = useNapkinbetsActions(paymentProfilesState.refresh)

const providerOptions = [
  { label: 'Venmo', value: 'Venmo' },
  { label: 'PayPal', value: 'PayPal' },
  { label: 'Cash App', value: 'Cash App' },
  { label: 'Zelle', value: 'Zelle' },
]

const formState = reactive<CreatePaymentProfileInput>({
  provider: 'Venmo',
  handle: '',
  displayLabel: '',
  isDefault: false,
  isPublicOnBoards: true,
})

async function handleSave() {
  await actions.savePaymentProfile(formState)

  formState.provider = 'Venmo'
  formState.handle = ''
  formState.displayLabel = ''
  formState.isDefault = false
  formState.isPublicOnBoards = true
}

async function handleRemove(profileId: string) {
  await actions.removePaymentProfile(profileId)
}

async function handleSetDefault(profileId: string) {
  await actions.setDefaultPaymentProfile(profileId)
}

async function handleVerify(profileId: string) {
  await actions.verifyPaymentProfile(profileId)
}

const verificationStatusMap: Record<string, { icon: string; color: 'success' | 'error' | 'neutral'; label: string }> = {
  verified: { icon: 'i-lucide-badge-check', color: 'success', label: 'Verified' },
  failed: { icon: 'i-lucide-badge-x', color: 'error', label: 'Not found' },
}
const defaultVerificationStatus = { icon: 'i-lucide-badge-help', color: 'neutral' as const, label: 'Unverified' }

function verificationInfo(status: string) {
  return verificationStatusMap[status] ?? defaultVerificationStatus
}

useSeo({
  title: 'Payment profiles',
  description:
    'Register your Venmo, PayPal, Cash App, or Zelle handles so Napkinbets can prefill bet collection and settle-up flows.',
  ogImage: {
    title: 'Napkinbets Payment Profiles',
    description: 'Manage the payment handles tied to your account.',
    icon: '💳',
  },
})

useWebPageSchema({
  name: 'Napkinbets Payment Profiles',
  description: 'An authenticated settings page for managing user payment profiles on Napkinbets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-hero">
      <div class="space-y-4">
        <p class="napkinbets-kicker">Payments</p>
        <h1 class="napkinbets-section-title">
          Saved handles for smoother bet collection and settle-up.
        </h1>
        <p class="napkinbets-hero-lede">
          Store non-sensitive payment identities only. Napkinbets uses them to prefill collection
          rails and link users out to the right provider. Venmo handles are automatically verified.
        </p>
      </div>
    </div>

    <UAlert
      v-if="actions.feedback.value"
      :color="actions.feedback.value.type === 'success' ? 'success' : 'error'"
      variant="soft"
      :icon="
        actions.feedback.value.type === 'success'
          ? 'i-lucide-check-circle-2'
          : 'i-lucide-circle-alert'
      "
      :title="
        actions.feedback.value.type === 'success'
          ? 'Payment settings updated'
          : 'Payment settings failed'
      "
      :description="actions.feedback.value.text"
    />

    <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:[&>*]:min-h-[18rem]">
      <UCard class="napkinbets-panel h-full">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Add profile</p>
            <h2 class="napkinbets-subsection-title">Register a handle</h2>
          </div>

          <UForm :state="formState" class="space-y-4" @submit.prevent="handleSave">
            <UFormField name="provider" label="Provider">
              <USelect v-model="formState.provider" :items="providerOptions" class="w-full" />
            </UFormField>

            <UFormField name="handle" label="Handle or account">
              <UInput
                v-model="formState.handle"
                class="w-full"
                placeholder="@yourname or paypal.me/yourname"
              />
            </UFormField>

            <UFormField name="displayLabel" label="Label">
              <UInput
                v-model="formState.displayLabel"
                class="w-full"
                placeholder="Personal Venmo"
              />
            </UFormField>

            <UAlert
              v-if="formState.provider === 'Venmo'"
              color="info"
              variant="soft"
              icon="i-lucide-shield-check"
              title="Auto-verified"
              description="Venmo handles are verified against public profiles when you save. Verified handles get a badge visible to other players."
            />

            <div class="space-y-3">
              <UCheckbox v-model="formState.isDefault" label="Use as default payment profile" />
              <UCheckbox
                v-model="formState.isPublicOnBoards"
                label="Show this handle on shared bet views"
              />
            </div>

            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-plus-circle"
              :loading="actions.activeAction.value === 'payment-profile:create'"
            >
              Save payment profile
            </UButton>
          </UForm>
        </div>
      </UCard>

      <UCard class="napkinbets-panel h-full">
        <div class="space-y-4">
          <div class="space-y-2">
            <p class="napkinbets-kicker">Registered profiles</p>
            <h2 class="napkinbets-subsection-title">Your available rails</h2>
          </div>

          <div v-if="paymentProfilesState.data.value.profiles.length" class="space-y-3">
            <div
              v-for="profile in paymentProfilesState.data.value.profiles"
              :key="profile.id"
              class="napkinbets-note-row"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-semibold text-default">
                    {{ profile.displayLabel || profile.provider }}
                  </p>
                  <UBadge v-if="profile.isDefault" color="success" variant="soft">Default</UBadge>
                  <UBadge v-if="profile.isPublicOnBoards" color="info" variant="soft"
                    >Public on bets</UBadge
                  >
                  <UBadge
                    v-if="profile.provider === 'Venmo'"
                    :color="verificationInfo(profile.handleVerificationStatus).color"
                    variant="soft"
                    :icon="verificationInfo(profile.handleVerificationStatus).icon"
                  >
                    {{ verificationInfo(profile.handleVerificationStatus).label }}
                  </UBadge>
                </div>
                <p class="text-sm text-muted">{{ profile.provider }} • {{ profile.handle }}</p>
                <p v-if="profile.handleVerifiedAt" class="text-xs text-dimmed">
                  Verified {{ new Date(profile.handleVerifiedAt).toLocaleDateString() }}
                </p>
              </div>

              <div class="napkinbets-card-actions shrink-0">
                <UButton
                  v-if="
                    profile.provider === 'Venmo' && profile.handleVerificationStatus !== 'verified'
                  "
                  color="info"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-shield-check"
                  :loading="actions.activeAction.value === `payment-profile:verify:${profile.id}`"
                  @click="handleVerify(profile.id)"
                >
                  Verify
                </UButton>
                <UButton
                  v-if="!profile.isDefault"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  :loading="actions.activeAction.value === `payment-profile:default:${profile.id}`"
                  @click="handleSetDefault(profile.id)"
                >
                  Make default
                </UButton>
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                  :loading="actions.activeAction.value === `payment-profile:remove:${profile.id}`"
                  @click="handleRemove(profile.id)"
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
            icon="i-lucide-wallet-cards"
            title="No payment profiles saved yet"
            description="Add at least one payment identity so bet creation and settle-up can prefill the right destination."
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

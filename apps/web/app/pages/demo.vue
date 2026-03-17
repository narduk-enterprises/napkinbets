<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: 'auth',
})

const demoAccess = useNapkinbetsDemoAccess()

onMounted(() => {
  void demoAccess.openDemo()
})

useSeo({
  title: 'Opening demo account',
  description: 'Signing into the Napkinbets demo account.',
  image: '/brand/og/auth.webp',
})

useWebPageSchema({
  name: 'Opening demo account',
  description: 'Signing into the Napkinbets demo account.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-auth-grid">
      <div class="napkinbets-auth-rail">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Demo account</p>
          <h1 class="napkinbets-hero-title napkinbets-auth-title">Opening the guided demo.</h1>
          <p class="napkinbets-hero-lede">
            We&apos;re signing you into the shared demo account so you can see real sample bets,
            players, and payment flows.
          </p>
        </div>
      </div>

      <div class="napkinbets-auth-card-shell">
        <UCard class="w-full max-w-sm">
          <div class="space-y-4">
            <UAlert
              v-if="demoAccess.error.value"
              color="error"
              variant="soft"
              icon="i-lucide-circle-alert"
              title="Demo login failed"
              :description="demoAccess.error.value"
            />

            <p v-else class="napkinbets-support-copy">
              Loading the demo account and sending you to My Bets.
            </p>

            <UButton
              color="primary"
              class="w-full"
              icon="i-lucide-zap"
              :loading="demoAccess.pending.value"
              @click="() => demoAccess.openDemo()"
            >
              Open demo account
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: 'auth',
})

const demoAccess = useNapkinbetsDemoAccess()

useSeo({
  title: 'Sign in to Napkinbets',
  description: 'Sign in to manage your bets, picks, and payment follow-up.',
  image: '/brand/og/auth.webp',
})

useWebPageSchema({
  name: 'Sign in to Napkinbets',
  description: 'Sign in to access your Napkinbets bets.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-auth-grid">
      <div class="napkinbets-auth-rail">
        <div class="space-y-4">
          <p class="napkinbets-kicker">Sign in</p>
          <h1 class="napkinbets-hero-title napkinbets-auth-title">Get back to your bets.</h1>
          <p class="napkinbets-hero-lede">
            Open the games, run your bets, and confirm payment proof without digging through
            messages.
          </p>
        </div>
      </div>

      <div class="napkinbets-auth-card-shell">
        <AuthLoginCard title="Sign in" subtitle="Access your bets and player controls.">
          <template #after-form>
            <div class="mt-4">
              <UButton
                color="primary"
                class="w-full"
                icon="i-lucide-zap"
                :loading="demoAccess.pending.value"
                @click="() => demoAccess.openDemo()"
              >
                See the demo account
              </UButton>
            </div>
          </template>
        </AuthLoginCard>
      </div>
    </div>
  </div>
</template>

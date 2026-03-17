<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
})

useSeo({
  title: 'Sign in to Napkinbets',
  description: 'Sign in to manage your friendly wager boards and payment reminders.',
  ogImage: {
    title: 'Sign in to Napkinbets',
    description: 'Access your wager workspace.',
    icon: '🔐',
  },
})

useWebPageSchema({
  name: 'Sign in to Napkinbets',
  description: 'Sign in to access your Napkinbets dashboard.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-auth-grid">
      <div class="napkinbets-auth-rail">
        <NapkinbetsLogo />

        <div class="space-y-4">
          <p class="napkinbets-kicker">Sign in</p>
          <h1 class="napkinbets-hero-title napkinbets-auth-title">Welcome back to the board.</h1>
          <p class="napkinbets-hero-lede">
            Use your account to manage owned wagers, join shared boards, and confirm settlement
            proof.
          </p>
        </div>
      </div>

      <div class="napkinbets-auth-card-shell">
        <NapkinbetsAuthStage
          eyebrow="Sign in"
          title="Account access"
          description="Access your dashboard and board controls."
        >
          <AuthLoginCard title="Sign in" subtitle="Access your dashboard and board controls">
            <template #logo>
              <NapkinbetsLogo />
            </template>
          </AuthLoginCard>
        </NapkinbetsAuthStage>
      </div>
    </div>
  </div>
</template>

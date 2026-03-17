<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: 'auth',
})

useSeo({
  title: 'Sign in to Napkinbets',
  description: 'Sign in to manage your friendly wager boards and payment reminders.',
  image: '/brand/og/auth.webp',
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
          <AuthLoginCard title="Sign in" subtitle="Access your dashboard and board controls" />
        </NapkinbetsAuthStage>
      </div>
    </div>
  </div>
</template>

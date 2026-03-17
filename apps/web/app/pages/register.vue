<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: 'auth',
})

useSeo({
  title: 'Create your Napkinbets account',
  description: 'Register to create pools, manage players, and use admin tools.',
  image: '/brand/og/auth.webp',
})

useWebPageSchema({
  name: 'Create your Napkinbets account',
  description: 'Register to access Napkinbets friendly pools.',
})
</script>

<template>
  <div class="napkinbets-page">
    <div class="napkinbets-auth-grid">
      <div class="napkinbets-auth-rail">
        <NapkinbetsLogo />

        <div class="space-y-4">
          <p class="napkinbets-kicker">Register</p>
          <h1 class="napkinbets-hero-title napkinbets-auth-title">Claim your workspace.</h1>
          <p class="napkinbets-hero-lede">
            The first account becomes the prototype admin, and every account can create, join, and
            manage friendly pools.
          </p>
        </div>
      </div>

      <div class="napkinbets-auth-card-shell">
        <NapkinbetsAuthStage
          eyebrow="Register"
          title="Claim your workspace."
          description="Set up your identity for pools, reminders, and admin access."
        >
          <AuthRegisterCard
            title="Create an account"
            subtitle="Set up your identity for pools, reminders, and admin access"
          />
        </NapkinbetsAuthStage>
      </div>
    </div>
  </div>
</template>

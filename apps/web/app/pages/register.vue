<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: 'auth',
})

useSeo({
  title: 'Create your Napkinbets account',
  description: 'Register to create bets, manage players, and use admin tools.',
  image: '/brand/og/auth.webp',
})

useWebPageSchema({
  name: 'Create your Napkinbets account',
  description: 'Register to access Napkinbets friendly bets.',
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
            manage friendly bets.
          </p>
        </div>
      </div>

      <div class="napkinbets-auth-card-shell">
        <AuthRegisterCard
          title="Create an account"
          subtitle="Set up your identity for bets, reminders, and admin access."
        />
      </div>
    </div>
  </div>
</template>

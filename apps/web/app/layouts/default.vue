<template>
  <div class="napkinbets-layout">
    <ClientOnly>
      <NapkinbetsAppHeader />

      <template #fallback>
        <div class="napkinbets-header-wrap">
          <div class="napkinbets-header">
            <div class="napkinbets-header-top">
              <NuxtLink to="/" class="napkinbets-header-brand">
                <NapkinbetsLogo />
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>

    <div class="napkinbets-layout-body">
      <slot />
    </div>

    <div class="napkinbets-footer">
      <div class="napkinbets-footer-inner">
        <div class="space-y-2">
          <p class="napkinbets-kicker">Friendly wagers only</p>
          <p class="napkinbets-support-copy">
            Napkinbets tracks agreements, reminders, and proof of settlement. It does not process money or automate gambling transactions.
          </p>
        </div>

        <div class="napkinbets-chip-grid">
          <span class="napkinbets-hero-pill">ESPN-backed event discovery</span>
          <span class="napkinbets-hero-pill">Manual Venmo / PayPal settlement</span>
          <span class="napkinbets-hero-pill">Cloudflare-ready refresh workflows</span>
        </div>
      </div>
    </div>
  </div>
</template>

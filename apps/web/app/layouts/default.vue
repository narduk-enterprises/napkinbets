<template>
  <div class="napkinbets-layout">
    <ClientOnly>
      <NapkinbetsAppHeader />

      <template #fallback>
        <div class="napkinbets-header-wrap">
          <div class="napkinbets-header">
            <div class="napkinbets-header-top">
              <NuxtLink to="/" class="napkinbets-header-brand">
                <NapkinbetsLogo compact />
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>

    <div class="napkinbets-layout-body">
      <slot />
    </div>

    <ClientOnly>
      <NapkinbetsMobileNav />
    </ClientOnly>

    <div class="napkinbets-footer">
      <div class="napkinbets-footer-inner">
        <p class="napkinbets-support-copy">
          Friendly bets only. Napkinbets keeps the pool organized. Payments stay outside the app.
        </p>
      </div>
    </div>
  </div>
</template>

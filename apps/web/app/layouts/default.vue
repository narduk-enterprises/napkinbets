<template>
  <div class="napkinbets-layout">
    <NapkinbetsAppHeader />

    <div class="napkinbets-layout-body">
      <slot />
    </div>

    <div class="napkinbets-footer">
      <div class="napkinbets-footer-inner">
        <p class="napkinbets-support-copy">
          Friendly bets only. Napkinbets keeps the bet organized. Payments stay outside the app.
        </p>
      </div>
    </div>
  </div>
</template>

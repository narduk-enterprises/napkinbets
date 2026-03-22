<template>
  <div class="napkinbets-dashboard-content" aria-busy="true" aria-live="polite">
    <p class="sr-only"><slot name="sr-label">Loading your bets.</slot></p>
    <div class="napkinbets-stats-strip">
      <USkeleton v-for="i in 5" :key="i" class="h-5 w-24 rounded-md" />
    </div>
    <div class="napkinbets-ledger-summary">
      <USkeleton class="h-5 w-16 rounded-md" />
      <USkeleton class="h-5 w-20 rounded-md" />
      <USkeleton class="h-5 w-20 rounded-md" />
      <USkeleton class="h-5 w-14 rounded-md" />
    </div>
    <div class="flex flex-wrap gap-2">
      <USkeleton v-for="i in 4" :key="i" class="h-8 w-20 rounded-full" />
    </div>
    <div class="space-y-2">
      <div
        v-for="i in 4"
        :key="i"
        class="napkinbets-compact-card items-center gap-3 opacity-60"
      >
        <div class="flex gap-1.5">
          <USkeleton class="h-5 w-12 rounded-full" />
          <USkeleton class="h-5 w-14 rounded-full" />
        </div>
        <div class="min-w-0 space-y-1.5">
          <USkeleton class="h-3.5 w-full max-w-48" />
          <USkeleton class="h-3 w-3/4 max-w-36" />
        </div>
        <div class="text-right">
          <USkeleton class="ml-auto h-3.5 w-10" />
          <USkeleton class="ml-auto mt-1 h-3 w-14" />
        </div>
      </div>
    </div>
  </div>
</template>

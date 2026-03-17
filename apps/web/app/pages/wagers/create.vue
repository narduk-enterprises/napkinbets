<script setup lang="ts">
useSeo({
  title: 'Redirecting to Start a Bet',
  description: 'Redirecting to the Napkinbets bet creation flow.',
})

useWebPageSchema({
  name: 'Redirecting to Start a Bet',
  description: 'Redirecting to the Napkinbets bet creation flow.',
})

await navigateTo('/napkins/create', { redirectCode: 301, replace: true })
</script>

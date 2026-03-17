<script setup lang="ts">
useSeo({
  title: 'Redirecting to Start a Pool',
  description: 'Redirecting to the Napkinbets pool creation flow.',
})

useWebPageSchema({
  name: 'Redirecting to Start a Pool',
  description: 'Redirecting to the Napkinbets pool creation flow.',
})

await navigateTo('/napkins/create', { redirectCode: 301, replace: true })
</script>

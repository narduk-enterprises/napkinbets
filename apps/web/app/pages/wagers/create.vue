<script setup lang="ts">
useSeo({
  title: 'Redirecting to Start a Napkin',
  description: 'Redirecting to the Napkinbets creation flow.',
})

useWebPageSchema({
  name: 'Redirecting to Start a Napkin',
  description: 'Redirecting to the Napkinbets creation flow.',
})

await navigateTo('/napkins/create', { redirectCode: 301, replace: true })
</script>

<script setup lang="ts">
useSeo({
  title: 'Redirecting to Events',
  description: 'Redirecting to the Napkinbets games view.',
})

useWebPageSchema({
  name: 'Redirecting to Events',
  description: 'Redirecting to the Napkinbets games view.',
})

await navigateTo('/events', { redirectCode: 301, replace: true })
</script>

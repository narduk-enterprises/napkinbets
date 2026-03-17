<script setup lang="ts">
const route = useRoute()

useSeo({
  title: 'Redirecting to Settle Up',
  description: 'Redirecting to the Napkinbets settle-up view.',
})

useWebPageSchema({
  name: 'Redirecting to Settle Up',
  description: 'Redirecting to the Napkinbets settle-up view.',
})

await navigateTo(`/napkins/${String(route.params.slug || '')}/closeout`, {
  redirectCode: 301,
  replace: true,
})
</script>

<script setup lang="ts">
const route = useRoute()

useSeo({
  title: 'Redirecting to Bet',
  description: 'Redirecting to the Napkinbets bet detail view.',
})

useWebPageSchema({
  name: 'Redirecting to Bet',
  description: 'Redirecting to the Napkinbets bet detail view.',
})

await navigateTo(`/napkins/${String(route.params.slug || '')}`, {
  redirectCode: 301,
  replace: true,
})
</script>

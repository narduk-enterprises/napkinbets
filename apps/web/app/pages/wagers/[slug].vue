<script setup lang="ts">
const route = useRoute()

useSeo({
  title: 'Redirecting to Napkin',
  description: 'Redirecting to the Napkinbets napkin detail view.',
})

useWebPageSchema({
  name: 'Redirecting to Napkin',
  description: 'Redirecting to the Napkinbets napkin detail view.',
})

await navigateTo(`/napkins/${String(route.params.slug || '')}`, {
  redirectCode: 301,
  replace: true,
})
</script>

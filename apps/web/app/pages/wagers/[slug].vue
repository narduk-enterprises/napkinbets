<script setup lang="ts">
const route = useRoute()

useSeo({
  title: 'Redirecting to Pool',
  description: 'Redirecting to the Napkinbets pool detail view.',
})

useWebPageSchema({
  name: 'Redirecting to Pool',
  description: 'Redirecting to the Napkinbets pool detail view.',
})

await navigateTo(`/napkins/${String(route.params.slug || '')}`, {
  redirectCode: 301,
  replace: true,
})
</script>

export function useNapkinbetsAutoRefresh(refresh: () => Promise<unknown>, intervalMs = 60_000) {
  const timerHandle = ref<number | null>(null)

  onMounted(() => {
    timerHandle.value = window.setInterval(() => {
      void refresh()
    }, intervalMs)
  })

  onBeforeUnmount(() => {
    if (timerHandle.value) {
      window.clearInterval(timerHandle.value)
    }
  })
}

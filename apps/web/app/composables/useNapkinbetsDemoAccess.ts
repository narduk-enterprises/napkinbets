export function useNapkinbetsDemoAccess() {
  const fetch = useAppFetch()
  const { fetch: fetchSession } = useUserSession()
  const pending = ref(false)
  const error = ref('')

  async function openDemo() {
    pending.value = true
    error.value = ''

    try {
      await fetch('/api/auth/demo-login', {
        method: 'POST',
      })
      await fetchSession()
      await navigateTo('/dashboard', { replace: true })
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Unable to open the demo account.'
    } finally {
      pending.value = false
    }
  }

  return {
    pending,
    error,
    openDemo,
  }
}

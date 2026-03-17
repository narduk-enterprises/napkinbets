export function useNapkinbetsDemoAccess() {
  const pending = ref(false)
  const error = ref('')

  function buildDemoUrl(redirectPath = '/dashboard') {
    if (!import.meta.client) {
      throw new Error('Demo sign-in is only available in the browser.')
    }

    return `/auth/demo?redirect=${encodeURIComponent(redirectPath)}`
  }

  async function openDemo(redirectPath = '/dashboard') {
    pending.value = true
    error.value = ''

    try {
      window.location.assign(buildDemoUrl(redirectPath))
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Unable to open the demo account.'
      pending.value = false
    }
  }

  return {
    pending,
    error,
    openDemo,
  }
}

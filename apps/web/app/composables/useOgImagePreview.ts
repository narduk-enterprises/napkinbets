export function useOgImagePreview(path: string) {
  const { data: ogData, status } = useFetch('/api/admin/og-image-url', {
    query: { path },
    lazy: true,
    key: `og-image-${path}`,
  })

  return { ogData, status }
}

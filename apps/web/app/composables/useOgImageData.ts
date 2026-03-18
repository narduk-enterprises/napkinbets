/**
 * Fetches real wager, group, and event data from the database
 * for the admin OG image preview tab. Works against the local D1
 * in dev and prod D1 when deployed.
 */
export function useOgImageData() {
  const { data, status, error } = useFetch('/api/admin/og-image-data', {
    lazy: true,
    key: 'admin-og-image-data',
  })

  return { data, status, error }
}

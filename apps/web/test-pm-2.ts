async function fetchPolymarketSearch(query) {
  const url = new URL('https://gamma-api.polymarket.com/public-search')
  url.searchParams.set('q', query)
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'napkinbets-polymarket-lookup',
    },
  })
  if (!response.ok) return []
  const payload = await response.json()
  return payload.events ?? []
}

async function test() {
  const results = await fetchPolymarketSearch('mlb')
  console.log('Hits:', results.length)
  for (const r of results.filter((r) => !r.closed).slice(0, 10)) {
    console.log('-', r.title, '[slug:', r.slug, '] start:', r.markets?.[0]?.gameStartTime)
  }
}
test()

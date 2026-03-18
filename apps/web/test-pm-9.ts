async function fetchPolymarketSearch(query) {
  const url = new URL('https://gamma-api.polymarket.com/public-search')
  url.searchParams.set('q', query)
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'napkinbets-polymarket-lookup' },
  })
  if (!response.ok) return []
  const payload = await response.json()
  return payload.events ?? []
}
async function test() {
  const queries = ['mlb', 'baseball', 'mlb games', 'march 18', 'phillies']
  for (const q of queries) {
    const events = await fetchPolymarketSearch(q)
    const active = events.filter((e) => !e.closed && !e.archived)
    if (active.length > 0) {
      console.log(`Query "${q}" active hits:`, active.length)
      for (const e of active) console.log('  -', e.title)
    }
  }
}
test()

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
  const queries = [
    'Phillies Braves',
    'Philadelphia Phillies Atlanta Braves',
    'PHI ATL',
    'Phillies Braves mlb',
  ]
  console.log('Searching...')
  for (const q of queries) {
    console.log('--- Query:', q)
    const results = await fetchPolymarketSearch(q)
    console.log('Hits:', results.length)
    if (results.length > 0) {
      console.log('Top Hit Titles:')
      for (const r of results.slice(0, 3)) {
        console.log('-', r.title, '[slug:', r.slug, ']', 'Markets:', r.markets?.length)
      }
    }
  }
}
test()

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
  const queries = ['MLB Games: March 18', 'MLB Games', 'mlb']
  for (const q of queries) {
    const results = await fetchPolymarketSearch(q)
    const hit = results.find((r) => r.title?.includes('March 18') || r.title?.includes('MLB Games'))
    if (hit) {
      console.log('Found:', hit.title, hit.slug)
      for (const m of (hit.markets || []).slice(0, 5)) {
        console.log(
          '  - Market:',
          m.sportsMarketType,
          'Outcomes:',
          m.outcomes,
          'GameStart:',
          m.gameStartTime,
        )
      }
      break
    }
  }
}
test()

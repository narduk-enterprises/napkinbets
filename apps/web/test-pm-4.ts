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
  const results = await fetchPolymarketSearch('mlb-games-march-31')
  if (results.length > 0) {
    console.dir(results[0].markets?.[0], { depth: null })
  } else {
    const backup = await fetchPolymarketSearch('MLB Games')
    if (backup.length > 0) {
      console.dir(backup[0].markets?.[0], { depth: null })
    }
  }
}
test()

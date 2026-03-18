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
  const events = await fetchPolymarketSearch('Philadelphia Phillies Atlanta Braves')
  console.log('Found', events.length, 'events')
  for (const e of events) console.log(e.title, e.closed, e.archived)
}
test()

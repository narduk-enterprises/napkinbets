function normalizeText(value) {
  return (value ?? '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}
function test() {
  const haystack = normalizeText(
    'WSH Nationals vs. TOR Blue Jays March 31 ["Nationals", "Blue Jays"]',
  )
  console.log(haystack)
  console.log(haystack.includes(normalizeText('WSH')))
}
test()

function normalizeText(value) {
  return (value ?? '')
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}
function buildTeamTerms(team) {
  const values = new Set()
  const addValue = (value) => {
    const normalized = normalizeText(value)
    if (normalized.length >= 2) values.add(normalized)
  }
  addValue(team.name)
  addValue(team.shortName)
  addValue(team.abbreviation)
  return [...values]
}

const awayTerms = buildTeamTerms({
  name: 'Washington Nationals',
  shortName: 'Nationals',
  abbreviation: 'WSH',
})
const homeTerms = buildTeamTerms({
  name: 'Toronto Blue Jays',
  shortName: 'Blue Jays',
  abbreviation: 'TOR',
})

const markets = [
  {
    sportsMarketType: undefined,
    groupItemTitle: 'WSH Nationals vs. TOR Blue Jays',
    outcomes: '["Nationals", "Blue Jays"]',
  },
]

function findMarket(type) {
  return markets.find((m) => {
    if (type && m.sportsMarketType !== type) return false
    if (markets.length >= 1) {
      const mh = normalizeText(
        `${m.groupItemTitle ?? ''} ${m.description ?? ''} ${m.outcomes ?? ''}`,
      )
      const hasAway = awayTerms.some((t) => mh.includes(t))
      const hasHome = homeTerms.some((t) => mh.includes(t))
      if (!hasAway || !hasHome) return false
    }
    return true
  })
}

console.log(findMarket('moneyline')) // undefined
console.log(findMarket()) // finds it

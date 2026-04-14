fetch('https://api.football-data.org/v4/competitions/2000/matches', {
  headers: { 'X-Auth-Token': 'f13f5b65e5214872bec6965755d6c33a' }
})
.then(r => r.json())
.then(d => {
  d.matches.forEach(m => {
    if (!m.homeTeam?.name || !m.awayTeam?.name) return
    console.log(m.homeTeam.name, 'vs', m.awayTeam.name, '|', m.utcDate.slice(0,10))
  })
})
.catch(console.error)
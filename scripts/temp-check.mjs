const res = await fetch('https://api.football-data.org/v4/competitions', {
  headers: { 'X-Auth-Token': 'f13f5b65e5214872bec6965755d6c33a' }
})
const data = await res.json()
console.log(JSON.stringify(data, null, 2))
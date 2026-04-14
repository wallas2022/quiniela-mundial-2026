import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const FOOTBALL_API_KEY    = process.env.FOOTBALL_API_KEY!
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const COMPETITIONS: Record<string, number> = {
  world_cup_2026:   2000,
  champions_league: 2001,
  premier_league:   2021,
  liga_mx:          2137,
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'SCHEDULED': 'scheduled', 'TIMED': 'scheduled',
    'IN_PLAY':   'live',      'PAUSED': 'live',
    'FINISHED':  'finished',
    'POSTPONED': 'postponed',
  }
  return map[status] ?? 'scheduled'
}

async function syncTournament(tournament: string, competitionId: number) {
  console.log(`\n── ${tournament} (id: ${competitionId}) ──`)

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competitionId}/matches`,
    { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
  )

  if (!res.ok) {
    console.error(`  Error API: ${res.status}`, await res.text())
    return { updated: 0, live: 0 }
  }

  const data = await res.json()
  const matches = data.matches ?? []

  // Partidos con marcador (finished, live o medio tiempo) → actualizar score + status
  const withScore = matches.filter((m: any) =>
    ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status) &&
    m.homeTeam?.name && m.awayTeam?.name &&
    m.score?.fullTime?.home !== null && m.score?.fullTime?.home !== undefined
  )

  let updated = 0
  for (const m of withScore) {
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
        status:     mapStatus(m.status),
        synced_at:  new Date().toISOString(),
      })
      .eq('external_id', String(m.id))

    if (!error) updated++
  }

  const live = withScore.filter((m: any) => m.status !== 'FINISHED').length
  if (updated > 0) console.log(`  ✓ ${updated} actualizados (${live} en vivo)`)

  return { updated, live }
}

async function syncResults() {
  console.log('Sincronizando resultados de todos los torneos...')

  const tournamentArg = process.argv[2]
  const toSync = tournamentArg
    ? { [tournamentArg]: COMPETITIONS[tournamentArg] }
    : COMPETITIONS

  if (tournamentArg && !COMPETITIONS[tournamentArg]) {
    console.error(`Torneo no soportado: "${tournamentArg}"`)
    console.error(`Opciones: ${Object.keys(COMPETITIONS).join(', ')}`)
    process.exit(1)
  }

  for (const [tournament, id] of Object.entries(toSync)) {
    await syncTournament(tournament, id)
  }

  // Calcular puntos para todos los partidos con marcador (finished + live)
  const { data: scoredMatches, error } = await supabase
    .from('matches')
    .select('id, tournament')
    .in('status', ['finished', 'live'])
    .not('home_score', 'is', null)

  if (error) {
    console.error('\nError al obtener partidos con marcador:', error.message)
    return
  }

  if (!scoredMatches?.length) {
    console.log('\nNo hay partidos con marcador para calcular puntos')
    return
  }

  const byTournament: Record<string, number> = {}
  for (const m of scoredMatches) {
    byTournament[m.tournament] = (byTournament[m.tournament] ?? 0) + 1
  }
  console.log(`\nCalculando puntos para ${scoredMatches.length} partidos:`)
  for (const [t, count] of Object.entries(byTournament)) {
    console.log(`  ${t}: ${count} partidos`)
  }

  let calculated = 0
  let errors = 0
  for (const match of scoredMatches) {
    const { error: rpcError } = await supabase.rpc('calculate_match_points', {
      p_match_id: match.id
    })
    if (!rpcError) calculated++
    else errors++
  }

  console.log(`\n✅ Sync completado`)
  console.log(`   Puntos calculados: ${calculated}/${scoredMatches.length}`)
  if (errors > 0) console.log(`   Errores: ${errors}`)
}

syncResults()

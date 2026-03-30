import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const FOOTBALL_API_KEY    = process.env.FOOTBALL_API_KEY!
const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function syncResults() {
  console.log('Sincronizando resultados del Mundial 2026...')

  // 1. Traer resultados de la API
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/2000/matches',
    { headers: { 'X-Auth-Token': FOOTBALL_API_KEY } }
  )

  if (!res.ok) {
    console.error('Error API:', res.status, await res.text())
    return
  }

  const data = await res.json()
  const finished = data.matches.filter((m: any) =>
    m.status === 'FINISHED' && m.utcDate?.startsWith('2026')
  )

  console.log(`Partidos terminados: ${finished.length}`)

  // 2. Actualizar resultados en Supabase
  let updated = 0
  for (const m of finished) {
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: m.score?.fullTime?.home,
        away_score: m.score?.fullTime?.away,
        status:     'finished',
        synced_at:  new Date().toISOString(),
      })
      .eq('external_id', String(m.id))

    if (!error) updated++
  }

  console.log(`✓ ${updated} partidos actualizados`)

  // 3. Marcar como live los que están en curso
  const live = data.matches.filter((m: any) => m.status === 'IN_PLAY')
  for (const m of live) {
    await supabase
      .from('matches')
      .update({ status: 'live' })
      .eq('external_id', String(m.id))
  }

  if (live.length > 0) console.log(`⚡ ${live.length} partidos en vivo`)

  // 4. Calcular puntos para partidos terminados
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'finished')

  if (!finishedMatches?.length) {
    console.log('No hay partidos terminados para calcular puntos')
    return
  }

  console.log(`Calculando puntos para ${finishedMatches.length} partidos...`)

  let calculated = 0
  for (const match of finishedMatches) {
    const { error } = await supabase.rpc('calculate_match_points', {
      p_match_id: match.id
    })
    if (!error) calculated++
  }

  console.log(`✓ Puntos calculados para ${calculated} partidos`)
  console.log('\n✅ Sync completado')
}

syncResults()
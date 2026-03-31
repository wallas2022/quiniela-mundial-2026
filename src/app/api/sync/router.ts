import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

const FLAG_CODES: Record<string, string> = {
  'Mexico': 'mx', 'Argentina': 'ar', 'Brazil': 'br', 'France': 'fr',
  'Spain': 'es', 'Germany': 'de', 'Portugal': 'pt', 'England': 'gb-eng',
  'USA': 'us', 'United States': 'us', 'Canada': 'ca', 'Haiti': 'ht',
  'Uruguay': 'uy', 'Ecuador': 'ec', 'Colombia': 'co', 'Paraguay': 'py',
  'South Korea': 'kr', 'Japan': 'jp', 'Morocco': 'ma', 'Senegal': 'sn',
  'Australia': 'au', 'Serbia': 'rs', 'Croatia': 'hr', 'Switzerland': 'ch',
  'Netherlands': 'nl', 'Poland': 'pl', 'Denmark': 'dk', 'Austria': 'at',
  'South Africa': 'za', 'Curacao': 'cw', 'Bolivia': 'bo', 'Scotland': 'gb-sct',
}

export async function GET(request: Request) {
  // Verificar token de seguridad
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Traer partidos de la API
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/2000/matches',
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! } }
    )
    const data = await res.json()
    const matches = data.matches ?? []

    // 2. Marcar como LIVE los que están en curso
    const liveMatches = matches.filter((m: any) => m.status === 'IN_PLAY')
    for (const m of liveMatches) {
      await supabase
        .from('matches')
        .update({ status: 'live' })
        .eq('external_id', String(m.id))
    }

    // 3. Actualizar resultados de partidos terminados
    const finished = matches.filter((m: any) =>
      m.status === 'FINISHED' &&
      m.utcDate?.startsWith('2026') &&
      m.homeTeam?.name &&
      m.awayTeam?.name
    )

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

    // 4. Calcular puntos para partidos terminados
    const { data: finishedInDB } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'finished')

    let calculated = 0
    for (const match of finishedInDB ?? []) {
      const { error } = await supabase.rpc('calculate_match_points', {
        p_match_id: match.id
      })
      if (!error) calculated++
    }

    return NextResponse.json({
      ok:         true,
      live:       liveMatches.length,
      updated,
      calculated,
      timestamp:  new Date().toISOString(),
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

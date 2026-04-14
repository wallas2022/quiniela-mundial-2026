import { supabaseServer } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service key solo para el RPC (necesita escribir en scores/predictions de otros usuarios).
// Si no está configurada, el RPC se intenta con anon key (funciona si la función es SECURITY DEFINER).
const rpcClient = process.env.SUPABASE_SERVICE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    )
  : null

export async function POST(request: Request) {
  // 1. Auth — sesión del usuario
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { leagueId } = await request.json()
  if (!leagueId) return NextResponse.json({ error: 'leagueId requerido' }, { status: 400 })

  // 2. Verificar rol admin (usa sesión del usuario — RLS permite leer la propia membresía)
  const { data: member, error: memberError } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (memberError) {
    return NextResponse.json({ error: `Error membresía: ${memberError.message}` }, { status: 500 })
  }
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede recalcular puntos' }, { status: 403 })
  }

  // 3. Leer torneo de la liga (con sesión del usuario — puede leer su propia liga)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('tournament_config')
    .eq('id', leagueId)
    .single()

  if (leagueError) {
    return NextResponse.json({ error: `Error leyendo liga: ${leagueError.message}` }, { status: 500 })
  }

  const tournament: string = league?.tournament_config?.tournament ?? 'world_cup_2026'

  // 4. Partidos con marcador (con sesión del usuario — matches es pública)
  const { data: scoredMatches, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status')
    .in('status', ['finished', 'live'])
    .eq('tournament', tournament)
    .not('home_score', 'is', null)

  if (matchError) {
    return NextResponse.json({ error: `Error leyendo partidos: ${matchError.message}` }, { status: 500 })
  }

  if (!scoredMatches?.length) {
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select('id, status, home_score, home_team, away_team')
      .eq('tournament', tournament)
      .limit(5)

    return NextResponse.json({
      ok: false,
      calculated: 0,
      message: 'No hay partidos con marcador aún',
      tournament,
      diagnostics: { sample_matches: sampleMatches ?? [] },
    })
  }

  // 5. Predicciones encontradas para diagnóstico
  const matchIds = scoredMatches.map(m => m.id)
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, match_id')
    .in('match_id', matchIds)
    .eq('league_id', leagueId)

  // 6. RPC — usa service key si está disponible, si no usa sesión del usuario
  const caller = rpcClient ?? supabase
  let calculated = 0
  const rpcErrors: string[] = []

  for (const match of scoredMatches) {
    const { error } = await caller.rpc('calculate_match_points', {
      p_match_id: match.id,
    })
    if (!error) {
      calculated++
    } else {
      rpcErrors.push(`${match.home_team} vs ${match.away_team}: ${error.message}`)
    }
  }

  return NextResponse.json({
    ok: calculated > 0 || rpcErrors.length === 0,
    tournament,
    service_key_available: !!process.env.SUPABASE_SERVICE_KEY,
    total_matches_with_score: scoredMatches.length,
    total_predictions_found: predictions?.length ?? 0,
    calculated,
    rpc_errors: rpcErrors.length,
    error_details: rpcErrors.slice(0, 5),
    sample_matches: scoredMatches.slice(0, 3).map(m => ({
      teams: `${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}`,
      status: m.status,
    })),
  })
}

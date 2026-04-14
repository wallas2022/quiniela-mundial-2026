import { supabaseServer } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: Request) {
  // 1. Auth — usa la sesión del usuario (misma que el admin page)
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { leagueId } = await request.json()
  if (!leagueId) return NextResponse.json({ error: 'leagueId requerido' }, { status: 400 })

  // 2. Verificar rol admin — con supabaseServer (misma lógica que admin/[leagueId]/page.tsx)
  const { data: member } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede recalcular puntos' }, { status: 403 })
  }

  // 3. Leer torneo de la liga
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('tournament_config')
    .eq('id', leagueId)
    .single()

  const tournament: string = league?.tournament_config?.tournament ?? 'world_cup_2026'

  // 4. Partidos con marcador (finished o live) de ese torneo
  const { data: finishedMatches, error: matchError } = await supabaseAdmin
    .from('matches')
    .select('id')
    .in('status', ['finished', 'live'])
    .eq('tournament', tournament)
    .not('home_score', 'is', null)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  if (!finishedMatches?.length) {
    return NextResponse.json({ ok: true, calculated: 0, message: 'No hay partidos con marcador aún' })
  }

  // 5. Recalcular puntos
  let calculated = 0
  let errors = 0
  for (const match of finishedMatches) {
    const { error } = await supabaseAdmin.rpc('calculate_match_points', {
      p_match_id: match.id,
    })
    if (!error) calculated++
    else errors++
  }

  return NextResponse.json({
    ok: true,
    tournament,
    total: finishedMatches.length,
    calculated,
    errors,
  })
}

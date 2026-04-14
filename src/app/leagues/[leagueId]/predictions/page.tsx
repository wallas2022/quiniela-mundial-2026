import { supabaseServer } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PredictionsClient from './PredictionsClient'

// Cliente admin solo para league_members (RLS deshabilitado, anon key alcanza)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function PredictionsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar membresía (igual que leagues/[leagueId]/page.tsx)
  const { data: member } = await supabaseAdmin
    .from('league_members')
    .select('status')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.status !== 'approved') redirect(`/leagues/${leagueId}`)

  // Leer torneo y rondas desde la liga
  const { data: league } = await supabase
    .from('leagues')
    .select('tournament_config')
    .eq('id', leagueId)
    .single()

  const tournament: string = league?.tournament_config?.tournament ?? 'world_cup_2026'
  const rounds: string[]   = league?.tournament_config?.rounds     ?? ['group']
  const nowIso = new Date().toISOString()

  const [matchesRes, predsRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('tournament', tournament)
      .in('round', rounds)
      .order('kickoff_at', { ascending: true }),
    supabase
      .from('predictions')
      .select('*')
      .eq('league_id', leagueId)
      .eq('user_id', user.id),
  ])

  // Misma lógica que isLocked() en el cliente:
  // locked = status !== 'scheduled' OR kickoff ya pasó
  const allMatches = matchesRes.data ?? []
  const upcomingMatches = allMatches.filter(
    m => m.status === 'scheduled' && m.kickoff_at > nowIso
  )
  const pastMatches = allMatches.filter(
    m => m.status !== 'scheduled' || m.kickoff_at <= nowIso
  )

  return (
    <PredictionsClient
      upcomingMatches={upcomingMatches}
      pastMatches={pastMatches}
      predictions={predsRes.data ?? []}
      leagueId={leagueId}
      userId={user.id}
    />
  )
}

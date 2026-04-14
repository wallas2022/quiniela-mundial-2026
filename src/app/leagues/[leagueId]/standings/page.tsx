import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import StandingsClient from './StandingsClient'

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('league_members')
    .select('status, role')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.status !== 'approved') redirect(`/leagues/${leagueId}`)

  const [leagueRes, scoresRes, membersRes, predictionsRes, profilesRes] = await Promise.all([
    supabase.from('leagues')
      .select('name, entry_fee, currency')
      .eq('id', leagueId)
      .single(),
    supabase.from('scores')
      .select('user_id, total_points, exact_scores, correct_results')
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false }),
    supabase.from('league_members')
      .select('user_id')
      .eq('league_id', leagueId)
      .eq('status', 'approved'),
    supabase.from('predictions')
      .select('user_id, points_earned, match_id')
      .eq('league_id', leagueId)
      .not('points_earned', 'is', null),
    supabase.from('profiles')
      .select('id, display_name'),
  ])

  console.log('SCORES FETCHED:', scoresRes.data?.length, scoresRes.error)
console.log('SCORES DATA:', scoresRes.data)

  const league      = leagueRes.data
  const memberIds   = membersRes.data?.map(m => m.user_id) ?? []
  const scoreMap    = Object.fromEntries((scoresRes.data ?? []).map(s => [s.user_id, s]))
  const profileMap  = Object.fromEntries((profilesRes.data ?? []).map(p => [p.id, p.display_name]))

  const standings = memberIds
    .map(uid => {
      const score     = scoreMap[uid]
      const userPreds = predictionsRes.data?.filter(p => p.user_id === uid) ?? []
      return {
        user_id:         uid,
        display_name:    profileMap[uid] ?? uid.slice(0, 8) + '...',
        total_points:    score?.total_points ?? 0,
        exact_scores:    score?.exact_scores ?? 0,
        correct_results: score?.correct_results ?? 0,
        played:          userPreds.length,
        isMe:            uid === user.id,
      }
    })
    .sort((a, b) => b.total_points - a.total_points)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  const totalPot = memberIds.length * (league?.entry_fee ?? 0)

  return (
    <StandingsClient
      leagueId={leagueId}
      leagueName={league?.name ?? ''}
      standings={standings}
      totalPot={totalPot}
      currency={league?.currency ?? ''}
      isAdmin={member.role === 'admin'}
    />
  )
}

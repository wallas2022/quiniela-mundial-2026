import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    .select('status')
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
        display_name:    profileMap[uid] ?? uid.slice(0,8) + '...',
        total_points:    score?.total_points ?? 0,
        exact_scores:    score?.exact_scores ?? 0,
        correct_results: score?.correct_results ?? 0,
        played:          userPreds.length,
        isMe:            uid === user.id,
      }
    })
    .sort((a, b) => b.total_points - a.total_points)
    .map((s, i) => ({ ...s, rank: i + 1 }))

  const myRank   = standings.find(s => s.isMe)
  const totalPot = memberIds.length * (league?.entry_fee ?? 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/leagues/${leagueId}`}
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← {league?.name}
        </Link>
        <span className="text-xs text-gray-500">Tabla de posiciones</span>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Jugadores</div>
            <div className="text-xl font-medium">{standings.length}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Pozo</div>
            <div className="text-xl font-medium">{league?.currency} {totalPot}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Tu posición</div>
            <div className="text-xl font-medium">#{myRank?.rank ?? '—'}</div>
          </div>
        </div>

        {/* Tu posición si no estás en top 3 */}
        {myRank && myRank.rank > 3 && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl
                          px-4 py-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-medium text-sm">#{myRank.rank}</span>
              <span className="text-sm text-blue-200">{myRank.display_name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-200">
                {myRank.total_points} pts
              </div>
              {standings[0] && (
                <div className="text-xs text-blue-400">
                  {standings[0].total_points - myRank.total_points} pts del líder
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabla */}
        {standings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🏆</div>
            <div className="text-sm text-gray-400">
              Aún no hay puntos — los resultados se calculan al terminar cada partido
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {standings.map(s => (
              <div key={s.user_id}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3
                  ${s.isMe ? 'bg-blue-950 border-blue-800' : 'bg-gray-900 border-gray-800'}`}>

                <div className={`text-sm font-medium w-7 text-center flex-shrink-0
                  ${s.rank === 1 ? 'text-amber-400'
                  : s.rank === 2 ? 'text-gray-400'
                  : s.rank === 3 ? 'text-orange-600'
                  : 'text-gray-600'}`}>
                  {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                  text-xs font-medium flex-shrink-0
                                  ${s.isMe ? 'bg-blue-800 text-blue-200' : 'bg-gray-800 text-gray-400'}`}>
                  {s.display_name.slice(0,2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate
                      ${s.isMe ? 'text-blue-200' : 'text-white'}`}>
                      {s.display_name}
                    </span>
                    {s.isMe && (
                      <span className="text-xs text-blue-400 flex-shrink-0">(vos)</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-green-400">{s.exact_scores} exactos</span>
                    <span className="text-xs text-blue-400">{s.correct_results} resultados</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-base font-medium">{s.total_points}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-4 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Exacto (+5 pts)
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Resultado (+3 pts)
          </span>
        </div>

      </div>
    </div>
  )
}
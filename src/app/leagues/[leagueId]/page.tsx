import { supabaseServer } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ShareCard from './ShareCard'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  if (!league) redirect('/')

  const { data: member } = await supabaseAdmin
    .from('league_members')
    .select('role, status')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/')

  if (member.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-lg font-medium mb-2">Solicitud pendiente</h1>
          <p className="text-sm text-gray-400 mb-6">
            El admin de <strong>{league.name}</strong> debe aprobarte para que puedas pronosticar.
          </p>
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (member.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-lg font-medium mb-2">Acceso denegado</h1>
          <p className="text-sm text-gray-400 mb-6">
            Tu solicitud para unirte a <strong>{league.name}</strong> fue rechazada.
          </p>
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('role, status, user_id')
    .eq('league_id', leagueId)

  const tournament = league.tournament_config?.tournament ?? 'world_cup_2026'
  const rounds     = league.tournament_config?.rounds     ?? ['group']

  const [matchesRes, myPredsRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('tournament', tournament)
      .in('round', rounds)
      .eq('status', 'scheduled')
      .gte('kickoff_at', new Date().toISOString())
      .order('kickoff_at', { ascending: true })
      .limit(5),
    supabase
      .from('predictions')
      .select('match_id, pred_home, pred_away, points_earned')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
      .limit(10),
  ])

  const matches  = matchesRes.data ?? []
  const myPreds  = myPredsRes.data ?? []

  // Cargar datos de los partidos pronosticados
  let predMatches: any[] = []
  if (myPreds.length > 0) {
    const matchIds = myPreds.map(p => p.match_id)
    const { data } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_flag, away_flag, home_crest, away_crest, home_score, away_score, status, kickoff_at')
      .in('id', matchIds)
      .order('kickoff_at', { ascending: false })
    predMatches = data ?? []
  }

  const isAdmin  = member.role === 'admin'
  const approved = members?.filter(m => m.status === 'approved').length ?? 0
  const pending  = members?.filter(m => m.status === 'pending').length ?? 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span>⚽</span>
          <span className="font-medium">Quiniela 2026</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href={`/admin/${leagueId}`}
              className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5
                         rounded-lg border border-gray-700 transition-colors">
              Panel admin
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{league.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {approved} jugadores · {league.currency} {league.entry_fee} entrada
          </p>
        </div>

        <ShareCard inviteCode={league.invite_code} />

        {isAdmin && pending > 0 && (
          <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 mb-6 text-xs text-amber-400">
            {pending} jugador{pending > 1 ? 'es' : ''} esperando aprobación
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">Próximos partidos</h2>
            <Link href={`/leagues/${leagueId}/predictions`}
              className="text-xs text-blue-400 hover:text-blue-300">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {matches && matches.length > 0 ? matches.map(m => (
             <div key={m.id}
  className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      
{m.home_crest ? (
  <img src={m.home_crest} width={24} height={24} 
    className="rounded-sm object-contain" alt={m.home_team} />
) : (
  <img src={`https://flagcdn.com/w20/${m.home_flag}.png`}
    width={20} height={14} className="rounded-sm" alt={m.home_team} />
)}
      <span className="text-sm truncate">{m.home_team}</span>
    </div>
    <span className="text-xs text-gray-500 flex-shrink-0">vs</span>
    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
      <span className="text-sm truncate">{m.away_team}</span>
  
{m.away_crest ? (
  <img src={m.away_crest} width={24} height={24} 
    className="rounded-sm object-contain" alt={m.away_team} />
) : (
  <img src={`https://flagcdn.com/w20/${m.away_flag}.png`}
    width={20} height={14} className="rounded-sm" alt={m.away_team} />
)}
    </div>
    <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
      {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Guatemala'
      })}
    </div>
  </div>
</div>
            )) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No hay partidos programados para este torneo
              </div>
            )}
          </div>
        </div>

        {/* Mis pronósticos */}
        {myPreds.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-300">Mis pronósticos</h2>
              <Link href={`/leagues/${leagueId}/predictions`}
                className="text-xs text-blue-400 hover:text-blue-300">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2">
              {predMatches.map(m => {
                const pred = myPreds.find(p => p.match_id === m.id)
                if (!pred) return null
                const isFinished = m.status === 'finished'
                const isLive     = m.status === 'live'
                return (
                  <div key={m.id} className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                    {/* Equipos */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {m.home_crest
                          ? <img src={m.home_crest} width={20} height={20} className="rounded-sm object-contain flex-shrink-0" alt={m.home_team} />
                          : <img src={`https://flagcdn.com/w20/${m.home_flag}.png`} width={20} height={14} className="rounded-sm flex-shrink-0" alt={m.home_team} />}
                        <span className="text-sm truncate">{m.home_team}</span>
                      </div>

                      {/* Marcadores */}
                      <div className="flex-shrink-0 text-center px-2">
                        {/* Pronóstico */}
                        <div className="text-xs text-gray-500 mb-0.5">pronóstico</div>
                        <div className="text-sm font-bold tabular-nums text-blue-400">
                          {pred.pred_home} – {pred.pred_away}
                        </div>
                        {/* Resultado real */}
                        {isFinished && m.home_score !== null && (
                          <div className="text-xs text-gray-400 mt-0.5 tabular-nums">
                            {m.home_score} – {m.away_score}
                          </div>
                        )}
                        {isLive && (
                          <div className="text-xs text-green-400 mt-0.5 font-semibold tabular-nums">
                            {m.home_score ?? 0} – {m.away_score ?? 0}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                        <span className="text-sm truncate text-right">{m.away_team}</span>
                        {m.away_crest
                          ? <img src={m.away_crest} width={20} height={20} className="rounded-sm object-contain flex-shrink-0" alt={m.away_team} />
                          : <img src={`https://flagcdn.com/w20/${m.away_flag}.png`} width={20} height={14} className="rounded-sm flex-shrink-0" alt={m.away_team} />}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-600">
                        {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                          timeZone: 'America/Guatemala',
                        })}
                      </span>
                      {pred.points_earned !== null && pred.points_earned !== undefined ? (
                        <span className={`text-xs font-semibold ${pred.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {pred.points_earned > 0 ? `+${pred.points_earned} pts` : '0 pts'}
                        </span>
                      ) : isLive ? (
                        <span className="text-xs text-green-400 animate-pulse">EN VIVO</span>
                      ) : (
                        <span className="text-xs text-gray-600">pendiente</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link href={`/leagues/${leagueId}/payment`}
            className="block w-full text-center py-3 bg-gray-800 hover:bg-gray-700
                      border border-gray-700 rounded-xl font-medium transition-colors">
            💳 Subir comprobante de pago
          </Link>
          <Link href={`/leagues/${leagueId}/predictions`}
            className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500
                      rounded-xl font-medium transition-colors">
            Ir a pronosticar
          </Link>
          <Link href={`/leagues/${leagueId}/standings`}
            className="block w-full text-center py-3 bg-gray-800 hover:bg-gray-700
                      border border-gray-700 rounded-xl font-medium transition-colors">
            🏆 Tabla de posiciones
          </Link>
        </div>

      </div>
    </div>
  )
}
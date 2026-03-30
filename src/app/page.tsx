import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ligas del usuario
  const { data: memberships } = await supabase
    .from('league_members')
    .select('role, status, league:leagues(id, name, entry_fee, currency, invite_code)')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  // Próximos partidos (públicos)
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true })
    .limit(8)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚽</span>
          <span className="font-medium">Quiniela 2026</span>
        </div>
        <div className="flex items-center gap-4">
         
          <Link href="/profile"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
            {user.email}
          </Link>
          <form action="/auth/logout" method="post">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Mis ligas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-300">Mis ligas</h2>
            <div className="flex gap-2">
              <Link href="/leagues/join"
                className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400
                           hover:border-gray-500 hover:text-white rounded-lg transition-colors">
                Unirse
              </Link>
              <Link href="/leagues/new"
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500
                           rounded-lg transition-colors">
                Crear liga
              </Link>
            </div>
          </div>

          {memberships && memberships.length > 0 ? (
            <div className="space-y-2">
              {memberships.map((m: any) => (
                <Link key={m.league.id} href={`/leagues/${m.league.id}`}
                  className="flex items-center justify-between bg-gray-900 hover:bg-gray-800
                             border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3
                             transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="text-sm font-medium">{m.league.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {m.role === 'admin' ? 'Admin' : 'Jugador'} · {m.league.currency} {m.league.entry_fee}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600">
                      {m.league.invite_code.toUpperCase()}
                    </span>
                    <span className="text-gray-600">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl
                            p-6 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm text-gray-400 mb-3">No estás en ninguna liga todavía</div>
              <div className="flex gap-2 justify-center">
                <Link href="/leagues/new"
                  className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500
                             rounded-lg transition-colors">
                  Crear liga
                </Link>
                <Link href="/leagues/join"
                  className="text-xs px-4 py-2 border border-gray-700 text-gray-400
                             hover:border-gray-500 rounded-lg transition-colors">
                  Unirse con código
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Calendario de partidos */}
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Próximos partidos · Mundial 2026
          </h2>
          <div className="space-y-2">
            {matches?.map(m => (
              <div key={m.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={`https://flagcdn.com/w20/${m.home_flag}.png`}
                        width={18} height={13} className="rounded-sm flex-shrink-0"
                        alt={m.home_team}
                      //onError={(e: any) => e.target.style.display = 'none'}
                      />
                      <span className="text-sm truncate">{m.home_team}</span>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">vs</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm truncate text-right">{m.away_team}</span>
                      <img
                        src={`https://flagcdn.com/w20/${m.away_flag}.png`}
                        width={18} height={13} className="rounded-sm flex-shrink-0"
                        alt={m.away_team}
                      //onError={(e: any) => e.target.style.display = 'none'}
                      />
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    {m.status === 'finished' ? (
                      <span className="text-sm font-medium">
                        {m.home_score} – {m.away_score}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {m.group_stage && (
                  <div className="mt-1.5 text-xs text-gray-600">
                    Grupo {m.group_stage.replace('GROUP_', '')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
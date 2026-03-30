import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [leagueRes, membersRes, paymentsRes, profilesRes] = await Promise.all([
  supabase.from('leagues').select('*').eq('id', leagueId).single(),
  supabase
    .from('league_members')
    .select('id, role, status, user_id, joined_at')
    .eq('league_id', leagueId)
    .order('joined_at'),
  supabase
    .from('payments')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false }),
  supabase
    .from('profiles')
    .select('id, display_name, phone, email'),
])
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  if (!league) redirect('/')

  const { data: member } = await supabase
    .from('league_members')
    .select('role, status')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  // Si no es miembro → redirect
  if (!member) redirect('/')

  // Si está pendiente → mostrar pantalla de espera
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

  // Si fue rechazado
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

  // Aprobado — cargar datos completos
  const { data: members } = await supabase
    .from('league_members')
    .select('role, status, user_id')
    .eq('league_id', leagueId)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true })
    .limit(5)

  const isAdmin = member.role === 'admin'
  const approved = members?.filter(m => m.status === 'approved').length ?? 0
  const pending = members?.filter(m => m.status === 'pending').length ?? 0

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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{league.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {approved} jugadores · {league.currency} {league.entry_fee} entrada
          </p>
        </div>

        {/* Código solo para admin */}
        {isAdmin && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6">
            <div className="text-xs text-gray-400 mb-2">Código de invitación</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold tracking-widest text-blue-400">
                {league.invite_code.toUpperCase()}
              </span>
            </div>
            {pending > 0 && (
              <div className="mt-3 text-xs text-amber-400">
                {pending} jugador{pending > 1 ? 'es' : ''} esperando aprobación
              </div>
            )}
          </div>
        )}

        {/* Próximos partidos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">Próximos partidos</h2>
            <Link href={`/leagues/${leagueId}/predictions`}
              className="text-xs text-blue-400 hover:text-blue-300">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {matches?.map(m => (
              <div key={m.id}
                className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700
                           flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={`https://flagcdn.com/w20/${m.home_flag}.png`}
                    width={20} height={14} className="rounded-sm" alt={m.home_team} />
                  <span className="text-sm">{m.home_team}</span>
                  <span className="text-xs text-gray-500">vs</span>
                  <span className="text-sm">{m.away_team}</span>
                  <img src={`https://flagcdn.com/w20/${m.away_flag}.png`}
                    width={20} height={14} className="rounded-sm" alt={m.away_team} />
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón pronosticar */}
 
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
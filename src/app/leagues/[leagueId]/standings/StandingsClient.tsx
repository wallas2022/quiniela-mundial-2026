'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Standing = {
  user_id: string
  display_name: string
  total_points: number
  exact_scores: number
  correct_results: number
  played: number
  isMe: boolean
  rank: number
}

export default function StandingsClient({
  leagueId,
  leagueName,
  standings,
  totalPot,
  currency,
  isAdmin,
}: {
  leagueId: string
  leagueName: string
  standings: Standing[]
  totalPot: number
  currency: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const myRank = standings.find(s => s.isMe)

  async function handleRecalculate() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/admin/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId }),
      })
      const data = await res.json()

      if (data.error) {
        setSyncMsg(`Error: ${data.error}`)
        return
      }
      if (data.total_matches_with_score === 0) {
        setSyncMsg(`Sin partidos con marcador aún (${data.tournament})`)
        return
      }
      if (data.total_predictions_found === 0) {
        setSyncMsg(`${data.total_matches_with_score} partidos OK · pero nadie ha guardado pronósticos`)
        return
      }
      setSyncMsg(
        `✓ ${data.calculated} partidos · ${data.total_predictions_found} pronósticos recalculados`
      )
      router.refresh()
    } catch (e: any) {
      setSyncMsg(`Error: ${e.message}`)
    }
    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/leagues/${leagueId}`}
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← {leagueName}
        </Link>
        <span className="text-xs text-gray-500">Tabla de posiciones</span>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Jugadores</div>
            <div className="text-xl font-medium">{standings.length}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Pozo</div>
            <div className="text-xl font-medium">{currency} {totalPot}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Tu posición</div>
            <div className="text-xl font-medium">#{myRank?.rank ?? '—'}</div>
          </div>
        </div>

        {/* Botón recalcular — solo admin */}
        {isAdmin && (
          <div className="mb-5">
            <button
              onClick={handleRecalculate}
              disabled={syncing}
              className="w-full py-2.5 text-sm rounded-xl border border-gray-700
                         text-gray-300 hover:border-blue-600 hover:text-blue-400
                         transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {syncing
                ? <><span className="animate-spin">⟳</span> Calculando...</>
                : '⟳ Actualizar puntos'}
            </button>
            {syncMsg && (
              <div className={`mt-2 text-xs text-center px-3 py-2 rounded-lg
                ${syncMsg.startsWith('✓')
                  ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                  : syncMsg.startsWith('Error')
                    ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                    : 'bg-gray-800 text-gray-400'}`}>
                {syncMsg}
              </div>
            )}
          </div>
        )}

        {/* Tu posición destacada si no estás en top 3 */}
        {myRank && myRank.rank > 3 && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl
                          px-4 py-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-medium text-sm">#{myRank.rank}</span>
              <span className="text-sm text-blue-200">{myRank.display_name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-200">{myRank.total_points} pts</div>
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
                  {s.display_name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium truncate
                      ${s.isMe ? 'text-blue-200' : 'text-white'}`}>
                      {s.display_name}
                    </span>
                    {s.isMe && <span className="text-xs text-blue-400 flex-shrink-0">(vos)</span>}
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

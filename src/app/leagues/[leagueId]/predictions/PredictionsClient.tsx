'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Match = {
    id: string
    home_team: string
    away_team: string
    home_flag: string
    away_flag: string
    home_crest: string | null
    away_crest: string | null
    group_stage: string | null
    round: string
    kickoff_at: string
    home_score: number | null
    away_score: number | null
    status: string
}

type Prediction = {
    id: string
    match_id: string
    pred_home: number
    pred_away: number
    points_earned: number | null
}

function isLocked(match: Match, now: Date) {
    return match.status !== 'scheduled' || new Date(match.kickoff_at) <= now
}

function lockReason(match: Match, now: Date): string {
    if (match.status !== 'scheduled') return `status=${match.status}`
    if (new Date(match.kickoff_at) <= now) return 'kickoff pasado'
    return ''
}

function getCountdown(match: Match, now: Date): number | null {
    if (match.status !== 'scheduled') return null
    const secs = Math.floor((new Date(match.kickoff_at).getTime() - now.getTime()) / 1000)
    return secs > 0 && secs <= 60 ? secs : null
}

function TeamImg({ crest, flag, name }: { crest: string | null; flag: string; name: string }) {
    if (crest) {
        return (
            <img src={crest} width={28} height={28}
                className="object-contain rounded-sm flex-shrink-0"
                alt={name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
        )
    }
    return (
        <img src={`https://flagcdn.com/w40/${flag?.toLowerCase()}.png`}
            width={28} height={19}
            style={{ borderRadius: 3, objectFit: 'cover' }}
            alt={name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
    )
}

export default function PredictionsClient({
    upcomingMatches,
    pastMatches,
    predictions,
    leagueId,
    userId,
}: {
    upcomingMatches: Match[]
    pastMatches: Match[]
    predictions: Prediction[]
    leagueId: string
    userId: string
}) {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Tick cada segundo para el countdown y bloqueo dinámico
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    // Merge: upcoming first (asc), then past (desc)
    const allMatches = [...upcomingMatches, ...pastMatches]

    const [preds, setPreds] = useState<Record<string, { home: number; away: number }>>(() =>
        Object.fromEntries(allMatches.map(m => {
            const existing = predictions.find(p => p.match_id === m.id)
            return [m.id, { home: existing?.pred_home ?? 1, away: existing?.pred_away ?? 1 }]
        }))
    )

    const [saved, setSaved] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(allMatches.map(m => [m.id, !!predictions.find(p => p.match_id === m.id)]))
    )

    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [filter, setFilter] = useState<'active' | 'saved' | 'locked'>('active')
    const [debug, setDebug] = useState(false)

    async function handleSave(matchId: string) {
        const match = allMatches.find(m => m.id === matchId)
        if (!match || isLocked(match, now)) return

        setSaving(s => ({ ...s, [matchId]: true }))
        const pred = preds[matchId]

        const { error } = await supabase.from('predictions').upsert({
            user_id: userId,
            league_id: leagueId,
            match_id: matchId,
            pred_home: pred.home,
            pred_away: pred.away,
        }, { onConflict: 'user_id,league_id,match_id' })

        if (!error) setSaved(s => ({ ...s, [matchId]: true }))
        setSaving(s => ({ ...s, [matchId]: false }))
    }

    function handleChange(matchId: string, team: 'home' | 'away', delta: number) {
        setPreds(p => ({
            ...p,
            [matchId]: {
                ...p[matchId],
                [team]: Math.max(0, Math.min(20, (p[matchId]?.[team] ?? 1) + delta))
            }
        }))
        setSaved(s => ({ ...s, [matchId]: false }))
    }

    const visible = allMatches.filter(m => {
        if (filter === 'active') return !isLocked(m, now)
        if (filter === 'saved')  return saved[m.id]
        if (filter === 'locked') return isLocked(m, now)
        return true
    })

    const savedCount = allMatches.filter(m => saved[m.id]).length
    const totalPoints = predictions.reduce((acc, p) => acc + (p.points_earned ?? 0), 0)

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href={`/leagues/${leagueId}`}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    ← Volver a la liga
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDebug(d => !d)}
                        className={`text-xs px-2 py-1 rounded border transition-colors
                            ${debug
                                ? 'bg-yellow-900/50 border-yellow-700 text-yellow-400'
                                : 'border-gray-700 text-gray-600 hover:text-gray-400'}`}>
                        {debug ? 'debug ON' : 'debug'}
                    </button>
                    <div className="text-xs text-gray-500">
                        {savedCount}/{allMatches.length} guardados
                    </div>
                </div>
            </nav>

            <div className="max-w-lg mx-auto px-4 py-6">
                <div className="mb-5">
                    <h1 className="text-lg font-medium">Mis pronósticos</h1>
                    <p className="text-xs text-gray-400 mt-1">Mundial FIFA 2026</p>
                </div>

                {/* Resumen */}
                <div className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl
                        px-4 py-3 mb-5 text-xs text-gray-400">
                    <span>Total: <strong className="text-white">{allMatches.length}</strong></span>
                    <span>Guardados: <strong className="text-white">{savedCount}</strong></span>
                    <span>Puntos: <strong className="text-green-400">{totalPoints}</strong></span>
                </div>

                {/* Panel de diagnóstico */}
                {debug && (
                    <div className="mb-5 bg-yellow-950/40 border border-yellow-800/50 rounded-xl px-4 py-3 text-xs space-y-1">
                        <p className="text-yellow-400 font-semibold mb-2">Diagnóstico</p>
                        <p className="text-gray-400">upcomingMatches: <strong className="text-white">{upcomingMatches.length}</strong></p>
                        <p className="text-gray-400">pastMatches: <strong className="text-white">{pastMatches.length}</strong></p>
                        <p className="text-gray-400">predictions cargadas: <strong className="text-white">{predictions.length}</strong></p>
                        <p className="text-gray-400">userId: <strong className="text-white font-mono">{userId}</strong></p>
                        <p className="text-gray-400">leagueId: <strong className="text-white font-mono">{leagueId}</strong></p>
                        <p className="text-gray-400">Ahora (GT): <strong className="text-white">
                            {now.toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}
                        </strong></p>
                    </div>
                )}

                {/* Filtros */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {(['active', 'saved', 'locked'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                                ${filter === f
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                            {{ active: 'Activos', saved: 'Guardados', locked: 'Cerrados' }[f]}
                        </button>
                    ))}
                </div>

                {/* Estado vacío */}
                {allMatches.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-3xl mb-3">📭</div>
                        <p className="text-sm">No hay partidos para esta liga.</p>
                        <p className="text-xs mt-1 text-gray-600">
                            Revisa el torneo y rondas configuradas.
                        </p>
                        {!debug && (
                            <button onClick={() => setDebug(true)}
                                className="mt-4 text-xs text-yellow-500 underline">
                                Activar diagnóstico
                            </button>
                        )}
                    </div>
                )}

                {/* Partidos */}
                <div className="space-y-3">
                    {visible.map(m => {
                        const locked = isLocked(m, now)
                        const countdown = getCountdown(m, now)
                        const pred = preds[m.id] ?? { home: 1, away: 1 }
                        const isSaved = saved[m.id]
                        const isSaving = saving[m.id]
                        const existingPred = predictions.find(p => p.match_id === m.id)

                        return (
                            <div key={m.id}
                                className={`rounded-xl border p-4 bg-gray-900 transition-colors
                                    ${countdown
                                        ? 'border-orange-700'
                                        : isSaved ? 'border-green-800' : 'border-gray-800'}`}>

                                {/* Meta */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                        {m.group_stage
                                            ? `Grupo ${m.group_stage.replace('GROUP_', '')}`
                                            : m.round}
                                    </span>

                                    {countdown !== null ? (
                                        // Conteo regresivo — último minuto
                                        <span className="text-xs font-mono font-semibold text-orange-400 animate-pulse">
                                            🔒 {countdown}s
                                        </span>
                                    ) : locked ? (
                                        <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">
                                            Cerrado
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">
                                            {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                                timeZone: 'America/Guatemala'
                                            })}
                                        </span>
                                    )}
                                </div>

                                {/* Diagnóstico por tarjeta */}
                                {debug && (
                                    <div className="mb-2 px-2 py-1.5 bg-yellow-950/30 border border-yellow-900/40
                                            rounded text-[10px] text-yellow-300/70 font-mono space-y-0.5">
                                        <div>id: {m.id}</div>
                                        <div>status: <span className="text-yellow-300">{m.status}</span>
                                            {locked && <span className="text-red-400 ml-2">← bloqueado ({lockReason(m, now)})</span>}
                                        </div>
                                        <div>kickoff: {new Date(m.kickoff_at).toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}</div>
                                        {countdown !== null && (
                                            <div className="text-orange-300">countdown: {countdown}s</div>
                                        )}
                                        <div>prediction: {existingPred
                                            ? <span className="text-green-300">{existingPred.pred_home}–{existingPred.pred_away}
                                                {existingPred.points_earned !== null && ` · ${existingPred.points_earned} pts`}
                                              </span>
                                            : <span className="text-red-400">sin pronóstico</span>
                                        }</div>
                                    </div>
                                )}

                                {/* Equipos + inputs */}
                                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <TeamImg crest={m.home_crest} flag={m.home_flag} name={m.home_team} />
                                        <span className="text-sm font-medium truncate">{m.home_team}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Controles equipo local */}
                                        <button disabled={locked || pred.home <= 0}
                                            onClick={() => handleChange(m.id, 'home', -1)}
                                            className="w-7 h-7 rounded-md bg-gray-800 hover:bg-gray-700
                                                disabled:opacity-30 transition-colors text-base font-medium">
                                            −
                                        </button>
                                        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center
                                                justify-center text-lg font-medium select-none">
                                            {pred.home}
                                        </div>
                                        <button disabled={locked || pred.home >= 20}
                                            onClick={() => handleChange(m.id, 'home', 1)}
                                            className="w-7 h-7 rounded-md bg-gray-800 hover:bg-gray-700
                                                disabled:opacity-30 transition-colors text-base font-medium">
                                            +
                                        </button>

                                        <span className="text-gray-600 text-xs mx-1">–</span>

                                        {/* Controles equipo visitante */}
                                        <button disabled={locked || pred.away <= 0}
                                            onClick={() => handleChange(m.id, 'away', -1)}
                                            className="w-7 h-7 rounded-md bg-gray-800 hover:bg-gray-700
                                                disabled:opacity-30 transition-colors text-base font-medium">
                                            −
                                        </button>
                                        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center
                                                justify-center text-lg font-medium select-none">
                                            {pred.away}
                                        </div>
                                        <button disabled={locked || pred.away >= 20}
                                            onClick={() => handleChange(m.id, 'away', 1)}
                                            className="w-7 h-7 rounded-md bg-gray-800 hover:bg-gray-700
                                                disabled:opacity-30 transition-colors text-base font-medium">
                                            +
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="text-sm font-medium truncate text-right">
                                            {m.away_team}
                                        </span>
                                        <TeamImg crest={m.away_crest} flag={m.away_flag} name={m.away_team} />
                                    </div>
                                </div>

                                {/* Resultado real */}
                                {m.status === 'finished' && m.home_score !== null && (
                                    <div className="mt-2 text-xs text-center text-gray-500">
                                        Resultado: <strong className="text-gray-300">
                                            {m.home_score}–{m.away_score}
                                        </strong>
                                        {existingPred?.points_earned !== null && existingPred?.points_earned !== undefined && (
                                            <span className={`ml-2 font-semibold
                                                ${existingPred.points_earned > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                                · {existingPred.points_earned} pts
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Footer: solo para partidos no cerrados */}
                                {!locked && (
                                    <div className="flex items-center justify-between mt-3 pt-3
                                            border-t border-gray-800">
                                        <span className="text-xs text-gray-500">
                                            {pred.home > pred.away ? `Gana ${m.home_team}`
                                                : pred.away > pred.home ? `Gana ${m.away_team}`
                                                    : 'Empate'} · máx 5 pts
                                        </span>
                                        <button onClick={() => handleSave(m.id)} disabled={isSaving}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                                                ${isSaved
                                                    ? 'bg-green-900/50 text-green-400 border-green-800'
                                                    : 'border-gray-700 text-gray-400 hover:bg-green-900/50 hover:text-green-400 hover:border-green-800'}`}>
                                            {isSaving ? '...' : isSaved ? 'Guardado ✓' : 'Guardar'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Match = {
    id: string
    home_team: string
    away_team: string
    home_flag: string
    away_flag: string
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

function isLocked(match: Match) {
    return match.status !== 'scheduled' || new Date(match.kickoff_at) <= new Date()
}

function FlagImg({ code, name }: { code: string; name: string }) {
    return (
        <img
            src={`https://flagcdn.com/w40/${code?.toLowerCase()}.png`}
            width={28} height={19}
            style={{ borderRadius: 3, objectFit: 'cover' }}
            alt={name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
    )
}

export default function PredictionsClient({
    matches,
    predictions,
    leagueId,
    userId,
}: {
    matches: Match[]
    predictions: Prediction[]
    leagueId: string
    userId: string
}) {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const [preds, setPreds] = useState<Record<string, { home: number; away: number }>>(() =>
        Object.fromEntries(matches.map(m => {
            const existing = predictions.find(p => p.match_id === m.id)
            return [m.id, { home: existing?.pred_home ?? 1, away: existing?.pred_away ?? 1 }]
        }))
    )

    const [saved, setSaved] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(matches.map(m => [m.id, !!predictions.find(p => p.match_id === m.id)]))
    )

    const [saving, setSaving] = useState<Record<string, boolean>>({})
    const [filter, setFilter] = useState<'all' | 'pending' | 'saved' | 'locked'>('all')

    async function handleSave(matchId: string) {
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

    const visible = matches.filter(m => {
        if (filter === 'pending') return !saved[m.id] && !isLocked(m)
        if (filter === 'saved') return saved[m.id]
        if (filter === 'locked') return isLocked(m)
        return true
    })

    const savedCount = matches.filter(m => saved[m.id]).length

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href={`/leagues/${leagueId}`}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    ← Volver a la liga
                </Link>
                <div className="text-xs text-gray-500">
                    {savedCount}/{matches.length} guardados
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
                    <span>Total: <strong className="text-white">{matches.length}</strong></span>
                    <span>Guardados: <strong className="text-white">{savedCount}</strong></span>
                    <span>Pts potenciales: <strong className="text-green-400">{savedCount * 5}</strong></span>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {(['all', 'pending', 'saved', 'locked'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                ${filter === f
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                            {{ all: 'Todos', pending: 'Sin guardar', saved: 'Guardados', locked: 'Cerrados' }[f]}
                        </button>
                    ))}
                </div>

                {/* Partidos */}
                <div className="space-y-3">
                    {visible.map(m => {
                        const locked = isLocked(m)
                        const pred = preds[m.id] ?? { home: 1, away: 1 }
                        const isSaved = saved[m.id]
                        const isSaving = saving[m.id]

                        return (
                            <div key={m.id}
                                className={`rounded-xl border p-4 bg-gray-900 transition-colors
                  ${isSaved ? 'border-green-800' : 'border-gray-800'}
                  ${locked ? 'opacity-60' : ''}`}>

                                {/* Meta */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                        {m.group_stage
                                            ? `Grupo ${m.group_stage.replace('GROUP_', '')}`
                                            : m.round}
                                    </span>
                                    {locked
                                        ? <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">
                                            Cerrado
                                        </span>
                                        : <span className="text-xs text-gray-500">
                                            {new Date(m.kickoff_at).toLocaleDateString('es-GT', {
                                        month:'short', day:'numeric',
                                        hour:'2-digit', minute:'2-digit',
                                        timeZone: 'America/Guatemala'  // ← agregar esto
                                        })}
                                        </span>
                                    }
                                </div>

                                {/* Equipos + inputs */}
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <FlagImg code={m.home_flag} name={m.home_team} />
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
                                        <FlagImg code={m.away_flag} name={m.away_team} />
                                    </div>
                                </div>

                                {/* Resultado real */}
                                {m.status === 'finished' && m.home_score !== null && (
                                    <div className="mt-2 text-xs text-center text-gray-500">
                                        Resultado: <strong className="text-gray-300">
                                            {m.home_score}–{m.away_score}
                                        </strong>
                                    </div>
                                )}

                                {/* Footer */}
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
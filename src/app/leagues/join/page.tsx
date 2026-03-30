'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinLeaguePage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const router = useRouter()

    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [league, setLeague] = useState<any>(null)
    const [joining, setJoining] = useState(false)
    const [joined, setJoined] = useState(false)

    async function handleSearch() {
        if (!code.trim()) return
        setLoading(true)
        setError('')
        setLeague(null)

        const { data, error } = await supabase
            .from('leagues')
            .select('id, name, entry_fee, currency, rules_json')
            .eq('invite_code', code.trim().toLowerCase())
            .single()

        if (error || !data) {
            setError('Código inválido — verificá que esté bien escrito')
        } else {
            setLeague(data)
        }
        setLoading(false)
    }

    async function handleJoin() {
        if (!league) return
        setJoining(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Verificar si ya es miembro
        const { data: existing } = await supabase
            .from('league_members')
            .select('id, status')
            .eq('league_id', league.id)
            .eq('user_id', user.id)
            .single()

        if (existing) {
            if (existing.status === 'approved') {
                router.push(`/leagues/${league.id}`)
                return
            }
            if (existing.status === 'pending') {
                setError('Ya enviaste solicitud — esperá que el admin te apruebe')
                setJoining(false)
                return
            }
        }

        // Insertar como miembro pendiente
        const { error: joinError } = await supabase
            .from('league_members')
            .insert({
                league_id: league.id,
                user_id: user.id,
                role: 'player',
                status: 'pending',
            })

        if (joinError) {
            setError('Error al unirse: ' + joinError.message)
        } else {
            setJoined(true)
        }
        setJoining(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                <div className="mb-8">
                    <Link href="/"
                        className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
                        ← Volver
                    </Link>
                    <h1 className="text-xl font-semibold">Unirse a liga</h1>
                    <p className="text-sm text-gray-400 mt-1">Ingresá el código de invitación</p>
                </div>

                {/* Búsqueda por código */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Ej: 1F8201E3"
                        value={code}
                        onChange={e => {
                            setCode(e.target.value.toUpperCase())
                            setLeague(null)
                            setError('')
                            setJoined(false)
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        maxLength={8}
                        className="flex-1 px-4 py-3 text-sm bg-gray-800 border border-gray-700
                       rounded-xl focus:outline-none focus:border-blue-500
                       font-mono tracking-widest uppercase transition"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading || !code.trim()}
                        className="px-4 py-3 text-sm bg-blue-600 hover:bg-blue-500 rounded-xl
                       disabled:opacity-50 transition-colors font-medium">
                        {loading ? '...' : 'Buscar'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4">
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}

                {/* Liga encontrada */}
                {league && !joined && (
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Liga encontrada</div>
                                <div className="text-lg font-semibold">{league.name}</div>
                            </div>
                            <div className="text-2xl">🏆</div>
                        </div>

                        <div className="space-y-2 mb-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Entrada</span>
                                <span className="font-medium">{league.currency} {league.entry_fee}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Marcador exacto</span>
                                <span className="text-green-400 font-medium">
                                    +{league.rules_json?.exact_score ?? 5} pts
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Resultado correcto</span>
                                <span className="text-blue-400 font-medium">
                                    +{league.rules_json?.correct_result ?? 3} pts
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500
                         rounded-xl transition-colors disabled:opacity-50">
                            {joining ? 'Uniéndose...' : 'Unirse a esta liga'}
                        </button>
                    </div>
                )}

                {/* Éxito */}
                {joined && (
                    <div className="bg-green-900/30 border border-green-800 rounded-2xl p-6 text-center">
                        <div className="text-3xl mb-3">✅</div>
                        <div className="font-medium mb-1">Solicitud enviada</div>
                        <p className="text-sm text-gray-400 mb-4">
                            El admin de la liga debe aprobarte para que puedas pronosticar.
                        </p>
                        <Link href="/"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            Volver al inicio
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { addLeagueMember } from '../actions'

export default function NewLeaguePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const [name, setName]         = useState('')
  const [fee, setFee]           = useState('50')
  const [currency, setCurrency] = useState('GTQ')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Ingresá un nombre para la liga'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Crear liga
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name:       name.trim(),
        entry_fee:  parseFloat(fee) || 0,
        currency,
        created_by: user.id,
      })
      .select()
      .single()

    if (leagueError) { setError(leagueError.message); setLoading(false); return }

    try {
  await addLeagueMember(league.id, user.id)
} catch (e: any) {
  setError('Error al configurar la liga: ' + e.message)
  setLoading(false)
  return
}
    router.push(`/leagues/${league.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <button onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            ← Volver
          </button>
          <h1 className="text-xl font-semibold">Crear liga</h1>
          <p className="text-sm text-gray-400 mt-1">Configurá tu quiniela del Mundial</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nombre de la liga</label>
            <input
              type="text"
              placeholder="Ej: Liga Familiar 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                         rounded-xl focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Costo de entrada</label>
              <input
                type="number"
                value={fee}
                onChange={e => setFee(e.target.value)}
                min="0"
                className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                           rounded-xl focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Moneda</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                           rounded-xl focus:outline-none focus:border-blue-500 transition"
              >
                <option value="GTQ">GTQ</option>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="HNL">HNL</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-xs text-gray-400 mb-2">Puntuación</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Marcador exacto</span>
                <span className="text-green-400 font-medium">+5 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Resultado correcto</span>
                <span className="text-blue-400 font-medium">+3 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Diferencia exacta</span>
                <span className="text-yellow-400 font-medium">+1 pt</span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full mt-6 py-3 text-sm font-medium bg-blue-600 rounded-xl
                     hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear liga'}
        </button>

      </div>
    </div>
  )
}
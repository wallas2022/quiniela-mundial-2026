'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'

export default function LeagueDetailPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string

  const [league, setLeague] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeague()
  }, [])

  async function fetchLeague() {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single()

    if (error) {
      console.error(error)
      router.push('/dashboard')
      return
    }

    setLeague(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-white p-6">Cargando liga...</div>
  }

  if (!league) {
    return <div className="text-white p-6">Liga no encontrada</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-semibold">{league.name}</h1>

      <p className="text-gray-400 mt-2">
        Entrada: {league.entry_fee} {league.currency}
      </p>

      <div className="mt-6">
        <h2 className="text-lg font-medium">Información</h2>

        <div className="mt-3 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-300">
            ID: {league.id}
          </p>
          <p className="text-sm text-gray-300">
            Creado por: {league.created_by}
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const [profile, setProfile]       = useState<any>(null)
  const [name, setName]             = useState('')
  const [phone, setPhone]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setName(data.display_name ?? '')
      setPhone(data.phone ?? '')
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id:           user.id,
        display_name: name.trim(),
        phone:        phone.trim(),
        updated_at:   new Date().toISOString(),
      })

    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Inicio
        </Link>
        <span className="text-xs text-gray-500">Mi perfil</span>
      </nav>

      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center
                          justify-center text-xl font-medium text-blue-300 mx-auto mb-4">
            {name?.slice(0,2).toUpperCase() || '??'}
          </div>
          <h1 className="text-xl font-medium text-center">{name || 'Mi perfil'}</h1>
          <p className="text-sm text-gray-500 text-center mt-1">{profile?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                         rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500
                         transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+502 5555 1234"
              className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                         rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500
                         transition"
            />
            <p className="text-xs text-gray-600 mt-1">
              Para notificaciones de resultados
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700
                         rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full mt-6 py-3 text-sm font-medium rounded-xl transition-all
            ${saved
              ? 'bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'}`}>
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>

        {/* Cerrar sesión */}
        <form action="/auth/logout" method="post" className="mt-4">
          <button
            className="w-full py-3 text-sm text-gray-500 hover:text-red-400
                       border border-gray-800 rounded-xl transition-colors">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const [phone, setPhone] = useState('')

  async function handleSubmit() {
  setLoading(true)
  setError('')
  setMessage('')

  if (mode === 'register') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } }
    })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id:           data.user.id,
        display_name: name,
        email:        email,
        phone:        phone,
      })
    }
    setMessage('Revisá tu email para confirmar la cuenta')

  } else {
    // ← este bloque faltaba
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
    else router.push('/')
  }

  setLoading(false)
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 text-white">
      <div className="w-full max-w-sm bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-700 p-8 shadow-xl transition-all duration-300 hover:scale-[1.01]">

        <div className="text-center mb-8">
          <div className="text-3xl mb-2">⚽</div>
          <h1 className="text-xl font-semibold">Quiniela Mundial 2026</h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
          </p>
        </div>

        <div className="space-y-3">
         {mode === 'register' && (
  <>
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                          rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <input
                type="tel"
                placeholder="Teléfono (ej: +502 5555 1234)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-gray-800 border border-gray-700
                          rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-gray-700 border border-gray-600
                       rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 text-sm bg-gray-700 border border-gray-600
                       rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {error   && <p className="text-xs text-red-400 mt-3 animate-pulse">{error}</p>}
        {message && <p className="text-xs text-green-400 mt-3">{message}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password || (mode === 'register' && !name)}
          className="w-full mt-5 py-3 text-sm font-medium bg-blue-600 rounded-xl
                     hover:bg-blue-500 active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-5">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
          {' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-blue-400 hover:underline"
          >
            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>

      </div>
    </div>
  )
}
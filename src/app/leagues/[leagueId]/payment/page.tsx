'use client'
import { useState, useEffect, use } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentPage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {

  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const { leagueId } = use(params)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  const [league, setLeague]         = useState<any>(null)
  const [payment, setPayment]       = useState<any>(null)
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [leagueRes, paymentRes] = await Promise.all([
      supabase.from('leagues').select('name, entry_fee, currency')
        .eq('id', leagueId).single(),
      supabase.from('payments').select('*')
        .eq('league_id', leagueId)
        .eq('user_id', user.id)
        .single(),
    ])

    setLeague(leagueRes.data)
    setPayment(paymentRes.data)
    setLoading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar 5MB')
      return
    }

    setFile(f)
    setError('')

    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Subir archivo al Storage
    const ext      = file.name.split('.').pop()
    const filePath = `${user.id}/${leagueId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('vouchers')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError('Error al subir el archivo: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Guardar registro en payments
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert({
        user_id:     user.id,
        league_id:   leagueId,
        amount:      league.entry_fee,
        voucher_url: filePath,
        status:      'pending',
      }, { onConflict: 'user_id,league_id' })

    if (paymentError) {
      setError('Error al registrar el pago: ' + paymentError.message)
      setUploading(false)
      return
    }

    setSuccess(true)
    setUploading(false)
    await loadData()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/leagues/${leagueId}`}
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← {league?.name}
        </Link>
      </nav>
       {reason === 'no_payment' && (
        <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <p className="text-sm text-amber-300">
              Necesitás tener el pago aprobado para poder pronosticar.
              Subí tu comprobante y esperá la confirmación del admin.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-sm mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-medium">Comprobante de pago</h1>
          <p className="text-sm text-gray-400 mt-1">
            Subí tu comprobante para que el admin lo verifique
          </p>
        </div>

        {/* Info del pago */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Liga</span>
            <span className="font-medium">{league?.name}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Monto a pagar</span>
            <span className="text-green-400 font-medium text-lg">
              {league?.currency} {league?.entry_fee}
            </span>
          </div>
        </div>

        {/* Estado del pago existente */}
        {payment && (
          <div className={`rounded-xl border p-4 mb-6
            ${payment.status === 'approved'
              ? 'bg-green-900/30 border-green-800'
              : payment.status === 'rejected'
              ? 'bg-red-900/30 border-red-800'
              : 'bg-amber-900/30 border-amber-800'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {payment.status === 'approved' ? '✅'
                 : payment.status === 'rejected' ? '❌'
                 : '⏳'}
              </span>
              <span className="font-medium text-sm">
                {payment.status === 'approved' ? 'Pago aprobado'
                 : payment.status === 'rejected' ? 'Pago rechazado'
                 : 'Pago pendiente de revisión'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {payment.status === 'approved'
                ? 'Tu pago fue verificado. El admin debe aprobarte para pronosticar.'
                : payment.status === 'rejected'
                ? 'Tu comprobante fue rechazado. Podés subir uno nuevo.'
                : 'El admin revisará tu comprobante pronto.'}
            </p>
            {payment.notes && (
              <p className="text-xs text-amber-400 mt-2">
                Nota del admin: {payment.notes}
              </p>
            )}
          </div>
        )}

        {/* Formulario de upload */}
        {(!payment || payment.status === 'rejected') && !success && (
          <div>
            <div
              onClick={() => document.getElementById('file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-colors mb-4
                ${file
                  ? 'border-blue-600 bg-blue-950/30'
                  : 'border-gray-700 hover:border-gray-500'}`}>

              {preview ? (
                <img src={preview} alt="preview"
                  className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : file ? (
                <div>
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm text-blue-400">{file.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📷</div>
                  <div className="text-sm text-gray-400 mb-1">
                    Tocá para subir tu comprobante
                  </div>
                  <div className="text-xs text-gray-600">
                    JPG, PNG o PDF · máx 5MB
                  </div>
                </div>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500
                         rounded-xl transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed">
              {uploading ? 'Subiendo...' : 'Enviar comprobante'}
            </button>
          </div>
        )}

        {/* Éxito */}
        {success && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-medium mb-2">Comprobante enviado</div>
            <p className="text-sm text-gray-400 mb-6">
              El admin revisará tu pago y te habilitará para pronosticar.
            </p>
            <Link href={`/leagues/${leagueId}`}
              className="text-sm text-blue-400 hover:text-blue-300">
              Volver a la liga
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Member = {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
}

type Payment = {
  id: string
  user_id: string
  amount: number
  status: string
  voucher_url: string | null
  notes: string | null
  created_at: string
}

type League = {
  id: string
  name: string
  invite_code: string
  entry_fee: number
  currency: string
  rules_json: any
}

type Profile = {
  id: string
  display_name: string | null
  phone: string | null
  email: string | null
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'text-green-400',
    pending:  'text-amber-400',
    rejected: 'text-red-400',
  }
  const labels: Record<string, string> = {
    approved: 'Aprobado',
    pending:  'Pendiente',
    rejected: 'Rechazado',
  }
  return (
    <span className={`text-xs ${styles[status] ?? 'text-gray-400'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function VoucherModal({
  url, onClose, onApprove, onReject, status, isPending,
}: {
  url: string
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  status: string
  isPending: boolean
}) {
  const isPdf = url.toLowerCase().includes('.pdf')
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg
                      max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <span className="font-medium text-sm">Comprobante de pago</span>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isPdf ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-sm text-gray-400 mb-4">Archivo PDF</p>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline">
                Abrir PDF en nueva pestaña
              </a>
            </div>
          ) : (
            <img src={url} alt="Comprobante"
              className="w-full rounded-xl object-contain max-h-96" />
          )}
        </div>
        {status === 'pending' && (
          <div className="flex gap-3 px-5 py-4 border-t border-gray-800">
            <button onClick={onReject} disabled={isPending}
              className="flex-1 py-2.5 text-sm rounded-xl border border-red-900
                         text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50">
              ✗ Rechazar pago
            </button>
            <button onClick={onApprove} disabled={isPending}
              className="flex-1 py-2.5 text-sm rounded-xl bg-green-700 hover:bg-green-600
                         text-white font-medium transition-colors disabled:opacity-50">
              ✓ Aprobar pago
            </button>
          </div>
        )}
        {status === 'approved' && (
          <div className="px-5 py-4 border-t border-gray-800 text-center text-sm text-green-400">
            ✓ Este pago ya fue aprobado
          </div>
        )}
        {status === 'rejected' && (
          <div className="px-5 py-4 border-t border-gray-800 text-center text-sm text-red-400">
            ✗ Este pago fue rechazado
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminClient({
  league, members, payments, profiles, leagueId, adminId,
}: {
  league: League
  members: Member[]
  payments: Payment[]
  profiles: Profile[]
  leagueId: string
  adminId: string
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [tab, setTab]                       = useState<'members'|'payments'|'pozo'>('members')
  const [isPending, start]                  = useTransition()
  const [localMembers, setLocalMembers]     = useState(members)
  const [localPayments, setLocalPayments]   = useState(payments)
  const [modalUrl, setModalUrl]             = useState<string | null>(null)
  const [modalPaymentId, setModalPaymentId] = useState<string | null>(null)
  const [modalStatus, setModalStatus]       = useState<string>('')

  const approved    = localMembers.filter(m => m.status === 'approved').length
  const pending     = localMembers.filter(m => m.status === 'pending').length
  const pendingPays = localPayments.filter(p => p.status === 'pending').length
  const pozo        = localPayments
    .filter(p => p.status === 'approved')
    .reduce((a, p) => a + p.amount, 0)

  function getName(userId: string) {
    return profiles.find(p => p.id === userId)?.display_name ?? userId.slice(0,8) + '...'
  }

  function getPhone(userId: string) {
    return profiles.find(p => p.id === userId)?.phone ?? '—'
  }

  async function updateMember(memberId: string, status: string) {
    start(async () => {
      await supabase.from('league_members').update({ status }).eq('id', memberId)
      setLocalMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m))
    })
  }

  async function updatePayment(paymentId: string, status: string) {
    start(async () => {
      await supabase.from('payments')
        .update({ status, reviewed_by: adminId }).eq('id', paymentId)
      setLocalPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p))
      setModalStatus(status)
      if (status !== 'pending') setModalUrl(null)
    })
  }

  function isLocked(match: Math): boolean {
  const kickoff  = new Date(match.kickoff_at)
  const oneMin   = 1 * 60 * 1000
  const lockTime = new Date(kickoff.getTime() - oneMin)
  
  return (
    match.status !== 'scheduled' ||
    new Date() >= lockTime
  )
}

  async function openVoucher(payment: Payment) {
    if (!payment.voucher_url) return
    const { data } = await supabase.storage
      .from('vouchers').createSignedUrl(payment.voucher_url, 120)
    if (data?.signedUrl) {
      setModalUrl(data.signedUrl)
      setModalPaymentId(payment.id)
      setModalStatus(payment.status)
    }
  }

  const TABS = ['members', 'payments', 'pozo'] as const
  const TAB_LABELS = { members: 'Jugadores', payments: 'Depósitos', pozo: 'Pozo' }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {modalUrl && modalPaymentId && (
        <VoucherModal
          url={modalUrl}
          status={modalStatus}
          isPending={isPending}
          onClose={() => setModalUrl(null)}
          onApprove={() => updatePayment(modalPaymentId, 'approved')}
          onReject={() => updatePayment(modalPaymentId, 'rejected')}
        />
      )}

      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/leagues/${leagueId}`}
          className="text-sm text-gray-400 hover:text-white transition-colors">
          ← {league.name}
        </Link>
        <span className="text-xs text-gray-500">Panel admin</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:'Jugadores', value: approved,                         sub: `${pending} pendientes` },
            { label:'Pozo',      value: `${league.currency} ${pozo}`,     sub: `${approved} aprobados` },
            { label:'Código',    value: league.invite_code.toUpperCase(), sub: 'invitación' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-base font-medium font-mono">{s.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-0.5 border-b border-gray-800 mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm px-4 py-2 border-b-2 transition-colors
                ${tab === t ? 'border-white text-white font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {TAB_LABELS[t]}
              {t === 'members' && pending > 0 && (
                <span className="ml-1.5 text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
                  {pending}
                </span>
              )}
              {t === 'payments' && pendingPays > 0 && (
                <span className="ml-1.5 text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
                  {pendingPays}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* JUGADORES */}
        {tab === 'members' && (
          <div className="space-y-2">
            {localMembers.map(m => (
              <div key={m.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3
                           flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center
                                  justify-center text-xs font-medium text-blue-300">
                    {getName(m.user_id).slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {getName(m.user_id)}
                      {m.role === 'admin' && (
                        <span className="ml-1.5 text-xs text-blue-400">admin</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      {getPhone(m.user_id) !== '—' && (
                        <span className="text-xs text-gray-600">
                          {getPhone(m.user_id)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {m.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateMember(m.id, 'approved')}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-lg border border-green-800
                                 text-green-400 hover:bg-green-900/50 transition-colors
                                 disabled:opacity-50">
                      Aprobar
                    </button>
                    <button onClick={() => updateMember(m.id, 'rejected')}
                      disabled={isPending}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-900
                                 text-red-400 hover:bg-red-900/50 transition-colors
                                 disabled:opacity-50">
                      Rechazar
                    </button>
                  </div>
                )}
                {m.status === 'approved' && m.role !== 'admin' && (
                  <button onClick={() => updateMember(m.id, 'rejected')}
                    disabled={isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-700
                               text-gray-500 hover:border-red-900 hover:text-red-400
                               transition-colors disabled:opacity-50">
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DEPÓSITOS */}
        {tab === 'payments' && (
          <div>
            {localPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-600 text-sm">
                No hay comprobantes todavía
              </div>
            ) : (
              <div className="space-y-3">
                {localPayments.map(p => (
                  <div key={p.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {league.currency} {p.amount}
                          </span>
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="text-sm font-medium text-gray-300">
                          {getName(p.user_id)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getPhone(p.user_id)} ·{' '}
                          {new Date(p.created_at).toLocaleDateString('es-GT', {
                            day:'numeric', month:'short',
                            hour:'2-digit', minute:'2-digit'
                          })}
                        </div>
                      </div>
                      {p.voucher_url && (
                        <button onClick={() => openVoucher(p)}
                          className="text-xs px-3 py-2 rounded-lg border border-gray-700
                                     text-gray-400 hover:border-blue-600 hover:text-blue-400
                                     transition-colors flex-shrink-0">
                          Ver boleta
                        </button>
                      )}
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                        <button onClick={() => updatePayment(p.id, 'rejected')}
                          disabled={isPending}
                          className="flex-1 text-xs py-2 rounded-lg border border-red-900
                                     text-red-400 hover:bg-red-900/50 transition-colors
                                     disabled:opacity-50">
                          ✗ Rechazar
                        </button>
                        <button onClick={() => updatePayment(p.id, 'approved')}
                          disabled={isPending}
                          className="flex-1 text-xs py-2 rounded-lg bg-green-700
                                     hover:bg-green-600 text-white font-medium
                                     transition-colors disabled:opacity-50">
                          ✓ Aprobar pago
                        </button>
                      </div>
                    )}
                    {p.status === 'approved' && (
                      <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-green-400">
                        ✓ Pago aprobado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POZO */}
        {tab === 'pozo' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                <span className="text-gray-400">Entradas aprobadas ({approved})</span>
                <span className="font-medium text-green-400">
                  + {league.currency} {approved * league.entry_fee}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                <span className="text-gray-400">Premios pagados</span>
                <span className="text-red-400">− {league.currency} 0</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Total disponible</span>
                <span className="text-xl font-semibold text-green-400">
                  {league.currency} {pozo}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              Exacto +{league.rules_json?.exact_score} pts ·
              resultado +{league.rules_json?.correct_result} pts ·
              diferencia +{league.rules_json?.goal_diff} pts
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
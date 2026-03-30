'use client'
import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function AdminClient({
    league,
    members,
    payments,
    leagueId,
    adminId,
}: {
    league: League
    members: Member[]
    payments: Payment[]
    leagueId: string
    adminId: string
}) {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const router = useRouter()
    const [tab, setTab] = useState<'members' | 'payments' | 'pozo'>('members')
    const [isPending, start] = useTransition()
    const [localMembers, setLocalMembers] = useState(members)
    const [localPayments, setLocalPayments] = useState(payments)

    const approved = localMembers.filter(m => m.status === 'approved').length
    const pending = localMembers.filter(m => m.status === 'pending').length
    const pozo = localPayments
        .filter(p => p.status === 'approved')
        .reduce((a, p) => a + p.amount, 0)

    async function updateMember(memberId: string, status: string) {
        start(async () => {
            await supabase
                .from('league_members')
                .update({ status })
                .eq('id', memberId)
            setLocalMembers(prev =>
                prev.map(m => m.id === memberId ? { ...m, status } : m)
            )
        })
    }

   async function updatePayment(paymentId: string, status: string) {
        start(async () => {
            await supabase
            .from('payments')
            .update({ status, reviewed_by: adminId })
            .eq('id', paymentId)

            setLocalPayments(prev =>
            prev.map(p => p.id === paymentId ? { ...p, status } : p)
            )
        })
        }

        async function getVoucherUrl(voucherPath: string) {
        const { data } = await supabase.storage
            .from('vouchers')
            .createSignedUrl(voucherPath, 60) // URL válida por 60 segundos
        return data?.signedUrl
        }

        async function viewVoucher(voucherPath: string) {
        const url = await getVoucherUrl(voucherPath)
        if (url) window.open(url, '_blank')
        }
    const TABS = ['members', 'payments', 'pozo'] as const
    const TAB_LABELS = { members: 'Jugadores', payments: 'Depósitos', pozo: 'Pozo' }

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href={`/leagues/${leagueId}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors">
                    ← {league.name}
                </Link>
                <span className="text-xs text-gray-500">Panel admin</span>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Jugadores', value: approved, sub: `${pending} pendientes` },
                        { label: 'Pozo', value: `${league.currency} ${pozo}`, sub: `${approved} aprobados` },
                        { label: 'Código', value: league.invite_code.toUpperCase(), sub: 'invitación' },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                            <div className="text-base font-medium font-mono">{s.value}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-0.5 border-b border-gray-800 mb-5">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`text-sm px-4 py-2 border-b-2 transition-colors
                ${tab === t
                                    ? 'border-white text-white font-medium'
                                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                            {TAB_LABELS[t]}
                            {t === 'members' && pending > 0 && (
                                <span className="ml-1.5 text-xs bg-amber-600 text-white
                                 px-1.5 py-0.5 rounded-full">
                                    {pending}
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
                                        {m.user_id.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">
                                            {m.user_id.slice(0, 8)}...
                                            {m.role === 'admin' && (
                                                <span className="ml-1.5 text-xs text-blue-400">admin</span>
                                            )}
                                        </div>
                                        <StatusBadge status={m.status} />
                                    </div>
                                </div>
                                {m.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateMember(m.id, 'approved')}
                                            disabled={isPending}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-green-800
                                 text-green-400 hover:bg-green-900/50 transition-colors
                                 disabled:opacity-50">
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => updateMember(m.id, 'rejected')}
                                            disabled={isPending}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-red-900
                                 text-red-400 hover:bg-red-900/50 transition-colors
                                 disabled:opacity-50">
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                                {m.status === 'approved' && m.role !== 'admin' && (
                                    <button
                                        onClick={() => updateMember(m.id, 'rejected')}
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
                            <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                    {league.currency} {p.amount}
                                </span>
                                <StatusBadge status={p.status} />
                                </div>
                                <div className="text-xs text-gray-500">
                                {new Date(p.created_at).toLocaleDateString('es-GT', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                Usuario: {p.user_id.slice(0, 12)}...
                                </div>
                            </div>

                            {/* Botón ver comprobante */}
                            {p.voucher_url && (
                                <button
                                onClick={() => viewVoucher(p.voucher_url!)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-700
                                            text-gray-400 hover:border-blue-700 hover:text-blue-400
                                            transition-colors flex-shrink-0">
                                Ver boleta
                                </button>
                            )}
                            </div>

                            {/* Acciones */}
                            {p.status === 'pending' && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                                <button
                                onClick={() => updatePayment(p.id, 'approved')}
                                disabled={isPending}
                                className="flex-1 text-xs py-2 rounded-lg border border-green-800
                                            text-green-400 hover:bg-green-900/50 transition-colors
                                            disabled:opacity-50">
                                ✓ Aprobar pago
                                </button>
                                <button
                                onClick={() => updatePayment(p.id, 'rejected')}
                                disabled={isPending}
                                className="flex-1 text-xs py-2 rounded-lg border border-red-900
                                            text-red-400 hover:bg-red-900/50 transition-colors
                                            disabled:opacity-50">
                                ✗ Rechazar
                                </button>
                            </div>
                            )}

                            {p.status === 'approved' && (
                            <div className="mt-2 text-xs text-green-400">
                                ✓ Pago verificado
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
                            Reglas: exacto +{league.rules_json?.exact_score} pts ·
                            resultado +{league.rules_json?.correct_result} pts ·
                            diferencia +{league.rules_json?.goal_diff} pts
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        approved: 'text-green-400',
        pending: 'text-amber-400',
        rejected: 'text-red-400',
    }
    const labels: Record<string, string> = {
        approved: 'Aprobado',
        pending: 'Pendiente',
        rejected: 'Rechazado',
    }
    return (
        <span className={`text-xs ${styles[status] ?? 'text-gray-400'}`}>
            {labels[status] ?? status}
        </span>
    )
}
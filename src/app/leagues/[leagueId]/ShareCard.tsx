'use client'
import ComoParticiparModal from '@/app/components/ComoParticiparModal'
import { useState } from 'react'


export default function ShareCard({ inviteCode }: { inviteCode: string }) {
    const [copied, setCopied] = useState(false)

    const code = inviteCode.toUpperCase()
    const copiarEnlace = () => {
  const enlace = `https://quiniela-mundial-2026-pi.vercel.app/unirse/${code}`;
  navigator.clipboard.writeText(enlace);
  alert("Enlace copiado");
};

    function handleCopy() {
        const url = `${window.location.origin}/leagues/join?code=${code}`
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        })
    }

    return (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6">
            <div className="text-xs text-gray-400 mb-3">Compartir quinela</div>

            {/* Código grande */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Código de invitación</div>
                    <span className="text-2xl font-mono font-bold tracking-widest text-blue-400">
                        {code}
                    </span>
                        <div className="flex items-center gap-3">
                        <button onClick={copiarEnlace}>Copiar enlace de invitación</button>
                        <ComoParticiparModal />
                        </div>
                </div>
                <span className="text-2xl">🔗</span>
            </div>

            {/* Vista previa del link */}
            <div className="bg-gray-900 rounded-lg px-3 py-2 mb-3 font-mono text-xs text-gray-500 truncate">
                /leagues/join?code={code}
            </div>

            {/* Botón copiar */}
            <button
                onClick={handleCopy}
                className={`w-full py-2.5 text-sm rounded-xl border transition-colors font-medium
                    ${copied
                        ? 'bg-green-900/50 border-green-700 text-green-400'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'}`}>
                {copied ? '✓ Link copiado' : '📋 Copiar link de invitación'}
            </button>
        </div>
    )
}

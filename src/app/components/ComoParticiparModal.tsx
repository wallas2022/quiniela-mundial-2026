"use client";

import { useState } from "react";

export default function ComoParticiparModal() {
  const [open, setOpen] = useState(false);

  const pasos = [
    { numero: "1", titulo: "Regístrate", descripcion: "Crea tu cuenta con tu correo electrónico." },
    { numero: "2", titulo: "Únete a la quiniela", descripcion: "Usa el enlace de invitación que te compartieron." },
    { numero: "3", titulo: "Paga tu inscripción", descripcion: "Realiza el pago al admin y sube tu comprobante." },
    { numero: "4", titulo: "Espera la aprobación", descripcion: "El admin valida tu voucher y quedas activo." },
    { numero: "5", titulo: "Envía tus predicciones", descripcion: "Ingresa los marcadores antes de cada partido." },
  ];

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
      >
        ¿Cómo participar?
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 bg-gradient-to-br from-emerald-950 to-emerald-900 p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <div className="inline-block bg-yellow-400 text-emerald-950 text-xs font-bold tracking-widest px-2 py-0.5 rounded-full mb-2">
                  MUNDIAL 2026
                </div>
                <h2 className="text-xl font-bold text-white">
                  Cómo participar
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-3">
              {pasos.map((paso) => (
                <div
                  key={paso.numero}
                  className="bg-white/95 rounded-xl p-4 flex gap-3 items-start"
                >
                  <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 text-emerald-950 rounded-full flex items-center justify-center font-bold shadow">
                    {paso.numero}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-0.5">
                      {paso.titulo}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {paso.descripcion}
                    </p>
                  </div>
                </div>
              ))}

              {/* Aviso */}
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mt-4">
                <p className="text-yellow-50 text-sm">
                  <strong className="text-yellow-300">Importante:</strong> Las predicciones se cierran 1 minuto antes del pitazo inicial.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => setOpen(false)}
                className="w-full bg-white text-emerald-900 font-bold py-3 rounded-lg hover:bg-yellow-400 hover:text-emerald-950 transition-all mt-4"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
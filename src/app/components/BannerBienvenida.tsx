"use client";

import { useState } from "react";
import ComoParticiparModal from "./ComoParticiparModal";

interface Props {
  pagoAprobado: boolean;
}

export default function BannerBienvenida({ pagoAprobado }: Props) {
  const [cerrado, setCerrado] = useState(false);

  if (cerrado) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 border border-yellow-400/30 rounded-2xl p-5 mb-6 relative">
      <button
        onClick={() => setCerrado(true)}
        className="absolute top-3 right-3 text-white/50 hover:text-white text-xl leading-none"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
          👋
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            ¡Bienvenido a la quiniela!
          </h3>
          
          {!pagoAprobado ? (
            <p className="text-emerald-100 text-sm mb-3">
              Para empezar a predecir, sube tu comprobante de pago y espera la aprobación del administrador.
            </p>
          ) : (
            <p className="text-emerald-100 text-sm mb-3">
              Ya estás activo. Recuerda enviar tus predicciones antes del inicio de cada partido.
            </p>
          )}
          
          <ComoParticiparModal />
        </div>
      </div>
    </div>
  );
}
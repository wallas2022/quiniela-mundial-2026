import Link from "next/link";

export const metadata = {
  title: "Cómo participar | Quiniela Mundial 2026",
  description: "Pasos para unirte a la Quiniela Mundial 2026",
};

export default function ComoParticiparPage() {
  const pasos = [
    {
      numero: "1",
      titulo: "Regístrate",
      descripcion: "Crea tu cuenta con tu correo electrónico en la página principal.",
    },
    {
      numero: "2",
      titulo: "Únete a la quiniela",
      descripcion: "Usa el enlace de invitación que te compartieron para unirte.",
    },
    {
      numero: "3",
      titulo: "Paga tu inscripción",
      descripcion: "Realiza el pago al administrador y sube tu comprobante en la app.",
    },
    {
      numero: "4",
      titulo: "Espera la aprobación",
      descripcion: "El administrador valida tu voucher y quedas activo para participar.",
    },
    {
      numero: "5",
      titulo: "Envía tus predicciones",
      descripcion: "Ingresa los marcadores antes del inicio de cada partido.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <div className="inline-block bg-yellow-400 text-emerald-950 text-xs font-bold tracking-widest px-3 py-1 rounded-full mb-4">
            MUNDIAL 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Cómo participar en la Quiniela
          </h1>
          <p className="text-emerald-100 text-lg">
            Sigue estos 5 pasos para empezar a competir.
          </p>
        </div>

        {/* Pasos */}
        <div className="space-y-4 mb-8">
          {pasos.map((paso) => (
            <div
              key={paso.numero}
              className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-white/20 p-5 flex gap-4 items-start hover:shadow-xl transition-shadow"
            >
              <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-yellow-400 to-yellow-500 text-emerald-950 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                {paso.numero}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 mb-1">
                  {paso.titulo}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {paso.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso importante */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 backdrop-blur rounded-xl p-5 mb-6">
          <h3 className="font-bold text-yellow-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Importante
          </h3>
          <p className="text-yellow-50 text-sm leading-relaxed">
            Las predicciones se cierran <strong>1 minuto antes</strong> del pitazo inicial de cada partido. No las dejes para el último momento.
          </p>
        </div>

        {/* Fecha del Mundial */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-emerald-950 rounded-xl p-5 text-center mb-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-80">
            El Mundial inicia
          </p>
          <p className="text-2xl font-bold">11 de junio de 2026</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          
         <Link
  href="/"
  className="inline-block bg-white text-emerald-900 font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 hover:text-emerald-950 transition-all shadow-lg hover:shadow-xl"
>
  Crear mi cuenta
</Link>
          <p className="text-emerald-200/70 text-sm mt-4">
            ¿Dudas? Contacta al administrador de tu quiniela.
          </p>
        </div>
      </div>
    </main>
  );
}
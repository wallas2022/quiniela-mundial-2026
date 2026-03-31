import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Quiniela del Mundial FIFA 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-gray-950">
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-gray-800 py-4 px-6">
          <p className="text-center text-xs text-gray-600">
            © {new Date().getFullYear()} Walter Rosales · Todos los derechos reservados
          </p>
        </footer>
      </body>
    </html>
  )
}
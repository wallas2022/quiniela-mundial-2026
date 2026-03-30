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
      <body>{children}</body>
    </html>
  )
}
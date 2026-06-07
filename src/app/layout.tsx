import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Iglesia Espíritu Santo Fuego',
  description: 'Iglesia Espíritu Santo Fuego - Transformando vidas con el poder del Espíritu Santo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-warm text-gray-800 antialiased">{children}</body>
    </html>
  )
}

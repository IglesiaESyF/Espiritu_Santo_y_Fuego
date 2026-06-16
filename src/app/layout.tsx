import type { Metadata } from 'next'
import './globals.css'

const base = '/Espiritu_Santo_y_Fuego'

export const metadata: Metadata = {
  title: 'Iglesia Espíritu Santo Fuego',
  description: 'Iglesia Espíritu Santo Fuego - Transformando vidas con el poder del Espíritu Santo',
  manifest: base + '/manifest.json',
  appleWebApp: { capable: true, title: 'IESFuego', statusBarStyle: 'black-translucent' },
  icons: {
    apple: [
      { url: base + '/icon-192.png', sizes: '192x192' },
      { url: base + '/icon-512.png', sizes: '512x512' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#b8860b',
} satisfies import('next').Viewport

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-warm text-gray-800 antialiased">{children}</body>
    </html>
  )
}

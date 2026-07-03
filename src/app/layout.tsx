'use client'

import './globals.css'
import { useEffect } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { trackVisit } from '@/lib/analytics'

const base = '/Espiritu_Santo_y_Fuego'

function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(base + '/sw.js', { scope: base + '/' })
    }
  }, [])
  return null
}

function PageTracker() {
  useEffect(() => { trackVisit() }, [])
  return null
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Iglesia Espíritu Santo Fuego</title>
        <meta name="description" content="Iglesia Espíritu Santo Fuego - Transformando vidas con el poder del Espíritu Santo" />
        <link rel="manifest" href={base + '/manifest.json'} />
        <link rel="icon" type="image/x-icon" href={base + '/favicon.ico'} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="IESFuego" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href={base + '/icon-192.png'} sizes="192x192" />
        <link rel="apple-touch-icon" href={base + '/icon-512.png'} sizes="512x512" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#b8860b" />
      </head>
      <body className="bg-warm text-gray-800 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
        <PageTracker />
      </body>
    </html>
  )
}

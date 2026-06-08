'use client'

import { useState, useEffect } from 'react'
import { Flame, Video, Wifi, WifiOff } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'iesfuego-live-settings'

export default function EnVivoPage() {
  const [paginaFacebook, setPaginaFacebook] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [activo, setActivo] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setPaginaFacebook(data.paginaFacebook || '')
        setVideoUrl(data.videoUrl || '')
        setActivo(data.activo || false)
        setMensaje(data.mensaje || '')
      } catch {}
    }
  }, [])

  const embedUrl = videoUrl
    ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&width=734`
    : paginaFacebook
      ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(paginaFacebook)}&tabs=events&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`
      : ''

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <Flame className="mx-auto mb-3 h-10 w-10 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold text-dark">En Vivo</h1>
          <p className="mt-2 text-gray-600">Transmisiones en vivo de nuestros cultos</p>
        </div>

        {activo && embedUrl ? (
          <Card className="mb-8 overflow-hidden">
            <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="text-sm font-semibold">EN VIVO</span>
              <Wifi className="ml-auto h-4 w-4" />
            </div>
            <div className="w-full" style={{ height: 450 }}>
              <iframe
                src={embedUrl}
                className="h-full w-full"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder={0}
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>

          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-6 flex h-48 w-full max-w-xl items-center justify-center rounded-xl bg-dark/5">
                <div className="text-center">
                  <WifiOff className="mx-auto mb-3 h-16 w-16 text-primary/60" />
                  <p className="text-sm text-gray-500">
                    No hay transmisión en vivo en este momento
                  </p>
                  {mensaje && (
                    <p className="mt-2 text-xs text-gray-400">{mensaje}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paginaFacebook && (
          <div className="text-center">
            <a
              href={paginaFacebook.startsWith('http') ? paginaFacebook : `https://www.facebook.com/${paginaFacebook}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                <Video className="mr-2 h-5 w-5" /> Ir a Facebook
              </Button>
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

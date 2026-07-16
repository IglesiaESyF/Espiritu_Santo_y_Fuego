'use client'

import { useState, useEffect } from 'react'
import { Flame, Video, Wifi, WifiOff } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { PreStream } from '@/components/pre-stream'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const FIRESTORE_PATH = 'config/live'

interface LiveData {
  plataforma: string
  paginaFacebook: string
  videoUrl: string
  activo: boolean
  mensaje: string
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return m ? m[1] : null
}

function buildEmbedUrl(plataforma: string, videoUrl: string): string {
  if (!videoUrl) return ''
  switch (plataforma) {
    case 'youtube': {
      const id = extractYouTubeId(videoUrl)
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : ''
    }
    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&width=734`
    case 'otro':
      return videoUrl
    default:
      return ''
  }
}

export default function EnVivoPage() {
  const [liveData, setLiveData] = useState<LiveData>({
    plataforma: 'facebook',
    paginaFacebook: '',
    videoUrl: '',
    activo: false,
    mensaje: '',
  })

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, FIRESTORE_PATH),
      (snap) => {
        if (snap.exists()) {
          setLiveData(snap.data() as LiveData)
        }
      },
    )
    return () => unsub()
  }, [])

  const { plataforma, paginaFacebook, videoUrl, activo, mensaje } = liveData
  const embedUrl = buildEmbedUrl(plataforma, videoUrl)

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
              <span className="ml-2 text-xs text-white/70 uppercase">{plataforma === 'youtube' ? 'YouTube' : plataforma === 'facebook' ? 'Facebook' : 'Streaming'}</span>
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
          <Card className="mb-8 overflow-hidden">
            <PreStream mensaje={mensaje} />
          </Card>
        )}

        {paginaFacebook && (
          <div className="text-center">
            <a
              href={paginaFacebook.startsWith('http') ? paginaFacebook : `https://www.facebook.com/${paginaFacebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary-dark hover:shadow-xl"
            >
                <Video className="h-5 w-5" /> Ir a Facebook
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

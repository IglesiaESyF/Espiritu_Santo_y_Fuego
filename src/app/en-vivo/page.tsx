'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Flame, Video, Wifi, Maximize, Minimize } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { PreStream } from '@/components/pre-stream'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import logoSrc from '@/../public/logo.png'

const FIRESTORE_PATH = 'config/live'
const SEGUNDOS_ESPERA = 5

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

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5.1) % 100}%`,
  top: `${50 + (i * 3.3) % 40}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.25) % 5}s`,
  duration: `${3 + (i % 4)}s`,
}))

function CountdownOverlay({ countdown, mensaje, plataforma }: { countdown: number; mensaje?: string; plataforma: string }) {
  return (
    <div className="relative isolate w-full overflow-hidden rounded-xl bg-gradient-to-br from-dark via-dark-light to-dark" style={{ minHeight: 450 }}>
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 ? 'rgba(218,165,32,0.6)' : p.id % 3 === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(239,68,68,0.4)',
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      <div className="glow-ring" style={{ width: 200, height: 200, animationDelay: '0s' }} />
      <div className="glow-ring" style={{ width: 280, height: 280, animationDelay: '1s' }} />
      <div className="glow-ring" style={{ width: 360, height: 360, animationDelay: '2s' }} />

      <div className="relative flex flex-col items-center justify-center px-4 py-14">
        <div className="mb-10 flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          En vivo · {plataforma === 'youtube' ? 'YouTube' : plataforma === 'facebook' ? 'Facebook' : 'Streaming'}
        </div>

        <div className="scale-[1.8] md:scale-[2.2] mb-16">
          <span className="logo-wrapper" style={{ perspective: '600px' }}>
            <Image src={logoSrc} alt="IESFuego" width={120} height={120} className="logo-spin h-24 w-24 object-contain" style={{ filter: 'drop-shadow(0 0 20px rgba(218,165,32,0.5))' }} />
          </span>
        </div>

        <p className="text-lg font-bold text-white md:text-2xl text-center drop-shadow-lg">
          En {countdown} segundo{countdown === 1 ? '' : 's'} comenzarás a ver la transmisión
        </p>

        <div
          key={countdown}
          className="countdown-number mt-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold text-6xl font-extrabold text-gold shadow-[0_0_40px_rgba(251,191,36,0.45)]"
        >
          {countdown}
        </div>

        {mensaje && (
          <p className="mt-8 max-w-md text-center text-sm font-semibold text-white/70 leading-relaxed drop-shadow">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}

export default function EnVivoPage() {
  const [liveData, setLiveData] = useState<LiveData>({
    plataforma: 'facebook',
    paginaFacebook: '',
    videoUrl: '',
    activo: false,
    mensaje: '',
  })
  const [countdown, setCountdown] = useState<number | null>(null)
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false)
  const videoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onFsChange() {
      setEsPantallaCompleta(document.fullscreenElement === videoWrapRef.current)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  function toggleFullscreen() {
    const el = videoWrapRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      el.requestFullscreen().catch(() => {})
    }
  }

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
  const enVivo = activo && !!embedUrl

  useEffect(() => {
    if (!enVivo) {
      setCountdown(null)
      return
    }
    setCountdown(SEGUNDOS_ESPERA)
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c === null) return null
        if (c <= 1) return 0
        return c - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [enVivo])

  const mostrandoConteo = enVivo && countdown !== null && countdown > 0

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <Flame className="mx-auto mb-3 h-10 w-10 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold text-dark">En Vivo</h1>
          <p className="mt-2 text-gray-600">Transmisiones en vivo de nuestros cultos</p>
        </div>

        {enVivo ? (
          mostrandoConteo ? (
            <CountdownOverlay countdown={countdown!} mensaje={mensaje} plataforma={plataforma} />
          ) : (
            <Card className="mb-8 overflow-hidden">
              <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-sm font-semibold">EN VIVO</span>
                <span className="ml-2 text-xs text-white/70 uppercase">{plataforma === 'youtube' ? 'YouTube' : plataforma === 'facebook' ? 'Facebook' : 'Streaming'}</span>
                <Wifi className="ml-auto h-4 w-4" />
              </div>
              <div className="relative w-full bg-black" ref={videoWrapRef} style={{ height: 450 }}>
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  style={{ border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  frameBorder={0}
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
                <button
                  onClick={toggleFullscreen}
                  className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
                  title={esPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  aria-label={esPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {esPantallaCompleta ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </Card>
          )
        ) : (
          <PreStream mensaje={mensaje} />
        )}

        {paginaFacebook && (
          <div className="mt-10 text-center">
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

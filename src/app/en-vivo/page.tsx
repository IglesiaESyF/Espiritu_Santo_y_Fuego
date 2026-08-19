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
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return m ? m[1] : null
}

function extractFacebookVideoId(url: string): string | null {
  const m1 = url.match(/facebook\.com\/[^/]+\/videos\/(\d+)/)
  const m2 = url.match(/[?&]v=(\d+)/)
  const m3 = url.match(/video_id=(\d+)/)
  const m4 = url.match(/facebook\.com\/[^/]+\/posts\/(\d+)/)
  return m1?.[1] || m2?.[1] || m3?.[1] || m4?.[1] || null
}

function buildEmbedUrl(plataforma: string, videoUrl: string): string {
  if (!videoUrl) return ''
  switch (plataforma) {
    case 'youtube': {
      const id = extractYouTubeId(videoUrl)
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : ''
    }
    case 'facebook': {
      const id = extractFacebookVideoId(videoUrl)
      if (id) return `https://www.facebook.com/video/embed?video_id=${id}&autoplay=1`
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&width=734`
    }
    case 'otro':
      return videoUrl
    default:
      return ''
  }
}

function getPlatformUrl(plataforma: string, videoUrl: string): string {
  if (!videoUrl) return ''
  if (plataforma === 'youtube') {
    const id = extractYouTubeId(videoUrl)
    return id ? `https://www.youtube.com/watch?v=${id}` : videoUrl
  }
  if (plataforma === 'facebook') {
    return videoUrl
  }
  return videoUrl
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
  const [embedFailed, setEmbedFailed] = useState(false)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    setEmbedFailed(false)
    setCountdown(SEGUNDOS_ESPERA)
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c === null) return null
        if (c <= 1) return 0
        return c - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [enVivo, videoUrl])

  useEffect(() => {
    if (!enVivo || countdown !== 0) return
    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current
        if (iframe && !iframe.contentWindow?.document?.body?.childElementCount) {
          setEmbedFailed(true)
        }
      } catch {
        setEmbedFailed(true)
      }
    }, 6000)
    return () => clearTimeout(timer)
  }, [enVivo, countdown])

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
            plataforma === 'youtube' ? (
              <Card className="mb-8 overflow-hidden">
                <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-sm font-semibold">EN VIVO</span>
                  <span className="ml-2 text-xs text-white/70 uppercase">YouTube</span>
                  <Wifi className="ml-auto h-4 w-4" />
                </div>
                <div className="relative w-full bg-black" ref={videoWrapRef} style={{ aspectRatio: '16/9', height: 'auto', minHeight: 200 }}>
                  <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="absolute inset-0 h-full w-full"
                    style={{ border: 'none', overflow: 'hidden' }}
                    scrolling="no"
                    frameBorder={0}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                  <div className="pointer-events-none absolute z-10 logo-responsive-position" style={{ perspective: 500 }}>
                    <div className="logo-3d-wrap">
                      <div className="logo-3d-inner logo-3d-responsive">
                        <Image
                          src={logoSrc}
                          alt="Iglesia"
                          width={126}
                          height={126}
                          className="rounded-full"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="absolute right-2 top-2 z-10 rounded-lg bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80 sm:right-3 sm:top-3 sm:p-2"
                    title={esPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    aria-label={esPantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {esPantallaCompleta ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
              </Card>
            ) : (
              <Card className="mb-8 overflow-hidden">
                <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-white">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-sm font-semibold">EN VIVO</span>
                  <span className="ml-2 text-xs text-white/70 uppercase">Facebook</span>
                  <Wifi className="ml-auto h-4 w-4" />
                </div>
                <div className="flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-dark via-dark-light to-dark p-12 text-center" style={{ minHeight: 360 }}>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                    <Video className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-white">¡Estamos en vivo!</h2>
                  <p className="max-w-sm text-sm text-white/70">La transmisión está activa. Hacé clic abajo para verla directamente en Facebook.</p>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-[#1877F2] px-10 py-4 text-xl font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#1565C0] hover:shadow-xl hover:scale-105"
                  >
                    <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Ver en Facebook
                  </a>
                  {paginaFacebook && (
                    <a
                      href={paginaFacebook.startsWith('http') ? paginaFacebook : `https://www.facebook.com/${paginaFacebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                    >
                      Ir a la página de Facebook
                    </a>
                  )}
                </div>
              </Card>
            )
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

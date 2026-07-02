'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cross, Tv, Calendar, Heart, ArrowRight, Flame, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, getDocs, Timestamp } from 'firebase/firestore'
import logoSrc from '@/../public/logo.png'

interface Noticia {
  id: string
  titulo: string
  mensaje: string
  imagenUrl: string
  videoUrl: string
  fechaExpiracion: Timestamp
}

export default function HomePage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [selected, setSelected] = useState<Noticia | null>(null)

  useEffect(() => {
    getDocs(collection(db, 'noticias')).then(snap => {
      const now = Date.now()
      const list: Noticia[] = []
      snap.forEach(d => {
        const n = { id: d.id, ...d.data() } as Noticia
        if (n.fechaExpiracion?.toMillis() > now) list.push(n)
      })
      setNoticias(list)
    }).catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-dark via-dark-light to-dark py-24 text-center text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
              <span className="logo-wrapper shrink-0">
                <Image src={logoSrc} alt="IESFuego" width={96} height={96} className="logo-spin h-24 w-24 object-contain md:h-28 md:w-28" />
              </span>
              <div className="text-center md:text-left">
                <h1 className="mb-2 text-4xl font-bold leading-tight md:text-5xl">
                  Iglesia Espíritu Santo{' '}
                  <span className="text-primary-light">y Fuego</span>
                </h1>
                <p className="mb-2 text-sm text-gray-400">
                  Misión Cristiana Perfectos en Unidad
                </p>
                <p className="mb-8 text-lg text-gray-300">
                  Transformando vidas con el poder del Espíritu Santo
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cultos" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-dark">
                <Tv className="h-5 w-5" /> Nuestros Cultos
              </Link>
              <Link href="/en-vivo" className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-light px-8 py-3.5 font-semibold text-primary-light transition hover:bg-primary-light hover:text-white">
                <Flame className="h-5 w-5" /> En Vivo
              </Link>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-10">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Cross, title: 'Cultos', desc: 'Únete a nuestros servicios donde la presencia de Dios transforma vidas.', href: '/cultos' },
              { icon: Calendar, title: 'Actividades', desc: 'Conoce nuestras actividades, eventos especiales y programas.', href: '/actividades' },
              { icon: Heart, title: 'En Vivo', desc: 'No te pierdas ningún servicio. Transmitimos en vivo cada culto.', href: '/en-vivo' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="group rounded-xl bg-white p-6 shadow-lg transition hover:shadow-xl">
                <item.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-bold text-dark group-hover:text-primary">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                  Ver más <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Noticias activas */}
        {noticias.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="mb-8 text-center text-3xl font-bold text-dark">
              Últimas <span className="text-primary">Noticias</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {noticias.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {n.imagenUrl ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image src={n.imagenUrl} alt={n.titulo} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary-light/10">
                      <Image src={logoSrc} alt="" width={64} height={64} className="h-16 w-16 object-contain opacity-30" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-lg font-bold text-dark">{n.titulo}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">{n.mensaje}</p>
                    {n.videoUrl && <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">▶ Ver video</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Versículo */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <blockquote className="text-2xl italic text-dark md:text-3xl">
            &ldquo;Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-500">— 2 Timoteo 1:7</p>
        </section>
      </main>

      {/* Modal noticia */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-gray-600 shadow transition hover:bg-white hover:text-gray-900">
              <X className="h-5 w-5" />
            </button>
            {selected.imagenUrl && (
              <div className="relative h-56 w-full md:h-72">
                <Image src={selected.imagenUrl} alt={selected.titulo} fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="p-6">
              <h2 className="mb-3 text-2xl font-bold text-dark">{selected.titulo}</h2>
              <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{selected.mensaje}</p>
              {selected.videoUrl && (
                <a
                  href={selected.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Flame className="h-4 w-4" /> Ver Video
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

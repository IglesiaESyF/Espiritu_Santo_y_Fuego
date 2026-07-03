'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cross, Tv, Calendar, Heart, ArrowRight, Flame, X } from 'lucide-react'
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
          <section className="relative mx-auto max-w-6xl px-4 py-20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-primary-light/5 blur-3xl" />
            </div>
            <h2 className="relative mb-4 text-center text-3xl font-bold text-dark">
              Últimas <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Noticias</span>
            </h2>
            <p className="relative mb-10 text-center text-sm text-gray-500">Mantente al día con lo último de la iglesia</p>
            <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {noticias.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="group"
                  style={{ animation: `fadeSlideUp 0.5s ease-out ${i * 0.1}s both` }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:rotate-x-2">
                    {/* glow hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary-light/20 to-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 rounded-2xl" />

                    <div className="relative overflow-hidden">
                      {n.imagenUrl ? (
                        <div className="relative h-48 w-full overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                          <img src={n.imagenUrl} alt={n.titulo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary-light/5 to-primary/10">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                          <Image src={logoSrc} alt="" width={72} height={72} className="h-16 w-16 object-contain opacity-25" />
                        </div>
                      )}
                      {n.videoUrl && (
                        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          <Flame className="h-3 w-3" /> Video
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex flex-col p-5">
                      <h3 className="mb-2 text-lg font-bold text-dark group-hover:text-primary transition-colors">{n.titulo}</h3>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">{n.mensaje}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                        Leer más <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={() => setSelected(null)}>
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

            {/* decorative header bg */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-light/5 blur-3xl" />
            </div>

            <button onClick={() => setSelected(null)} className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-gray-800 hover:scale-110">
              <X className="h-5 w-5" />
            </button>

            {selected.imagenUrl && (
              <div className="relative h-56 w-full md:h-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-10" />
                <img src={selected.imagenUrl} alt={selected.titulo} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="relative z-10 p-8 pt-6">
              {/* title centered */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  {selected.titulo}
                </h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary/40 to-primary-light/40" />
              </div>

              {/* message with formatted text */}
              <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-100 shadow-inner">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700 [&>br]:block [&>br]:content-[''] [&>br]:my-2">
                  {selected.mensaje}
                </p>
              </div>

              {/* video button */}
              {selected.videoUrl && (
                <div className="mt-6 text-center">
                  <a
                    href={selected.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105"
                  >
                    <Flame className="h-4 w-4" /> Ver Video
                  </a>
                </div>
              )}

              {/* close hint */}
              <p className="mt-6 text-center text-[11px] text-gray-400">Presiona ESC o haz clic fuera para cerrar</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

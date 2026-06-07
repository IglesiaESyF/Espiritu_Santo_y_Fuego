import Link from 'next/link'
import { Cross, Tv, Calendar, Heart, ArrowRight, Flame } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-dark via-dark-light to-dark py-24 text-center text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4">
            <Flame className="mx-auto mb-6 h-16 w-16 text-primary-light animate-pulse" />
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
              Iglesia Espíritu Santo{' '}
              <span className="text-primary-light">Fuego</span>
            </h1>
            <p className="mb-8 text-lg text-gray-300">
              Transformando vidas con el poder del Espíritu Santo
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/cultos"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-dark"
              >
                <Tv className="h-5 w-5" /> Nuestros Cultos
              </Link>
              <Link
                href="/en-vivo"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-light px-8 py-3.5 font-semibold text-primary-light transition hover:bg-primary-light hover:text-white"
              >
                <Flame className="h-5 w-5" /> En Vivo
              </Link>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-10">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Cross,
                title: 'Cultos',
                desc: 'Únete a nuestros servicios donde la presencia de Dios transforma vidas.',
                href: '/cultos',
              },
              {
                icon: Calendar,
                title: 'Actividades',
                desc: 'Conoce nuestras actividades, eventos especiales y programas.',
                href: '/actividades',
              },
              {
                icon: Heart,
                title: 'En Vivo',
                desc: 'No te pierdas ningún servicio. Transmitimos en vivo cada culto.',
                href: '/en-vivo',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl bg-white p-6 shadow-lg transition hover:shadow-xl"
              >
                <item.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-bold text-dark group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                  Ver más <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Versículo */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <blockquote className="text-2xl italic text-dark md:text-3xl">
            "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio."
          </blockquote>
          <p className="mt-4 text-sm text-gray-500">— 2 Timoteo 1:7</p>
        </section>
      </main>
      <Footer />
    </>
  )
}

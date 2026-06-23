'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

interface SlotCulto {
  titulo: string; preside: string; lectura: string
  predicacion: string; limpieza: string
  hora_inicio: string; hora_fin: string
}

type SemanaCultos = Record<string, SlotCulto[]>

const DIAS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const DIAS_LABEL: Record<string,string> = {
  lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',
  jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo',
}

const METRO_COLORS: Record<string,string> = {
  lunes:'#0078D7', martes:'#0099BC', miercoles:'#00B7C3',
  jueves:'#018574', viernes:'#E3008C', sabado:'#C239B3', domingo:'#F7630C',
}

const DAY_OFFSETS = [
  { translateX: -200, scale: 0.6,  rotate: -9,  opacity: 0.25, z: 1 },
  { translateX: -120, scale: 0.78, rotate: -5,  opacity: 0.5,  z: 2 },
  { translateX: -50,  scale: 0.92, rotate: -2,  opacity: 0.75, z: 3 },
  { translateX: 0,    scale: 1,    rotate: 0,   opacity: 1,    z: 7 },
  { translateX: 50,   scale: 0.92, rotate: 2,   opacity: 0.75, z: 3 },
  { translateX: 120,  scale: 0.78, rotate: 5,   opacity: 0.5,  z: 2 },
  { translateX: 200,  scale: 0.6,  rotate: 9,   opacity: 0.25, z: 1 },
]

function getWeekDates(): Date[] {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  return DIAS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function CultosPage() {
  const [semana, setSemana] = useState<SemanaCultos>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const weekDates = useMemo(() => getWeekDates(), [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'cultos-semana'), (snap) => {
      if (snap.exists()) setSemana(snap.data() as SemanaCultos)
    })
    return () => unsub()
  }, [])

  const goNext = useCallback(() => {
    if (animating || currentIndex >= 6) return
    setAnimating(true)
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setAnimating(false), 500)
  }, [animating, currentIndex])

  const goPrev = useCallback(() => {
    if (animating || currentIndex <= 0) return
    setAnimating(true)
    setCurrentIndex(prev => prev - 1)
    setTimeout(() => setAnimating(false), 500)
  }, [animating, currentIndex])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < 6

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 bg-elegant">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gold-accent shadow-lg shadow-primary/20">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-dark">
            Cultos de la <span className="text-primary">Semana</span>
          </h1>
          <p className="mt-2 text-base text-gray-500 tracking-wide">
            {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
          </p>
        </div>

        {/* card stack */}
        <div
          className="relative mx-auto w-full max-w-lg select-none"
          style={{ minHeight: 480 }}
        >
          {DIAS.map((diaKey, idx) => {
            const slots = semana[diaKey] || []
            const cardDate = weekDates[idx]
            const o = DAY_OFFSETS[idx - currentIndex + 3] || DAY_OFFSETS[3]

            return (
              <div
                key={diaKey}
                className="absolute inset-x-0 top-0 rounded-2xl p-6 text-white transition-all duration-500 ease-out"
                style={{
                  transform: `translateX(${o.translateX}px) scale(${o.scale}) rotate(${o.rotate}deg)`,
                  transformOrigin: 'center center',
                  opacity: o.opacity,
                  zIndex: o.z,
                  backgroundColor: METRO_COLORS[diaKey],
                  pointerEvents: idx === currentIndex ? 'auto' : 'none',
                  minHeight: 440,
                }}
              >
                {/* day header */}
                <div className="mb-5 flex items-center justify-between border-b border-white/20 pb-3">
                  <div>
                    <div className="text-3xl font-bold tracking-tight">{DIAS_LABEL[diaKey]}</div>
                    <div className="mt-0.5 text-sm opacity-75">{formatDateShort(cardDate)}</div>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    {slots.length} culto{slots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {slots.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-lg opacity-60">Sin actividad programada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slots.map((slot, i) => (
                      <div key={i} className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
                        {slot.titulo && (
                          <h3 className="mb-3 text-base font-bold">{slot.titulo}</h3>
                        )}
                        <div className="space-y-1.5 text-sm">
                          {slot.preside && (
                            <div className="flex justify-between">
                              <span className="opacity-70">Preside</span>
                              <span className="font-semibold">{slot.preside}</span>
                            </div>
                          )}
                          {slot.lectura && (
                            <div className="flex justify-between">
                              <span className="opacity-70">Lectura</span>
                              <span className="font-semibold">{slot.lectura}</span>
                            </div>
                          )}
                          {slot.predicacion && (
                            <div className="flex justify-between">
                              <span className="opacity-70">Predicación</span>
                              <span className="font-semibold">{slot.predicacion}</span>
                            </div>
                          )}
                          {slot.limpieza && (
                            <div className="flex justify-between">
                              <span className="opacity-70">Limpieza</span>
                              <span className="font-semibold">{slot.limpieza}</span>
                            </div>
                          )}
                        </div>
                        {(slot.hora_inicio || slot.hora_fin) && (
                          <div className="mt-3 flex items-center gap-1.5 text-sm opacity-80">
                            <Clock className="h-4 w-4" />
                            <span>{slot.hora_inicio}{slot.hora_inicio && slot.hora_fin ? ' — ' : ''}{slot.hora_fin}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* nav arrows */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className={`absolute left-0 top-1/2 z-20 -translate-x-5 -translate-y-1/2 rounded-full bg-white/90 p-3 text-gray-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 ${
              !hasPrev ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className={`absolute right-0 top-1/2 z-20 translate-x-5 -translate-y-1/2 rounded-full bg-white/90 p-3 text-gray-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 ${
              !hasNext ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {DIAS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { if (!animating) setCurrentIndex(idx) }}
              disabled={animating}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir al día ${DIAS_LABEL[DIAS[idx]]}`}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

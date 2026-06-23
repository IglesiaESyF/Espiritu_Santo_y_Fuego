'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'
import Image from 'next/image'
import logoSrc from '@/../public/logo.png'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot, collection, getDocs } from 'firebase/firestore'
import type { Miembro } from '@/types'

interface SlotCulto {
  titulo: string; preside: string; lectura: string
  predicacion: string; limpieza: string
  hora_inicio: string; hora_fin: string
}

type SemanaCultos = Record<string, SlotCulto[]>

interface SlotData {
  preside: { miembroId: string; nombreCompleto: string }[]
  predicacion: { miembroId: string; nombreCompleto: string }[]
  lectura: { miembroId: string; nombreCompleto: string }[]
  limpieza: { miembroId: string; nombreCompleto: string }[]
}

const DIAS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const DIAS_LABEL: Record<string,string> = {
  lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',
  jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo',
}

const METRO_COLORS: Record<string,string> = {
  lunes:'#0078D7', martes:'#0099BC', miercoles:'#00B7C3',
  jueves:'#018574', viernes:'#E3008C', sabado:'#C239B3', domingo:'#F7630C',
}

function cardStyle(rel: number) {
  if (rel === 0) return { tx: 0, s: 1, r: 0, o: 1, y: 0, z: 20, shadow: '0 20px 60px rgba(0,0,0,0.35)' }
  if (rel < 0) {
    const p = Math.abs(rel)
    const shadowSize = Math.max(8 - p * 2, 2)
    return {
      tx: -40 - (p - 1) * 50,
      s: Math.max(0.78 - (p - 1) * 0.14, 0),
      r: -2 * p,
      o: Math.max(0.7 - (p - 1) * 0.18, 0),
      y: 5 * p,
      z: Math.max(15 - p, 1),
      shadow: `0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.15)`,
    }
  }
  return {
    tx: 5 * rel,
    s: Math.max(1 - rel * 0.025, 0.8),
    r: 0,
    o: Math.max(1 - rel * 0.08, 0.35),
    y: 2 * rel,
    z: Math.max(19 - rel, 1),
    shadow: `0 ${Math.max(8 - (rel - 1) * 2, 2)}px ${Math.max(16 - (rel - 1) * 4, 4)}px rgba(0,0,0,0.15)`,
  }
}

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

function fmtName(m: Miembro | undefined, fallback: string): string {
  if (m) {
    const nombres = m.nombre.split(' ').slice(0, 2).join(' ')
    const apellido = m.apellido.split(' ')[0]
    return `Hno(a). ${nombres} ${apellido}`
  }
  const parts = fallback.split(' ')
  if (parts.length <= 2) return `Hno(a). ${fallback}`
  const given = parts.slice(0, Math.min(2, parts.length - 1)).join(' ')
  return `Hno(a). ${given} ${parts[parts.length - 1]}`
}

const ROLE_CONFIG: { key: keyof SlotData; label: string }[] = [
  { key: 'preside', label: 'Preside' },
  { key: 'lectura', label: 'Lectura Bíblica' },
  { key: 'predicacion', label: 'Predicación' },
  { key: 'limpieza', label: 'Limpieza' },
]

export default function CultosPage() {
  const [semana, setSemana] = useState<SemanaCultos>({})
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [participacionMap, setParticipacionMap] = useState<Record<string, SlotData[]>>({})
  const [miembrosMap, setMiembrosMap] = useState<Record<string, Miembro>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [dragOff, setDragOff] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef(0)
  const dragOffRef = useRef(0)

  useEffect(() => {
    const wd = getWeekDates()
    setWeekDates(wd)

    getDocs(collection(db, 'miembros')).then(snap => {
      const map: Record<string, Miembro> = {}
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() } as Miembro })
      setMiembrosMap(map)
    }).catch(() => {})

    const fechaKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    wd.forEach(d => {
      const f = fechaKey(d)
      getDoc(doc(db, 'participacion-cultos', f)).then(snap => {
        if (snap.exists()) {
          setParticipacionMap(prev => ({ ...prev, [f]: snap.data().slots || [] }))
        }
      }).catch(() => {})
    })
  }, [])

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
    setDragOff(0); dragOffRef.current = 0; setIsDragging(false)
    setTimeout(() => setAnimating(false), 500)
  }, [animating, currentIndex])

  const goPrev = useCallback(() => {
    if (animating || currentIndex <= 0) return
    setAnimating(true)
    setCurrentIndex(prev => prev - 1)
    setDragOff(0); dragOffRef.current = 0; setIsDragging(false)
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

  function onTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX
    setIsDragging(false)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (animating) return
    const dx = e.touches[0].clientX - touchStartRef.current
    if (Math.abs(dx) > 5) {
      if (!isDragging) setIsDragging(true)
      const clamped = Math.max(-120, Math.min(120, dx))
      dragOffRef.current = clamped
      setDragOff(clamped)
    }
  }

  function onTouchEnd() {
    if (!isDragging) { setDragOff(0); dragOffRef.current = 0; return }
    const dx = dragOffRef.current
    setIsDragging(false); setDragOff(0); dragOffRef.current = 0
    if (dx < -50 && hasNext) goNext()
    else if (dx > 50 && hasPrev) goPrev()
  }

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
            {weekDates.length ? `${formatDate(weekDates[0])} — ${formatDate(weekDates[6])}` : ''}
          </p>
        </div>

        {/* card stack */}
        <div
          className="relative mx-auto w-full select-none"
          style={{ maxWidth: 640, minHeight: '55vh' }}
        >
          {DIAS.map((diaKey, idx) => {
            const slots = semana[diaKey] || []
            const cardDate = weekDates[idx]
            if (!cardDate) return null
            const fecha = `${cardDate.getFullYear()}-${String(cardDate.getMonth()+1).padStart(2,'0')}-${String(cardDate.getDate()).padStart(2,'0')}`
            const partSlots = participacionMap[fecha]
            const o = cardStyle(idx - currentIndex)
            const isCurrent = idx === currentIndex
            const drag = isCurrent && !animating ? dragOff : 0
            const scaleExtra = isCurrent && isDragging
              ? 1 - Math.abs(drag) * 0.0012
              : 1

            function rolePeople(slotIdx: number, field: keyof SlotData) {
              const ps = partSlots?.[slotIdx]
              if (!ps) return [] as { mid: string; nombre: string }[]
              const arr = ps[field]
              if (!arr || arr.length === 0) return []
              return arr.map(p => ({ mid: p.miembroId, nombre: p.nombreCompleto }))
            }

            return (
              <div
                key={diaKey}
                className={`absolute inset-x-0 top-0 rounded-2xl p-6 text-white overflow-hidden ${
                  isCurrent && !isDragging ? 'transition-all duration-500 ease-out' : ''
                }`}
                style={{
                  transform: `translateX(${o.tx + drag}px) translateY(${o.y}px) scale(${o.s * scaleExtra}) rotate(${o.r}deg)`,
                  transformOrigin: 'center center',
                  opacity: isCurrent && isDragging ? Math.min(1, 1 - Math.abs(drag) * 0.004) : o.o,
                  zIndex: o.z,
                  backgroundColor: METRO_COLORS[diaKey],
                  boxShadow: isCurrent
                    ? `0 ${20 + Math.abs(drag) * 0.2}px ${60 + Math.abs(drag) * 0.4}px rgba(0,0,0,${0.35 + Math.abs(drag) * 0.001})`
                    : o.shadow,
                  pointerEvents: isCurrent ? 'auto' : 'none',
                }}
                onTouchStart={isCurrent ? onTouchStart : undefined}
                onTouchMove={isCurrent ? onTouchMove : undefined}
                onTouchEnd={isCurrent ? onTouchEnd : undefined}
              >
                <div className="relative z-10">

                {/* day header */}
                <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-3">
                  <div>
                    <div className="text-3xl font-bold tracking-tight">{DIAS_LABEL[diaKey]}</div>
                    <div className="mt-0.5 text-sm opacity-75">{formatDateShort(cardDate)}</div>
                  </div>
                </div>

                {slots.length === 0 ? (
                  <div className="relative flex items-center justify-center py-16">
                    <p className="text-lg opacity-60">Sin actividad programada</p>
                  </div>
                ) : (
                  <div className="relative space-y-3">
                    {slots.map((slot, i) => (
                      <div key={i} className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
                        {slot.titulo && (
                          <h3 className="mb-3 text-base font-bold">{slot.titulo}</h3>
                        )}

                        <div className="space-y-2">
                          {ROLE_CONFIG.map(rc => {
                            const people = rolePeople(i, rc.key)
                            const noParticipation = people.length === 0
                            const templateVal = slot[rc.key as keyof SlotCulto] as string || ''

                            if (noParticipation && !templateVal) return null

                            return (
                              <div key={rc.key}>
                                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                  {rc.label}
                                </div>
                                {noParticipation ? (
                                  <div className="text-sm font-semibold">{templateVal}</div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {people.map(p => (
                                      <span
                                        key={p.mid}
                                        className="inline-block rounded-md bg-white/20 px-2.5 py-1 text-sm font-semibold shadow-sm"
                                      >
                                        {fmtName(miembrosMap[p.mid], p.nombre)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
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
                {/* logo en esquina superior derecha */}
                <div className="pointer-events-none absolute right-3 top-3 flex items-start justify-end md:right-5 md:top-5">
                  <span className="logo-wrapper">
                    <Image src={logoSrc} alt="" width={96} height={96} className="logo-spin h-16 w-16 object-contain md:h-20 md:w-20" />
                  </span>
                </div>
              </div>
            )
          })}

          {/* nav arrows */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className={`group absolute left-0 top-1/2 z-30 -translate-x-4 -translate-y-1/2 ${
              !hasPrev ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-label="Día anterior"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95">
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute -inset-2 rounded-full border-2 border-primary/30 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110" />
              <ChevronLeft className="relative h-6 w-6 drop-shadow-sm" />
            </div>
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className={`group absolute right-0 top-1/2 z-30 translate-x-4 -translate-y-1/2 ${
              !hasNext ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            aria-label="Día siguiente"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95">
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute -inset-2 rounded-full border-2 border-primary/30 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110" />
              <ChevronRight className="relative h-6 w-6 drop-shadow-sm" />
            </div>
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

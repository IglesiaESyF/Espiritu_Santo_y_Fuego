'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

interface SlotCulto {
  titulo: string
  preside: string
  lectura: string
  predicacion: string
  limpieza: string
  hora_inicio: string
  hora_fin: string
}

type SemanaCultos = Record<string, SlotCulto[]>

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
}

function SlotCard({ slot }: { slot: SlotCulto }) {
  return (
    <>
      {slot.titulo && (
        <h3 className="mb-2 text-sm font-bold text-dark leading-tight">{slot.titulo}</h3>
      )}
      <table className="w-full">
        <tbody>
          {slot.preside && (
            <tr className="border-b border-gray-100/80 last:border-0">
              <td className="w-1/2 py-1 pr-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Preside</td>
              <td className="py-1 text-[11px] font-medium text-dark/80">{slot.preside}</td>
            </tr>
          )}
          {slot.lectura && (
            <tr className="border-b border-gray-100/80 last:border-0">
              <td className="w-1/2 py-1 pr-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Lectura</td>
              <td className="py-1 text-[11px] font-medium text-dark/80">{slot.lectura}</td>
            </tr>
          )}
          {slot.predicacion && (
            <tr className="border-b border-gray-100/80 last:border-0">
              <td className="w-1/2 py-1 pr-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Predicación</td>
              <td className="py-1 text-[11px] font-medium text-dark/80">{slot.predicacion}</td>
            </tr>
          )}
          {slot.limpieza && (
            <tr className="border-b border-gray-100/80 last:border-0">
              <td className="w-1/2 py-1 pr-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Limpieza</td>
              <td className="py-1 text-[11px] font-medium text-dark/80">{slot.limpieza}</td>
            </tr>
          )}
        </tbody>
      </table>
      {(slot.hora_inicio || slot.hora_fin) && (
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] font-medium text-primary/70">
          <Clock className="h-3.5 w-3.5" />
          <span>{slot.hora_inicio}{slot.hora_inicio && slot.hora_fin ? ' — ' : ''}{slot.hora_fin}</span>
        </div>
      )}
    </>
  )
}

export default function CultosPage() {
  const [semana, setSemana] = useState<SemanaCultos>({})

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'cultos-semana'), (snap) => {
      if (snap.exists()) setSemana(snap.data() as SemanaCultos)
    })
    return () => unsub()
  }, [])

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 bg-elegant">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gold-accent shadow-lg shadow-primary/20">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-dark">
            Cultos de la <span className="text-primary">Semana</span>
          </h1>
          <p className="mt-2 text-base text-gray-500 tracking-wide">Horarios y programación semanal</p>
        </div>

        {/* Mobile: swipe carousel */}
        <div className="flex gap-4 overflow-x-auto px-1 pb-4 swipe-container md:hidden">
          {DIAS.map((dia, idx) => {
            const slots = semana[dia] || []
            return (
              <div
                key={dia}
                className={`swipe-slide flex w-[85vw] flex-col rounded-2xl p-5 animate-stagger ${
                  slots.length ? 'card-glass' : 'card-glass-inactive'
                }`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <DayHeader dia={dia} hasSlots={!!slots.length} />
                {slots.length ? <DaySlots slots={slots} /> : <DayEmpty />}
              </div>
            )
          })}
        </div>

        {/* Desktop: 7-column grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
          {DIAS.map((dia, idx) => {
            const slots = semana[dia] || []
            return (
              <div
                key={dia}
                className={`flex flex-col rounded-2xl p-5 animate-stagger ${
                  slots.length ? 'card-glass' : 'card-glass-inactive'
                }`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <DayHeader dia={dia} hasSlots={!!slots.length} />
                {slots.length ? <DaySlots slots={slots} /> : <DayEmpty />}
              </div>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}

function DayHeader({ dia, hasSlots }: { dia: string; hasSlots: boolean }) {
  return (
    <div className={`mb-4 rounded-xl px-3 py-2 text-center text-sm font-bold tracking-wider uppercase ${
      hasSlots ? 'gold-accent text-white shadow-sm shadow-primary/10' : 'bg-gray-200/70 text-gray-400'
    }`}>
      {DIAS_LABEL[dia]}
    </div>
  )
}

function DayEmpty() {
  return <p className="py-6 text-center text-xs text-gray-400">Sin actividad</p>
}

function DaySlots({ slots }: { slots: SlotCulto[] }) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      {slots.map((slot, i) => (
        <div key={i} className={i > 0 ? 'border-t border-dashed border-primary/10 pt-3' : ''}>
          <SlotCard slot={slot} />
        </div>
      ))}
    </div>
  )
}

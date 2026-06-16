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
      {slot.titulo && <h3 className="mb-1 text-sm font-bold text-dark">{slot.titulo}</h3>}
      <table className="w-full">
        <tbody>
          {slot.preside && <tr><td className="w-1/2 pr-2 font-medium text-gray-500">Preside</td><td className="text-dark">{slot.preside}</td></tr>}
          {slot.lectura && <tr><td className="pr-2 font-medium text-gray-500">Lectura</td><td className="text-dark">{slot.lectura}</td></tr>}
          {slot.predicacion && <tr><td className="pr-2 font-medium text-gray-500">Predicación</td><td className="text-dark">{slot.predicacion}</td></tr>}
          {slot.limpieza && <tr><td className="pr-2 font-medium text-gray-500">Limpieza</td><td className="text-dark">{slot.limpieza}</td></tr>}
        </tbody>
      </table>
      {(slot.hora_inicio || slot.hora_fin) && (
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
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
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-dark">Cultos de la Semana</h1>
          <p className="mt-2 text-gray-600">Horarios y programación semanal</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {DIAS.map((dia) => {
            const slots = semana[dia] || []
            return (
              <div
                key={dia}
                className={`flex flex-col rounded-xl border p-4 shadow-sm ${
                  slots.length ? 'border-primary/20 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className={`mb-3 rounded-lg px-3 py-1.5 text-center text-sm font-bold ${
                  slots.length ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {DIAS_LABEL[dia]}
                </div>

                {!slots.length ? (
                  <p className="py-6 text-center text-xs text-gray-400">Sin actividad</p>
                ) : (
                  <div className="flex flex-1 flex-col gap-4 text-xs">
                    {slots.map((slot, i) => (
                      <div key={i} className={i > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                        <SlotCard slot={slot} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}

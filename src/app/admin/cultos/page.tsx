'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, ChevronDown, ChevronRight, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

interface DiaCulto {
  titulo: string
  preside: string
  lectura: string
  predicacion: string
  limpieza: string
  hora_inicio: string
  hora_fin: string
}

type SemanaCultos = Record<string, DiaCulto>

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
}

function defaultDay(): DiaCulto {
  return { titulo: '', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '', hora_fin: '' }
}

function timeout(ms: number) {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

export default function AdminCultosPage() {
  const router = useRouter()
  const [semana, setSemana] = useState<SemanaCultos>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string[]>([new Date().toLocaleDateString('es', { weekday: 'long' }).toLowerCase().replace('é', 'e')])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const snap = await Promise.race([getDoc(doc(db, 'config', 'cultos-semana')), timeout(8000)])
      if (snap.exists()) setSemana(snap.data() as SemanaCultos)
    } catch {
      setError('No se pudo cargar la programación.')
    }
  }

  function updateDia(dia: string, field: keyof DiaCulto, value: string) {
    setSemana((prev) => ({
      ...prev,
      [dia]: { ...(prev[dia] || defaultDay()), [field]: value },
    }))
  }

  function toggleDay(dia: string) {
    setExpanded((prev) => prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia])
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await Promise.race([
        setDoc(doc(db, 'config', 'cultos-semana'), { ...semana, updatedAt: serverTimestamp() }),
        timeout(8000),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Error al guardar en Firebase.')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Programación Semanal</h1>
            <p className="text-sm text-gray-500">Configura los cultos de cada día de la semana</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar Todo'}
        </Button>
      </div>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {DIAS.map((dia) => {
          const d = semana[dia] || defaultDay()
          const isOpen = expanded.includes(dia)
          return (
            <Card key={dia}>
              <CardContent className="p-0">
                <button
                  onClick={() => toggleDay(dia)}
                  className="flex w-full items-center gap-2 rounded-t-xl bg-primary px-4 py-3 text-left text-sm font-bold text-white"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <CalendarDays className="h-4 w-4" />
                  {DIAS_LABEL[dia]}
                  {d.titulo && <span className="ml-auto text-xs font-normal text-white/70">{d.titulo}</span>}
                </button>

                {isOpen && (
                  <div className="space-y-3 p-4">
                    <Input label="Título" placeholder="Ej: Culto de Oración" value={d.titulo} onChange={(e) => updateDia(dia, 'titulo', e.target.value)} />
                    <Input label="Preside" placeholder="Hermano(a)…" value={d.preside} onChange={(e) => updateDia(dia, 'preside', e.target.value)} />
                    <Input label="Lectura Bíblica" placeholder="Hermano(a)…" value={d.lectura} onChange={(e) => updateDia(dia, 'lectura', e.target.value)} />
                    <Input label="Predicación" placeholder="Pastor / Hermano(a)…" value={d.predicacion} onChange={(e) => updateDia(dia, 'predicacion', e.target.value)} />
                    <Input label="Limpieza" placeholder="Hermanas…" value={d.limpieza} onChange={(e) => updateDia(dia, 'limpieza', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Inicio" type="time" value={d.hora_inicio} onChange={(e) => updateDia(dia, 'hora_inicio', e.target.value)} />
                      <Input label="Fin" type="time" value={d.hora_fin} onChange={(e) => updateDia(dia, 'hora_fin', e.target.value)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

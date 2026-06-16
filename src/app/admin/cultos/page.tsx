'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, ChevronDown, ChevronRight, CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

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

function emptySlot(): SlotCulto {
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
  const [expanded, setExpanded] = useState<string[]>(DIAS)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const snap = await Promise.race([getDoc(doc(db, 'config', 'cultos-semana')), timeout(8000)])
      if (snap.exists()) {
        const data = snap.data() as SemanaCultos
        setSemana(data)
      } else {
        const defaults: SemanaCultos = {
          lunes: [],
          martes: [{ titulo: 'Culto de Oración y Testimonio', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '19:00', hora_fin: '21:00' }],
          miercoles: [{ titulo: 'Culto de Damas', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '19:00', hora_fin: '21:00' }],
          jueves: [{ titulo: 'Estudio Bíblico', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '19:00', hora_fin: '21:00' }],
          viernes: [],
          sabado: [{ titulo: 'Culto de Servicio a Dios', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '19:00', hora_fin: '21:00' }],
          domingo: [
            { titulo: 'Escuela Dominical', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '09:00', hora_fin: '11:00' },
            { titulo: 'Culto Evangelístico y Milagros', preside: '', lectura: '', predicacion: '', limpieza: '', hora_inicio: '17:00', hora_fin: '19:00' },
          ],
        }
        setSemana(defaults)
      }
    } catch {
      setError('No se pudo cargar la programación.')
    }
  }

  function updateSlot(dia: string, slotIdx: number, field: keyof SlotCulto, value: string) {
    setSemana((prev) => {
      const slots = [...(prev[dia] || [])]
      if (!slots[slotIdx]) slots[slotIdx] = emptySlot()
      slots[slotIdx] = { ...slots[slotIdx], [field]: value }
      return { ...prev, [dia]: slots }
    })
  }

  function addSlot(dia: string) {
    setSemana((prev) => ({ ...prev, [dia]: [...(prev[dia] || []), emptySlot()] }))
  }

  function removeSlot(dia: string, slotIdx: number) {
    setSemana((prev) => ({ ...prev, [dia]: (prev[dia] || []).filter((_, i) => i !== slotIdx) }))
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

  const totalSlots = Object.values(semana).reduce((sum, s) => sum + s.length, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Programación Semanal</h1>
            <p className="text-sm text-gray-500">{totalSlots} horario{totalSlots !== 1 ? 's' : ''} configurados</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar Todo'}
        </Button>
      </div>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {DIAS.map((dia) => {
          const slots = semana[dia] || []
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
                  {slots.length > 0 && <span className="ml-auto text-xs font-normal text-white/70">{slots.length} horario{slots.length > 1 ? 's' : ''}</span>}
                </button>

                {isOpen && (
                  <div className="space-y-4 p-4">
                    {slots.map((slot, i) => (
                      <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">Horario {i + 1}</span>
                          {slots.length > 1 && (
                            <button onClick={() => removeSlot(dia, i)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <Input label="Título" value={slot.titulo} onChange={(e) => updateSlot(dia, i, 'titulo', e.target.value)} />
                        <Input label="Preside" value={slot.preside} onChange={(e) => updateSlot(dia, i, 'preside', e.target.value)} />
                        <Input label="Lectura Bíblica" value={slot.lectura} onChange={(e) => updateSlot(dia, i, 'lectura', e.target.value)} />
                        <Input label="Predicación" value={slot.predicacion} onChange={(e) => updateSlot(dia, i, 'predicacion', e.target.value)} />
                        <Input label="Limpieza" value={slot.limpieza} onChange={(e) => updateSlot(dia, i, 'limpieza', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="Inicio" type="time" value={slot.hora_inicio} onChange={(e) => updateSlot(dia, i, 'hora_inicio', e.target.value)} />
                          <Input label="Fin" type="time" value={slot.hora_fin} onChange={(e) => updateSlot(dia, i, 'hora_fin', e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addSlot(dia)} className="w-full">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Agregar horario
                    </Button>
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

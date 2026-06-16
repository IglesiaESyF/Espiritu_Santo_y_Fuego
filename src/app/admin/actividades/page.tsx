'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'

interface Actividad {
  id?: string
  titulo: string
  descripcion: string
  fecha: string
  hora: string
  lugar: string
}

const STORAGE_KEY = 'iesfuego-actividades'
const FIRESTORE_COLLECTION = 'actividades'

export default function AdminActividadesPage() {
  const router = useRouter()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [lugar, setLugar] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadActividades()
  }, [])

  async function loadActividades() {
    try {
      const snap = await getDocs(collection(db, FIRESTORE_COLLECTION))
      if (!snap.empty) {
        const list: Actividad[] = []
        snap.forEach((d) => list.push({ id: d.id, ...d.data() as Actividad }))
        setActividades(list)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
        return
      }
    } catch {}
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setActividades(JSON.parse(stored)) } catch {}
    }
  }

  function resetForm() {
    setTitulo('')
    setDescripcion('')
    setFecha('')
    setHora('')
    setLugar('')
    setEditingId(null)
  }

  function openEdit(a: Actividad) {
    setTitulo(a.titulo)
    setDescripcion(a.descripcion)
    setFecha(a.fecha)
    setHora(a.hora)
    setLugar(a.lugar)
    setEditingId(a.id || null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data: Actividad = { titulo, descripcion, fecha, hora, lugar }

    try {
      if (editingId) {
        await updateDoc(doc(db, FIRESTORE_COLLECTION, editingId), { ...data, updatedAt: serverTimestamp() })
      } else {
        const ref = await addDoc(collection(db, FIRESTORE_COLLECTION), { ...data, createdAt: serverTimestamp() })
        data.id = ref.id
      }
    } catch {}

    if (editingId) {
      setActividades((prev) => prev.map((a) => (a.id === editingId ? { ...data, id: editingId } : a)))
    } else {
      setActividades((prev) => [...prev, data])
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(
      editingId
        ? actividades.map((a) => (a.id === editingId ? { ...data, id: editingId } : a))
        : [...actividades, data],
    ))

    resetForm()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    try { await deleteDoc(doc(db, FIRESTORE_COLLECTION, id)) } catch {}
    const updated = actividades.filter((a) => a.id !== id)
    setActividades(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-dark">Actividades</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancelar' : 'Nueva Actividad'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Título" placeholder="Nombre de la actividad" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              <Input label="Descripción" placeholder="Descripción breve" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                <Input label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>
              <Input label="Lugar" placeholder="Ubicación" value={lugar} onChange={(e) => setLugar(e.target.value)} />
              <div className="flex gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actividades.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>No hay actividades registradas aún.</p>
            <p className="mt-1 text-sm">Crea la primera usando el botón "Nueva Actividad".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actividades.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="flex-1">
                  <h3 className="font-bold text-dark">{a.titulo}</h3>
                  <p className="mt-1 text-sm text-gray-600">{a.descripcion}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    {a.fecha && <span>{a.fecha}</span>}
                    {a.hora && <span>{a.hora}</span>}
                    {a.lugar && <span>{a.lugar}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(a)} className="text-primary hover:text-primary-dark"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (a.id) handleDelete(a.id) }} className="text-accent hover:text-accent-light"><Trash2 className="h-4 w-4" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

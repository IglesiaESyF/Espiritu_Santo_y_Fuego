'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, User, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { saveMovimiento, updateMovimiento } from '@/lib/caja-storage'

const COLLECTION = 'caja-movimientos'

const CAT_ICONS: Record<string, string> = {
  ofrendas: '🙏',
  donaciones: '🎁',
  actividades: '📋',
}

export default function NuevoIngresoPage() {
  const router = useRouter()
  const { puede } = useAuth()
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [ingresadoPor, setIngresadoPor] = useState('')
  const [firmaTesorera, setFirmaTesorera] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [showFirma, setShowFirma] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setEditId(id)
      const fetchData = async () => {
        try {
          const snap = await getDoc(doc(db, COLLECTION, id))
          if (snap.exists()) {
            const data = snap.data()
            setCategoria(data.categoria || '')
            setMonto(String(data.monto || ''))
            setConcepto(data.concepto || '')
            setFecha(data.fecha || new Date().toISOString().split('T')[0])
            setIngresadoPor(data.ingresadoPor || '')
            setFirmaTesorera(data.firmaTesorera || '')
          }
        } catch (e) {
          console.error('Error fetching record:', e)
        }
        setCargandoDatos(false)
      }
      fetchData()
    } else {
      setCargandoDatos(false)
    }
    if (!puede('caja', 'crear')) router.replace('/admin/caja')
    const saved = localStorage.getItem('iesfuego-user')
    if (saved) setIngresadoPor(saved)
  }, [])

  useEffect(() => {
    setShowFirma(categoria === 'actividades')
    if (categoria !== 'actividades') setFirmaTesorera('')
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    if (ingresadoPor) localStorage.setItem('iesfuego-user', ingresadoPor)
    const movimiento: MovimientoCaja = {
      id: editId || '',
      tipo: 'ingreso',
      categoria,
      monto: parseFloat(monto),
      concepto,
      fecha,
      ingresadoPor,
      firmaTesorera,
      creadoEn: Date.now(),
    }
    try {
      await Promise.race([
        editId ? updateMovimiento(movimiento) : saveMovimiento(movimiento),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])
      router.push('/admin/caja')
    } catch {
      setError('Error al guardar en Firebase. Intenta de nuevo.')
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {cargandoDatos ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      ) : (
      <>
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">{editId ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h1>
          <p className="mt-0.5 text-sm text-gray-400">{editId ? 'Actualiza los datos del ingreso' : 'Registra un nuevo ingreso a la iglesia'}</p>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <FileText className="h-3.5 w-3.5" /> Información del Ingreso
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={!puede('caja', 'editar') && !!editId} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS_INGRESO.map((c) => (
                    <option key={c.value} value={c.value}>{CAT_ICONS[c.value] || '📌'} {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary/60" style={{ fontFamily: "'Times New Roman', serif" }}>C$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={monto}
                    disabled={!puede('caja', 'editar') && !!editId} onChange={(e) => setMonto(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-lg font-bold tabular-nums tracking-tight transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <Input
                label="Concepto"
                placeholder="Ej: Ofrenda dominical"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Calendar className="h-3.5 w-3.5" /> Detalles
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fecha de Ingreso"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <User className="mr-1 inline h-3.5 w-3.5" /> Ingresado por
                </label>
                <input
                  type="text"
                  value={ingresadoPor}
                  disabled={!puede('caja', 'editar') && !!editId} onChange={(e) => setIngresadoPor(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>
          </div>

          {showFirma && (
            <div className="border-t border-gray-100 pt-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Firma de quien entrega el dinero
              </div>
              <input
                type="text"
                value={firmaTesorera}
                onChange={(e) => setFirmaTesorera(e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
                required
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full h-12 text-base font-semibold" disabled={saving || (!puede('caja', 'editar') && !!editId)}>
            <Save className="mr-2 h-5 w-5" /> {saving ? 'Guardando…' : (editId ? (!puede('caja', 'editar') ? 'Solo lectura' : 'Actualizar Ingreso') : 'Registrar Ingreso')}
          </Button>
        </form>
      </div>
      </>
      )}
    </div>
  )
}

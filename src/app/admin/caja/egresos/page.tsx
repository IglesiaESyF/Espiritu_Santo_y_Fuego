'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Camera, User, TrendingDown, FileText, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { saveMovimiento } from '@/lib/caja-storage'

const CAT_ICONS: Record<string, string> = {
  luz: '⚡',
  agua: '💧',
  telefono: '📞',
  mantenimiento: '🔧',
  evento: '🎉',
  actividades: '📋',
  otro: '📦',
}

export default function NuevoEgresoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [solicitadoPor, setSolicitadoPor] = useState('')
  const [aprobadoPor, setAprobadoPor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotoFactura, setFotoFactura] = useState('')
  const [fotoPreview, setFotoPreview] = useState('')
  const [firmaSolicitante, setFirmaSolicitante] = useState('')
  const [firmaPastor, setFirmaPastor] = useState('')
  const [showFirmas, setShowFirmas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('iesfuego-user')
    if (saved) setSolicitadoPor(saved)
  }, [])

  useEffect(() => {
    setShowFirmas(categoria === 'actividades')
  }, [categoria])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setFotoPreview(dataUrl)
      setFotoFactura(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const clearFoto = () => {
    setFotoPreview('')
    setFotoFactura('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    if (solicitadoPor) localStorage.setItem('iesfuego-user', solicitadoPor)
    const movimiento: MovimientoCaja = {
      id: '',
      tipo: 'egreso',
      categoria,
      monto: parseFloat(monto),
      concepto,
      fecha,
      ingresadoPor: solicitadoPor,
      aprobadoPor,
      descripcion,
      fotoFactura,
      firmaSolicitante,
      firmaPastor,
      creadoEn: Date.now(),
    }
    try {
      await Promise.race([
        saveMovimiento(movimiento),
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
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dark">Nuevo Egreso</h1>
          <p className="mt-0.5 text-sm text-gray-400">Registra un nuevo egreso de la iglesia</p>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Información principal */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <FileText className="h-3.5 w-3.5" /> Información del Egreso
            </div>
            <div className="space-y-4">
              {/* Categoría */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS_EGRESO.map((c) => (
                    <option key={c.value} value={c.value}>{CAT_ICONS[c.value] || '📌'} {c.label}</option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-accent/60" style={{ fontFamily: "'Times New Roman', serif" }}>C$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-lg font-bold tabular-nums tracking-tight transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Concepto */}
              <Input
                label="Concepto"
                placeholder="Ej: Pago de electricidad"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Sección: Detalles */}
          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Calendar className="h-3.5 w-3.5" /> Detalles
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fecha de Egreso"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <User className="mr-1 inline h-3.5 w-3.5" /> Solicitado por
                </label>
                <input
                  type="text"
                  value={solicitadoPor}
                  onChange={(e) => setSolicitadoPor(e.target.value)}
                  placeholder="Nombre de quien solicita"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Aprobado por
                </label>
                <input
                  type="text"
                  value={aprobadoPor}
                  onChange={(e) => setAprobadoPor(e.target.value)}
                  placeholder="Nombre de quien aprueba"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección: Opcionales */}
          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Información Adicional <span className="font-normal lowercase text-gray-300">(opcional)</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Camera className="mr-1 inline h-3.5 w-3.5" /> Foto de Factura
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-primary-dark focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                />
                {fotoPreview && (
                  <div className="relative mt-3 inline-block">
                    <img src={fotoPreview} alt="Vista previa" className="h-32 w-48 rounded-xl border object-cover shadow-sm" />
                    <button type="button" onClick={clearFoto} className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  rows={3}
                  placeholder="Notas adicionales sobre este egreso..."
                />
              </div>

              {showFirmas && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Firma de quien solicita el dinero
                    </label>
                    <input
                      type="text"
                      value={firmaSolicitante}
                      onChange={(e) => setFirmaSolicitante(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Firma del Pastor (aprobación)
                    </label>
                    <input
                      type="text"
                      value={firmaPastor}
                      onChange={(e) => setFirmaPastor(e.target.value)}
                      placeholder="Nombre del Pastor"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full h-12 text-base font-semibold" disabled={saving}>
            <Save className="mr-2 h-5 w-5" /> {saving ? 'Guardando…' : 'Registrar Egreso'}
          </Button>
        </form>
      </div>
    </div>
  )
}

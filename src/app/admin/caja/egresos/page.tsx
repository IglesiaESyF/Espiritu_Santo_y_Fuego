'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Camera, User, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { saveMovimiento } from '@/lib/caja-storage'

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
  const [firmaTesorera, setFirmaTesorera] = useState('')
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
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-dark">Nuevo Egreso</h1>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                required
              >
                <option value="">Seleccionar categoría</option>
                {CATEGORIAS_EGRESO.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Monto (C$)"
              type="number"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />

            <Input
              label="Concepto"
              placeholder="Ej: Pago de electricidad"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
            />

            <Input
              label="Fecha de Egreso"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <User className="mr-1 inline h-4 w-4" /> Dinero Solicitado por
              </label>
              <input
                type="text"
                value={solicitadoPor}
                onChange={(e) => setSolicitadoPor(e.target.value)}
                placeholder="Nombre de quien solicita"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Aprobado por
              </label>
              <input
                type="text"
                value={aprobadoPor}
                onChange={(e) => setAprobadoPor(e.target.value)}
                placeholder="Nombre de quien aprueba"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Camera className="mr-1 inline h-4 w-4" /> Foto de Factura <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-primary-dark focus:border-primary focus:outline-none"
              />
              {fotoPreview && (
                <div className="relative mt-2 inline-block">
                  <img src={fotoPreview} alt="Vista previa" className="h-32 w-48 rounded-lg border object-cover" />
                  <button type="button" onClick={clearFoto} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción <span className="text-gray-400">(opcional)</span></label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                rows={3}
              />
            </div>

            {showFirmas && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Firma de quien solicita el dinero
                  </label>
                  <input
                    type="text"
                    value={firmaSolicitante}
                    onChange={(e) => setFirmaSolicitante(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Firma del Pastor (aprobación)
                  </label>
                  <input
                    type="text"
                    value={firmaPastor}
                    onChange={(e) => setFirmaPastor(e.target.value)}
                    placeholder="Nombre del Pastor"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Guardando…' : 'Registrar Egreso'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

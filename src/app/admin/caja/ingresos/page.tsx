'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Camera, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_INGRESO, MovimientoCaja } from '@/types'
import { saveMovimiento } from '@/lib/caja-storage'

export default function NuevoIngresoPage() {
  const router = useRouter()
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [ingresadoPor, setIngresadoPor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotoFactura, setFotoFactura] = useState('')
  const [firmaTesorera, setFirmaTesorera] = useState('')
  const [showFirma, setShowFirma] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('iesfuego-user')
    if (saved) setIngresadoPor(saved)
  }, [])

  useEffect(() => {
    setShowFirma(categoria === 'actividades')
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    if (ingresadoPor) localStorage.setItem('iesfuego-user', ingresadoPor)
    const movimiento: MovimientoCaja = {
      id: '',
      tipo: 'ingreso',
      categoria,
      monto: parseFloat(monto),
      concepto,
      fecha,
      ingresadoPor,
      descripcion,
      fotoFactura,
      firmaTesorera,
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
        <h1 className="text-2xl font-bold text-dark">Nuevo Ingreso</h1>
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
                {CATEGORIAS_INGRESO.map((c) => (
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
              placeholder="Ej: Ofrenda dominical"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
            />

            <Input
              label="Fecha de Ingreso"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <User className="mr-1 inline h-4 w-4" /> Ingresado por
              </label>
              <input
                type="text"
                value={ingresadoPor}
                onChange={(e) => setIngresadoPor(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Camera className="mr-1 inline h-4 w-4" /> Foto de Factura <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={fotoFactura}
                onChange={(e) => setFotoFactura(e.target.value)}
                placeholder="URL de la imagen"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
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

            {showFirma && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Firma de quien entrega el dinero
                </label>
                <input
                  type="text"
                  value={firmaTesorera}
                  onChange={(e) => setFirmaTesorera(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  required
                />
              </div>
            )}

            {error && <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Guardando…' : 'Registrar Ingreso'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

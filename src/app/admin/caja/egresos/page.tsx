'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Camera, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIAS_EGRESO } from '@/types'

export default function NuevoEgresoPage() {
  const router = useRouter()
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [ingresadoPor, setIngresadoPor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotoFactura, setFotoFactura] = useState('')
  const [firmaTesorera, setFirmaTesorera] = useState('')
  const [firmaSolicitante, setFirmaSolicitante] = useState('')
  const [firmaPastor, setFirmaPastor] = useState('')
  const [showFirmas, setShowFirmas] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('iesfuego-user')
    if (saved) setIngresadoPor(saved)
  }, [])

  useEffect(() => {
    setShowFirmas(categoria === 'actividades')
  }, [categoria])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ingresadoPor) localStorage.setItem('iesfuego-user', ingresadoPor)
    // TODO: save to Firebase
    router.push('/admin/caja')
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

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <Save className="mr-2 h-4 w-4" /> Registrar Egreso
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

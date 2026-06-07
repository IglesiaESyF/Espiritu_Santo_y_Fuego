'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminCultosPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Cultos</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo Culto
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-5">
            <Input label="Título del Culto" placeholder="Ej: Culto de Fe y Esperanza" />
            <Input label="Predicador" placeholder="Nombre del predicador" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Fecha" type="date" />
              <Input label="Hora" type="time" />
            </div>
            <Input label="Descripción" placeholder="Descripción del culto" />
            <Input label="URL del Video (opcional)" placeholder="https://youtube.com/..." />
            <div className="flex gap-3">
              <Button variant="primary" size="sm">Guardar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <p>No hay cultos registrados aún.</p>
          <p className="mt-1 text-sm">Crea el primer culto usando el botón "Nuevo Culto".</p>
        </CardContent>
      </Card>
    </div>
  )
}

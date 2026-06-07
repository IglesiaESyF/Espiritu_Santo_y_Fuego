'use client'

import { FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Reportes</h1>
        <p className="text-sm text-gray-500">Genera reportes de caja por período</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {['Enero', 'Febrero', 'Marzo'].map((mes) => (
          <Card key={mes}>
            <CardHeader>
              <h3 className="font-semibold text-dark">{mes} 2026</h3>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1 text-sm text-gray-600">
                <p>Ingresos: <span className="font-semibold text-green-600">RD$ 0.00</span></p>
                <p>Egresos: <span className="font-semibold text-red-600">RD$ 0.00</span></p>
                <p>Saldo: <span className="font-semibold text-blue-600">RD$ 0.00</span></p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" /> Descargar Reporte
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

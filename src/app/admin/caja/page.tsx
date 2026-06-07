'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CajaPage() {
  const [tab, setTab] = useState<'ingresos' | 'egresos'>('ingresos')

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Caja</h1>
        <Link href={tab === 'ingresos' ? '/admin/caja/ingresos' : '/admin/caja/egresos'}>
          <Button variant="primary" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nuevo {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Ingresos</p>
              <p className="text-xl font-bold text-green-600">C$ 0.00</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-red-100 p-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Egresos</p>
              <p className="text-xl font-bold text-red-600">C$ 0.00</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-100 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo Actual</p>
              <p className="text-xl font-bold text-blue-600">C$ 0.00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab('ingresos')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'ingresos' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
          }`}
        >
          <ArrowUpCircle className="mr-1 inline h-4 w-4" /> Ingresos
        </button>
        <button
          onClick={() => setTab('egresos')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'egresos' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
          }`}
        >
          <ArrowDownCircle className="mr-1 inline h-4 w-4" /> Egresos
        </button>
      </div>

      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <DollarSign className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p>No hay {tab === 'ingresos' ? 'ingresos' : 'egresos'} registrados.</p>
          <p className="mt-1 text-sm">
            Agrega el primer {tab === 'ingresos' ? 'ingreso' : 'egreso'} usando el botón superior.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

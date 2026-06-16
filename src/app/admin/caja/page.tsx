'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { getMovimientos } from '@/lib/caja-storage'

const labelCat = (val: string) => [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO].find((c) => c.value === val)?.label || val

export default function CajaPage() {
  const [tab, setTab] = useState<'ingresos' | 'egresos'>('ingresos')
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovimientos()
  }, [])

  async function loadMovimientos() {
    try {
      const list = await Promise.race([
        getMovimientos(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])
      setMovimientos(list)
    } catch {}
    setLoading(false)
  }

  const filtrados = useMemo(() => {
    return movimientos.filter((m) => m.tipo === (tab === 'ingresos' ? 'ingreso' : 'egreso'))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [movimientos, tab])

  const totalIngresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0),
    [movimientos]
  )

  const totalEgresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0),
    [movimientos]
  )

  const saldo = totalIngresos - totalEgresos

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Caja</h1>
        <div className="flex gap-2">
          <Link href="/admin/caja/reportes">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-1 h-4 w-4" /> Reportes
            </Button>
          </Link>
          <Link href={tab === 'ingresos' ? '/admin/caja/ingresos' : '/admin/caja/egresos'}>
            <Button variant="primary" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nuevo {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Ingresos</p>
              <p className="text-xl font-bold text-green-600">C$ {totalIngresos.toFixed(2)}</p>
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
              <p className="text-xl font-bold text-red-600">C$ {totalEgresos.toFixed(2)}</p>
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
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                C$ {saldo.toFixed(2)}
              </p>
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

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <DollarSign className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p>No hay {tab === 'ingresos' ? 'ingresos' : 'egresos'} registrados.</p>
            <p className="mt-1 text-sm">
              Agrega el primer {tab === 'ingresos' ? 'ingreso' : 'egreso'} usando el botón superior.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Ingresado por</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{m.fecha}</td>
                      <td className="px-4 py-3 text-gray-600">{labelCat(m.categoria)}</td>
                      <td className="max-w-[250px] truncate px-4 py-3 text-gray-800">{m.concepto}</td>
                      <td className="px-4 py-3 text-gray-600">{m.ingresadoPor}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        C$ {m.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, Printer, TrendingUp, TrendingDown,
  DollarSign, FileText, Filter, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { getMovimientos } from '@/lib/caja-storage'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type FiltroTipo = 'todos' | 'ingreso' | 'egreso'

export default function ReportesPage() {
  const router = useRouter()
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [vistaImpresion, setVistaImpresion] = useState(false)

  useEffect(() => {
    loadMovimientos()
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    setFechaInicio(inicioMes.toISOString().split('T')[0])
    setFechaFin(hoy.toISOString().split('T')[0])
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

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (fechaInicio && m.fecha < fechaInicio) return false
      if (fechaFin && m.fecha > fechaFin) return false
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
      if (filtroCategoria && m.categoria !== filtroCategoria) return false
      return true
    }).sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [movimientos, fechaInicio, fechaFin, filtroTipo, filtroCategoria])

  const totalIngresos = useMemo(
    () => movimientosFiltrados.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0),
    [movimientosFiltrados]
  )

  const totalEgresos = useMemo(
    () => movimientosFiltrados.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0),
    [movimientosFiltrados]
  )

  const saldo = totalIngresos - totalEgresos

  const ingresosPorCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    movimientosFiltrados.filter((m) => m.tipo === 'ingreso').forEach((m) => {
      map[m.categoria] = (map[m.categoria] || 0) + m.monto
    })
    return map
  }, [movimientosFiltrados])

  const egresosPorCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    movimientosFiltrados.filter((m) => m.tipo === 'egreso').forEach((m) => {
      map[m.categoria] = (map[m.categoria] || 0) + m.monto
    })
    return map
  }, [movimientosFiltrados])

  const labelCategoria = (val: string) => {
    const all = [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO]
    return all.find((c) => c.value === val)?.label || val
  }

  const handleImprimir = () => {
    setVistaImpresion(true)
    setTimeout(() => {
      window.print()
      setVistaImpresion(false)
    }, 300)
  }

  const from = fechaInicio ? new Date(fechaInicio + 'T12:00:00') : null
  const to = fechaFin ? new Date(fechaFin + 'T12:00:00') : null

  if (vistaImpresion) {
    return renderReporteImprimible()
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-dark">Reportes</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="ingreso">Solo Ingresos</option>
                <option value="egreso">Solo Egresos</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Categoría</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Todas</option>
                <optgroup label="Ingresos">
                  {CATEGORIAS_INGRESO.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Egresos">
                  {CATEGORIAS_EGRESO.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-xs text-gray-500">Saldo del Período</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                C$ {saldo.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <TrendingUp className="h-4 w-4 text-green-600" /> Ingresos por Categoría
            </h3>
          </CardHeader>
          <CardContent>
            {Object.keys(ingresosPorCategoria).length === 0 ? (
              <p className="text-sm text-gray-400">Sin ingresos en este período.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(ingresosPorCategoria).map(([cat, total]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{labelCategoria(cat)}</span>
                    <span className="font-semibold text-green-600">C$ {total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <TrendingDown className="h-4 w-4 text-red-600" /> Egresos por Categoría
            </h3>
          </CardHeader>
          <CardContent>
            {Object.keys(egresosPorCategoria).length === 0 ? (
              <p className="text-sm text-gray-400">Sin egresos en este período.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(egresosPorCategoria).map(([cat, total]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{labelCategoria(cat)}</span>
                    <span className="font-semibold text-red-600">C$ {total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <FileText className="h-4 w-4 text-primary" /> Detalle de Movimientos ({movimientosFiltrados.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleImprimir}>
                <Printer className="mr-1 h-4 w-4" /> Reporte Profesional
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {movimientosFiltrados.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              No hay movimientos en este período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Ingresado por</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimientosFiltrados.map((m, i) => (
                    <tr key={m.id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{m.fecha}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{labelCategoria(m.categoria)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-800">{m.concepto}</td>
                      <td className="px-4 py-3 text-gray-600">{m.ingresadoPor}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        C$ {m.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Totales:</td>
                    <td className="px-4 py-3 text-right text-green-600">C$ {totalIngresos.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-gray-600"></td>
                    <td className="px-4 py-3 text-right text-red-600">C$ {totalEgresos.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-gray-600">Saldo:</td>
                    <td className={`px-4 py-3 text-right ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      C$ {saldo.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  function renderReporteImprimible() {
    return (
      <div className="mx-auto max-w-4xl bg-white p-8">
        <div className="mb-8 text-center border-b pb-6">
          <h1 className="text-2xl font-bold text-dark">Iglesia Espíritu Santo y Fuego</h1>
          <p className="text-sm text-gray-500">Misión Cristiana Perfectos en Unidad</p>
          <p className="text-xs text-gray-400">Gasolinera Uno Tipitapa. 10c 1/2 al Oeste. / Tipitapa, Nicaragua</p>
          <p className="text-xs text-gray-400">Tel: 8438-6180 / 8321-2177 | Email: iglesiamadreesf@gmail.com</p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-dark uppercase tracking-wide">Reporte de Ingresos y Egresos</h2>
          <p className="text-sm text-gray-500">
            Período: {from?.toLocaleDateString('es-ES')} al {to?.toLocaleDateString('es-ES')}
          </p>
          <p className="text-xs text-gray-400">Fecha de generación: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-xs text-green-700 uppercase font-semibold">Total Ingresos</p>
            <p className="text-xl font-bold text-green-600">C$ {totalIngresos.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-xs text-red-700 uppercase font-semibold">Total Egresos</p>
            <p className="text-xl font-bold text-red-600">C$ {totalEgresos.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-xs text-blue-700 uppercase font-semibold">Saldo</p>
            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              C$ {saldo.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-sm font-bold text-green-700 uppercase">Ingresos por Categoría</h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(ingresosPorCategoria).map(([cat, total]) => (
                  <tr key={cat} className="border-b">
                    <td className="py-1.5 text-gray-600">{labelCategoria(cat)}</td>
                    <td className="py-1.5 text-right font-semibold text-green-600">C$ {total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-1.5 text-gray-800">Total Ingresos</td>
                  <td className="py-1.5 text-right text-green-600">C$ {totalIngresos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-red-700 uppercase">Egresos por Categoría</h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(egresosPorCategoria).map(([cat, total]) => (
                  <tr key={cat} className="border-b">
                    <td className="py-1.5 text-gray-600">{labelCategoria(cat)}</td>
                    <td className="py-1.5 text-right font-semibold text-red-600">C$ {total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-1.5 text-gray-800">Total Egresos</td>
                  <td className="py-1.5 text-right text-red-600">C$ {totalEgresos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-3 text-sm font-bold text-gray-700 uppercase">Detalle de Movimientos</h3>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">No.</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Fecha</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Tipo</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Categoría</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Concepto</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Responsable</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.map((m, i) => (
                <tr key={m.id || i}>
                  <td className="border border-gray-300 px-3 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{m.fecha}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{labelCategoria(m.categoria)}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{m.concepto}{m.descripcion ? ` - ${m.descripcion}` : ''}</td>
                  <td className="border border-gray-300 px-3 py-1.5">{m.ingresadoPor}</td>
                  <td className={`border border-gray-300 px-3 py-1.5 text-right font-semibold ${
                    m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    C$ {m.monto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-2 text-right">Total Ingresos:</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-green-600">C$ {totalIngresos.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-2 text-right">Total Egresos:</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-red-600">C$ {totalEgresos.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-2 text-right">Saldo Neto:</td>
                <td className={`border border-gray-300 px-3 py-2 text-right ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  C$ {saldo.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
          <div>
            <div className="mb-12 border-b border-gray-400" />
            <p className="text-gray-600 font-medium">Tesorero(a)</p>
            <p className="text-xs text-gray-400">Nombre y firma</p>
          </div>
          <div>
            <div className="mb-12 border-b border-gray-400" />
            <p className="text-gray-600 font-medium">Pastor(a)</p>
            <p className="text-xs text-gray-400">Nombre y firma</p>
          </div>
          <div>
            <div className="mb-12 border-b border-gray-400" />
            <p className="text-gray-600 font-medium">Contador(a)</p>
            <p className="text-xs text-gray-400">Nombre y firma</p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Documento generado el {new Date().toLocaleString('es-ES')} - Iglesia Espíritu Santo y Fuego</p>
          <p>Este documento es un extracto oficial de ingresos y egresos.</p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setVistaImpresion(false)}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark print:hidden"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Printer, TrendingUp, TrendingDown,
  FileText, Filter, Calendar, BarChart3, PieChart,
  Download, Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { getMovimientos } from '@/lib/caja-storage'

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type ReporteType = 'detallado' | 'mensual' | 'anual' | 'comparativo'
type FiltroTipo = 'todos' | 'ingreso' | 'egreso'

interface GrupoDiario { fecha: string; ingresos: number; egresos: number; items: MovimientoCaja[] }
interface GrupoSemanal { semana: string; inicio: string; fin: string; ingresos: number; egresos: number; diario: GrupoDiario[] }
interface GrupoMensual { mes: number; anio: number; label: string; ingresos: number; egresos: number; semanal: GrupoSemanal[] }

function labelCategoria(val: string) {
  const all = [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO]
  return all.find((c) => c.value === val)?.label || val
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function dayName(d: string) {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('es-ES', { weekday: 'long' })
}

export default function ReportesPage() {
  const router = useRouter()
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<ReporteType>('detallado')

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth())
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear())

  const [vistaImpresion, setVistaImpresion] = useState(false)

  useEffect(() => {
    loadMovimientos()
    const hoy = new Date()
    setFechaInicio(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
    setFechaFin(hoy.toISOString().split('T')[0])
    setMesSeleccionado(hoy.getMonth())
    setAnioSeleccionado(hoy.getFullYear())
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
      if (reportType === 'mensual') {
        const [y, month] = m.fecha.split('-')
        if (parseInt(y) !== anioSeleccionado || parseInt(month) !== mesSeleccionado + 1) return false
      }
      if (reportType === 'anual') {
        const [y] = m.fecha.split('-')
        if (parseInt(y) !== anioSeleccionado) return false
      }
      if (fechaInicio && m.fecha < fechaInicio) return false
      if (fechaFin && m.fecha > fechaFin) return false
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
      if (filtroCategoria && m.categoria !== filtroCategoria) return false
      return true
    }).sort((a, b) => a.fecha.localeCompare(a.fecha))
  }, [movimientos, fechaInicio, fechaFin, filtroTipo, filtroCategoria, reportType, mesSeleccionado, anioSeleccionado])

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

  const from = fechaInicio ? new Date(fechaInicio + 'T12:00:00') : null
  const to = fechaFin ? new Date(fechaFin + 'T12:00:00') : null

  const handleImprimir = () => {
    const s = document.createElement('style')
    s.id = 'print-styles'
    s.textContent = `@media print{@page{margin:0.5in}aside,header{display:none!important}body>div>div>main{padding:0!important}.watermark-logo{display:block!important}}`
    document.head.appendChild(s)
    setVistaImpresion(true)
    setTimeout(() => {
      window.print()
      setVistaImpresion(false)
      const el = document.getElementById('print-styles')
      if (el) el.remove()
    }, 400)
  }

  const handleExportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reporte')

    ws.pageSetup.orientation = 'landscape'
    ws.pageSetup.fitToPage = true
    ws.pageSetup.fitToWidth = 1
    ws.pageSetup.paperSize = 9

    const colW = [5, 14, 22, 45, 18, 16]
    for (let i = 0; i < 6; i++) ws.getColumn(i + 1).width = colW[i]

    const { title, sub } = getReportTitle()

    const AC = { horizontal: 'center' as const, vertical: 'middle' as const }
    const AR = { horizontal: 'right' as const, vertical: 'middle' as const }
    const AL = { horizontal: 'left' as const, vertical: 'middle' as const }

    const F = (sz: number, b?: boolean, c?: string) => ({
      name: 'Segoe UI', size: sz, bold: !!b, color: c ? { argb: c } : undefined
    })

    const borderAll = (c: string) => ({
      top: { style: 'thin' as const, color: { argb: c } },
      bottom: { style: 'thin' as const, color: { argb: c } },
      left: { style: 'thin' as const, color: { argb: c } },
      right: { style: 'thin' as const, color: { argb: c } },
    })

    const M = (r: number, c1: number, c2: number, v: any, f: any, a: any, fl?: any, b?: any) => {
      ws.mergeCells(r, c1, r, c2)
      const cell = ws.getCell(r, c1)
      cell.value = v; cell.font = f; cell.alignment = a
      if (fl) cell.fill = fl
      if (b) cell.border = b
      return cell
    }

    let r = 1

    // ── Header ──
    M(r, 1, 6, 'Iglesia Espíritu Santo y Fuego', F(22, true, 'FF1A1A2E'), AC); ws.getRow(r).height = 35; r++
    M(r, 1, 6, 'Misión Cristiana Perfectos en Unidad', F(12, false, 'FF6B7280'), AC); r++; r++
    M(r, 1, 6, title.toUpperCase(), F(16, true, 'FF1A1A2E'), AC); r++
    M(r, 1, 6, sub, F(11, false, 'FF6B7280'), AC); r++; r++

    // ── KPI Cards ──
    const kpiCell = (row: number, c1: number, c2: number, lb: string, val: number, bg: string, bc: string, vc: string) => {
      ws.mergeCells(row, c1, row + 1, c2)
      const cell = ws.getCell(row, c1)
      cell.value = { richText: [
        { text: lb + '\n', font: F(10, true, vc) },
        { text: 'C$ ' + val.toFixed(2), font: F(18, true, vc) }
      ]}
      cell.alignment = { ...AC, wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.border = {
        top: { style: 'medium', color: { argb: bc } },
        bottom: { style: 'medium', color: { argb: bc } },
        left: { style: 'medium', color: { argb: bc } },
        right: { style: 'medium', color: { argb: bc } },
      }
    }
    kpiCell(r, 1, 2, 'Total Ingresos', totalIngresos, 'FFF0FDF4', 'FFBBF7D0', 'FF16A34A')
    kpiCell(r, 3, 4, 'Total Egresos', totalEgresos, 'FFFEF2F2', 'FFFECACA', 'FFDC2626')
    kpiCell(r, 5, 6, 'Saldo', saldo, saldo >= 0 ? 'FFEFF6FF' : 'FFFEF2F2', saldo >= 0 ? 'FFBFDBFE' : 'FFFECACA', saldo >= 0 ? 'FF2563EB' : 'FFDC2626')
    ws.getRow(r).height = 28; ws.getRow(r + 1).height = 22; r += 3

    // ── Ingresos por Categoría ──
    const ingCat = Object.entries(ingresosPorCategoria)
    M(r, 1, 6, 'Ingresos por Categoría', F(11, true, 'FF15803D'), AL)
    ws.getRow(r).height = 22; r++
    ingCat.forEach(([cat, total]) => {
      ws.getCell(r, 1).value = labelCategoria(cat)
      ws.getCell(r, 1).font = F(10, false, 'FF374151')
      ws.mergeCells(r, 1, r, 3)
      ws.getCell(r, 4).value = 'C$ ' + total.toFixed(2)
      ws.getCell(r, 4).font = F(10, true, 'FF16A34A')
      ws.getCell(r, 4).alignment = AR; r++
    })
    ws.mergeCells(r, 1, r, 3)
    ws.getCell(r, 1).value = 'Total Ingresos'
    ws.getCell(r, 1).font = F(10, true, 'FF16A34A')
    ws.getCell(r, 1).border = { top: { style: 'medium', color: { argb: 'FF16A34A' } } }
    ws.getCell(r, 4).value = 'C$ ' + totalIngresos.toFixed(2)
    ws.getCell(r, 4).font = F(10, true, 'FF16A34A')
    ws.getCell(r, 4).alignment = AR
    ws.getCell(r, 4).border = { top: { style: 'medium', color: { argb: 'FF16A34A' } } }; r++

    r++ // spacer

    // ── Egresos por Categoría ──
    const egrCat = Object.entries(egresosPorCategoria)
    M(r, 1, 6, 'Egresos por Categoría', F(11, true, 'FFB91C1C'), AL)
    ws.getRow(r).height = 22; r++
    egrCat.forEach(([cat, total]) => {
      ws.getCell(r, 1).value = labelCategoria(cat)
      ws.getCell(r, 1).font = F(10, false, 'FF374151')
      ws.mergeCells(r, 1, r, 3)
      ws.getCell(r, 4).value = 'C$ ' + total.toFixed(2)
      ws.getCell(r, 4).font = F(10, true, 'FFDC2626')
      ws.getCell(r, 4).alignment = AR; r++
    })
    ws.mergeCells(r, 1, r, 3)
    ws.getCell(r, 1).value = 'Total Egresos'
    ws.getCell(r, 1).font = F(10, true, 'FFDC2626')
    ws.getCell(r, 1).border = { top: { style: 'medium', color: { argb: 'FFDC2626' } } }
    ws.getCell(r, 4).value = 'C$ ' + totalEgresos.toFixed(2)
    ws.getCell(r, 4).font = F(10, true, 'FFDC2626')
    ws.getCell(r, 4).alignment = AR
    ws.getCell(r, 4).border = { top: { style: 'medium', color: { argb: 'FFDC2626' } } }; r++

    r += 2 // spacer

    // ── Helper: detail table ──
    const writeTable = (rows: MovimientoCaja[], label: string, color: string, prefix: string, bg: string, hdrBg: string) => {
      M(r, 1, 6, label, F(12, true, color), AL); ws.getRow(r).height = 22; r++

      const hc = color === 'FF16A34A' ? 'FF15803D' : 'FFB91C1C'
      const heads = ['No.', 'Fecha', 'Categoría', 'Detalle', 'Responsable', 'Monto']
      const hAlign = ['center', 'left', 'left', 'left', 'left', 'right']
      heads.forEach((h, i) => {
        const cell = ws.getCell(r, i + 1)
        cell.value = h; cell.font = F(9, true, 'FFFFFFFF')
        cell.alignment = { horizontal: hAlign[i] as any, vertical: 'middle' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hdrBg } }
        cell.border = borderAll(color)
      })
      ws.getRow(r).height = 20; r++

      if (rows.length === 0) {
        M(r, 1, 6, 'Sin ' + label.toLowerCase(), F(11, false, 'FF9CA3AF'), AC)
        r++
      } else {
        rows.forEach((m, i) => {
          const bgRow = i % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF'
          ws.getCell(r, 1).value = i + 1
          ws.getCell(r, 1).font = F(10, false, 'FF212529')
          ws.getCell(r, 1).alignment = AC
          ws.getCell(r, 2).value = m.fecha.split('-').reverse().join('/')
          ws.getCell(r, 2).font = F(10, false, 'FF212529')
          ws.getCell(r, 3).value = labelCategoria(m.categoria)
          ws.getCell(r, 3).font = F(10, false, 'FF212529')
          const det = ws.getCell(r, 4)
          det.value = { richText: [
            { text: prefix, font: { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF212529' } } },
            { text: m.concepto, font: { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } } }
          ]}
          ws.getCell(r, 5).value = m.ingresadoPor
          ws.getCell(r, 5).font = F(10, false, 'FF212529')
          ws.getCell(r, 6).value = 'C$ ' + m.monto.toFixed(2)
          ws.getCell(r, 6).font = F(10, true, color)
          ws.getCell(r, 6).alignment = AR
          for (let c = 1; c <= 6; c++) {
            ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } }
            ws.getCell(r, c).border = borderAll('FFDEE2E6')
          }
          r++
        })
      }

      // Total row
      const totalVal = color === 'FF16A34A' ? totalIngresos : totalEgresos
      M(r, 1, 5, 'Total ' + label + ':', F(11, true, hc), AR, { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } })
      ws.getCell(r, 6).value = 'C$ ' + totalVal.toFixed(2)
      ws.getCell(r, 6).font = F(12, true, color)
      ws.getCell(r, 6).alignment = AR
      ws.getCell(r, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      for (let c = 1; c <= 6; c++) {
        ws.getCell(r, c).border = borderAll(color)
      }
      r += 2
    }

    // ── Detail Ingresos ──
    writeTable(
      movimientosFiltrados.filter(m => m.tipo === 'ingreso'),
      'Detalle de Ingresos', 'FF16A34A', 'Motivo: ', 'FFF0FDF4', 'FF16A34A'
    )

    // ── Detail Egresos ──
    writeTable(
      movimientosFiltrados.filter(m => m.tipo === 'egreso'),
      'Detalle de Egresos', 'FFDC2626', 'Gasto en: ', 'FFFEF2F2', 'FFDC2626'
    )

    // ── Saldo Neto ──
    const saldoColor = saldo >= 0 ? 'FF16A34A' : 'FFDC2626'
    M(r, 1, 6, 'Saldo Neto: C$ ' + saldo.toFixed(2), F(13, true, saldoColor), AC)
    ws.getCell(r, 1).border = { top: { style: 'medium', color: { argb: 'FF374151' } } }
    r += 3

    // ── Signatures (side by side with gap) ──
    ws.mergeCells(r, 1, r, 3)
    ws.getCell(r, 1).border = { bottom: { style: 'medium', color: { argb: 'FF555555' } } }
    ws.getCell(r, 1).value = ''
    ws.mergeCells(r, 5, r, 6)
    ws.getCell(r, 5).border = { bottom: { style: 'medium', color: { argb: 'FF555555' } } }
    ws.getCell(r, 5).value = ''
    ws.getRow(r).height = 30; r++

    M(r, 1, 3, 'Nombre y firma', F(10, false, 'FF666666'), AC)
    M(r, 5, 6, 'Nombre y firma', F(10, false, 'FF666666'), AC); r++

    M(r, 1, 3, 'Pastor(a)', F(12, true, 'FF374151'), AC)
    M(r, 5, 6, 'Cajera', F(12, true, 'FF374151'), AC); r++

    // ── Generate file ──
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const aniosDisponibles = useMemo(() => {
    const set = new Set<number>()
    movimientos.forEach((m) => {
      const y = parseInt(m.fecha.split('-')[0])
      if (!isNaN(y)) set.add(y)
    })
    if (set.size === 0) set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [movimientos])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    )
  }

  if (vistaImpresion) {
    return <PrintView />
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-dark">Reportes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <Download className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="primary" size="sm" onClick={handleImprimir}>
            <Printer className="mr-1.5 h-4 w-4" /> {reportType === 'detallado' ? 'Reporte Profesional' : 'Imprimir'}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {([
              { key: 'detallado', label: '📋 Detallado', icon: FileText },
              { key: 'mensual', label: '📆 Mensual', icon: Calendar },
              { key: 'anual', label: '📊 Anual', icon: BarChart3 },
              { key: 'comparativo', label: '⚖ Ingresos vs Egresos', icon: PieChart },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setReportType(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  reportType === t.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {reportType === 'detallado' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Desde</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Hasta</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" />
                </div>
              </>
            )}
            {reportType === 'mensual' && (
              <div className="md:col-span-2 flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes</label>
                  <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none">
                    {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</label>
                  <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none">
                    {aniosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}
            {reportType === 'anual' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</label>
                <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none">
                  {aniosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {reportType === 'comparativo' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Desde</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Hasta</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none">
                <option value="todos">Todos</option>
                <option value="ingreso">Solo Ingresos</option>
                <option value="egreso">Solo Egresos</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none">
                <option value="">Todas</option>
                <optgroup label="Ingresos">
                  {CATEGORIAS_INGRESO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="Egresos">
                  {CATEGORIAS_EGRESO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Total Ingresos" value={totalIngresos} color="green" />
        <SummaryCard icon={<TrendingDown className="h-5 w-5" />} label="Total Egresos" value={totalEgresos} color="red" />
        <SummaryCard
          icon={<span className="text-lg font-black" style={{ fontFamily: "'Times New Roman', serif" }}>C$</span>}
          label="Saldo" value={saldo} color={saldo >= 0 ? 'blue' : 'red'} />
      </div>

      {reportType === 'detallado' && <DetalladoView />}
      {reportType === 'mensual' && <MensualView />}
      {reportType === 'anual' && <AnualView />}
      {reportType === 'comparativo' && <ComparativoView />}
    </div>
  )

  /* ─────────────── DETALLADO ─────────────── */

  function DetalladoView() {
    return (
      <>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <CategoryCard title="Ingresos por Categoría" data={ingresosPorCategoria} color="green" />
          <CategoryCard title="Egresos por Categoría" data={egresosPorCategoria} color="red" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-dark">
                <FileText className="h-4 w-4 text-primary" /> Detalle de Movimientos
                <span className="text-sm font-normal text-gray-400">({movimientosFiltrados.length})</span>
              </h3>
              <span className="text-[11px] text-gray-400">
                {from?.toLocaleDateString('es-ES')} — {to?.toLocaleDateString('es-ES')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {movimientosFiltrados.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No hay movimientos en este período.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">No.</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Categoría</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Concepto</th>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Responsable</th>
                      <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {movimientosFiltrados.map((m, i) => (
                      <tr key={m.id || i} className="transition-colors hover:bg-gray-50/70">
                        <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{formatDate(m.fecha)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            m.tipo === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{labelCategoria(m.categoria)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider mr-1 ${m.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                            {m.tipo === 'ingreso' ? 'Motivo:' : 'Gasto en:'}
                          </span>
                          {m.concepto}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{m.ingresadoPor}</td>
                        <td className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${
                          m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.tipo === 'ingreso' ? '+' : '–'} C$ {m.monto.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <td colSpan={6} className="px-4 py-3.5 text-right text-sm font-bold text-gray-700">Totales:</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="text-sm font-bold text-green-600">+ C$ {totalIngresos.toFixed(2)}</div>
                        <div className="text-sm font-bold text-red-600">– C$ {totalEgresos.toFixed(2)}</div>
                        <div className={`text-sm font-bold border-t border-gray-300 mt-1 pt-1 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          = C$ {saldo.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  /* ─────────────── MENSUAL ─────────────── */

  function MensualView() {
    const resumenSemanal = useMemo(() => {
      const sorted = [...movimientosFiltrados].sort((a, b) => a.fecha.localeCompare(b.fecha))
      const weeks: GrupoSemanal[] = []
      let currentWeek: GrupoSemanal | null = null
      let currentDay: GrupoDiario | null = null

      for (const m of sorted) {
        const date = new Date(m.fecha + 'T12:00:00')
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        if (!currentWeek || currentWeek.semana !== weekKey) {
          currentWeek = {
            semana: weekKey,
            inicio: weekStart.toISOString().split('T')[0],
            fin: weekEnd.toISOString().split('T')[0],
            ingresos: 0, egresos: 0, diario: [],
          }
          weeks.push(currentWeek)
          currentDay = null
        }

        if (!currentDay || currentDay.fecha !== m.fecha) {
          currentDay = { fecha: m.fecha, ingresos: 0, egresos: 0, items: [] }
          currentWeek.diario.push(currentDay)
        }
        currentDay.items.push(m)
        if (m.tipo === 'ingreso') { currentDay.ingresos += m.monto; currentWeek.ingresos += m.monto }
        else { currentDay.egresos += m.monto; currentWeek.egresos += m.monto }
      }
      return weeks
    }, [movimientosFiltrados])

    const mesLabel = `${meses[mesSeleccionado]} ${anioSeleccionado}`
    const totalMov = movimientosFiltrados.length

    return (
      <>
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Resumen Mensual: <span className="text-primary">{mesLabel}</span></h3>
              <span className="text-xs text-gray-400">{totalMov} movimiento{totalMov !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-bold text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" /> Ingresos
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(ingresosPorCategoria).length === 0 ? (
                    <p className="text-sm text-gray-400">Sin ingresos</p>
                  ) : Object.entries(ingresosPorCategoria).map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{labelCategoria(cat)}</span>
                      <span className="font-semibold text-green-600 tabular-nums">C$ {total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-700">Total Ingresos</span>
                    <span className="text-green-600">C$ {totalIngresos.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-bold text-gray-600 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" /> Egresos
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(egresosPorCategoria).length === 0 ? (
                    <p className="text-sm text-gray-400">Sin egresos</p>
                  ) : Object.entries(egresosPorCategoria).map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{labelCategoria(cat)}</span>
                      <span className="font-semibold text-red-600 tabular-nums">C$ {total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-700">Total Egresos</span>
                    <span className="text-red-600">C$ {totalEgresos.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {resumenSemanal.map((semana) => (
          <Card key={semana.semana} className="mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-3 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-dark">
                  Semana del {formatDate(semana.inicio)} al {formatDate(semana.fin)}
                </h3>
                <div className="flex gap-4 text-xs font-semibold tabular-nums">
                  <span className="text-green-600">+ C$ {semana.ingresos.toFixed(2)}</span>
                  <span className="text-red-600">– C$ {semana.egresos.toFixed(2)}</span>
                  <span className={semana.ingresos - semana.egresos >= 0 ? 'text-blue-600' : 'text-red-600'}>
                    = C$ {(semana.ingresos - semana.egresos).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Día</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Ingresos</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Egresos</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Saldo del Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {semana.diario.map((dia) => (
                    <tr key={dia.fecha} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700 capitalize">{dayName(dia.fecha)}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{formatDate(dia.fecha)}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-green-600 tabular-nums">
                        {dia.ingresos > 0 ? `C$ ${dia.ingresos.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-600 tabular-nums">
                        {dia.egresos > 0 ? `C$ ${dia.egresos.toFixed(2)}` : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm font-bold tabular-nums ${
                        dia.ingresos - dia.egresos >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        C$ {(dia.ingresos - dia.egresos).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2">
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-medium text-primary hover:text-primary-dark transition">
                    Ver detalle de movimientos ({semana.diario.reduce((s, d) => s + d.items.length, 0)})
                  </summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Fecha</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Tipo</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase">Concepto</th>
                          <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-gray-500 uppercase">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {semana.diario.map((dia) =>
                          dia.items.map((m, idx) => (
                            <tr key={`${dia.fecha}-${idx}`} className="hover:bg-gray-50/50">
                              <td className="px-3 py-1.5 text-gray-600">{formatDate(m.fecha)}</td>
                              <td className="px-3 py-1.5">
                                <span className={`rounded px-1.5 py-0.5 font-medium ${
                                  m.tipo === 'ingreso' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                                }`}>{m.tipo === 'ingreso' ? 'I' : 'E'}</span>
                              </td>
                              <td className="px-3 py-1.5 text-gray-700">{m.concepto}</td>
                              <td className={`px-3 py-1.5 text-right font-medium ${
                                m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                              }`}>C$ {m.monto.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  /* ─────────────── ANUAL ─────────────── */

  function AnualView() {
    const resumenMensual = useMemo(() => {
      const months: GrupoMensual[] = []
      for (let m = 0; m < 12; m++) {
        const movsMes = movimientos.filter((mv) => {
          const [y, month] = mv.fecha.split('-')
          return parseInt(y) === anioSeleccionado && parseInt(month) === m + 1
        })
        if (movsMes.length === 0) continue

        const ingresos = movsMes.filter((x) => x.tipo === 'ingreso').reduce((s, x) => s + x.monto, 0)
        const egresos = movsMes.filter((x) => x.tipo === 'egreso').reduce((s, x) => s + x.monto, 0)

        const sorted = movsMes.sort((a, b) => a.fecha.localeCompare(b.fecha))
        const weeks: GrupoSemanal[] = []
        let currentWeek: GrupoSemanal | null = null
        let currentDay: GrupoDiario | null = null

        for (const mv of sorted) {
          const date = new Date(mv.fecha + 'T12:00:00')
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay() + 1)
          const weekKey = weekStart.toISOString().split('T')[0]
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)

          if (!currentWeek || currentWeek.semana !== weekKey) {
            currentWeek = {
              semana: weekKey,
              inicio: weekStart.toISOString().split('T')[0],
              fin: weekEnd.toISOString().split('T')[0],
              ingresos: 0, egresos: 0, diario: [],
            }
            weeks.push(currentWeek)
            currentDay = null
          }
          if (!currentDay || currentDay.fecha !== mv.fecha) {
            currentDay = { fecha: mv.fecha, ingresos: 0, egresos: 0, items: [] }
            currentWeek.diario.push(currentDay)
          }
          currentDay.items.push(mv)
          if (mv.tipo === 'ingreso') { currentDay.ingresos += mv.monto; currentWeek.ingresos += mv.monto }
          else { currentDay.egresos += mv.monto; currentWeek.egresos += mv.monto }
        }

        months.push({ mes: m, anio: anioSeleccionado, label: meses[m], ingresos, egresos, semanal: weeks })
      }
      return months
    }, [movimientos, anioSeleccionado])

    const totalAnualIngresos = resumenMensual.reduce((s, m) => s + m.ingresos, 0)
    const totalAnualEgresos = resumenMensual.reduce((s, m) => s + m.egresos, 0)
    const saldoAnual = totalAnualIngresos - totalAnualEgresos
    const mesesConDatos = resumenMensual.length

    return (
      <>
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark">Reporte Anual <span className="text-primary">{anioSeleccionado}</span></h3>
              <span className="text-xs text-gray-400">{mesesConDatos} meses con actividad</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">C$ {totalAnualIngresos.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Total Egresos</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">C$ {totalAnualEgresos.toFixed(2)}</p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br p-4 text-center border ${
                saldoAnual >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-red-50 to-red-100 border-red-200'
              }`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${saldoAnual >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  Saldo Anual
                </p>
                <p className={`text-2xl font-bold tabular-nums ${saldoAnual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  C$ {saldoAnual.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 overflow-hidden">
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <BarChart3 className="h-4 w-4 text-primary" /> Resumen Mensual
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mes</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Semanas</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Ingresos</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Egresos</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Saldo</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Eficiencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumenMensual.map((m) => {
                  const eficiencia = m.ingresos > 0 ? (m.egresos / m.ingresos * 100) : 0
                  return (
                    <tr key={m.mes} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-dark">{m.label}</span>
                        <div className="text-[11px] text-gray-400">{m.semanal.length} semana{m.semanal.length !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-gray-500 tabular-nums">{m.semanal.length}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-green-600 tabular-nums">C$ {m.ingresos.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-red-600 tabular-nums">C$ {m.egresos.toFixed(2)}</td>
                      <td className={`px-5 py-4 text-right text-sm font-bold tabular-nums ${
                        m.ingresos - m.egresos >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        C$ {(m.ingresos - m.egresos).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          eficiencia <= 80 ? 'bg-green-100 text-green-700' :
                          eficiencia <= 100 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {eficiencia.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <td className="px-5 py-4 font-bold text-dark">Total Anual</td>
                  <td className="px-5 py-4 text-right text-sm text-gray-500">—</td>
                  <td className="px-5 py-4 text-right font-bold text-green-600 tabular-nums">C$ {totalAnualIngresos.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right font-bold text-red-600 tabular-nums">C$ {totalAnualEgresos.toFixed(2)}</td>
                  <td className={`px-5 py-4 text-right font-bold tabular-nums ${
                    saldoAnual >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    C$ {saldoAnual.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">—</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {resumenMensual.map((m) => (
          <details key={m.mes} className="group mb-3">
            <summary className="flex cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-3 border border-primary/10 hover:from-primary/10 hover:to-primary/15 transition">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-dark">{m.label}</span>
                <span className="text-[11px] text-gray-500">{m.semanal.length} semanas</span>
              </div>
              <div className="flex gap-4 text-xs font-semibold tabular-nums">
                <span className="text-green-600">+ C$ {m.ingresos.toFixed(2)}</span>
                <span className="text-red-600">– C$ {m.egresos.toFixed(2)}</span>
                <span className={m.ingresos - m.egresos >= 0 ? 'text-blue-600' : 'text-red-600'}>
                  = C$ {(m.ingresos - m.egresos).toFixed(2)}
                </span>
              </div>
            </summary>
            <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Semana</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase">Ingresos</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase">Egresos</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {m.semanal.map((sem) => (
                    <tr key={sem.semana} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-sm text-gray-700">
                        {formatDate(sem.inicio)} — {formatDate(sem.fin)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-green-600 tabular-nums">
                        C$ {sem.ingresos.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-600 tabular-nums">
                        C$ {sem.egresos.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2.5 text-right text-sm font-bold tabular-nums ${
                        sem.ingresos - sem.egresos >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        C$ {(sem.ingresos - sem.egresos).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </>
    )
  }

  /* ─────────────── COMPARATIVO ─────────────── */

  function ComparativoView() {
    const groupedByMonth = useMemo(() => {
      const map: Record<string, { label: string; ingresos: number; egresos: number }> = {}
      for (const m of movimientosFiltrados) {
        const [y, mes] = m.fecha.split('-')
        const key = `${y}-${mes}`
        if (!map[key]) {
          const monthIdx = parseInt(mes) - 1
          map[key] = { label: `${meses[monthIdx]} ${y}`, ingresos: 0, egresos: 0 }
        }
        if (m.tipo === 'ingreso') map[key].ingresos += m.monto
        else map[key].egresos += m.monto
      }
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([_, v]) => v)
    }, [movimientosFiltrados])

    const maxVal = Math.max(...groupedByMonth.map((g) => Math.max(g.ingresos, g.egresos)))

    return (
      <>
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="mb-4 text-lg font-bold text-dark">Comparativa: <span className="text-primary">Ingresos vs Egresos</span></h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">C$ {totalIngresos.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Total Egresos</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">C$ {totalEgresos.toFixed(2)}</p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br p-4 text-center border ${
                saldo >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-red-50 to-red-100 border-red-200'
              }`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  Diferencia
                </p>
                <p className={`text-2xl font-bold tabular-nums ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  C$ {saldo.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <BarChart3 className="h-4 w-4 text-primary" /> Distribución por Mes
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            {groupedByMonth.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No hay datos en este período.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mes</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Ingresos</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Comparativa</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Egresos</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupedByMonth.map((g) => {
                    const pctIng = maxVal > 0 ? (g.ingresos / maxVal) * 100 : 0
                    const pctEgr = maxVal > 0 ? (g.egresos / maxVal) * 100 : 0
                    const balance = g.ingresos - g.egresos
                    return (
                      <tr key={g.label} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4 font-bold text-dark">{g.label}</td>
                        <td className="px-5 py-4 text-right font-semibold text-green-600 tabular-nums">
                          C$ {g.ingresos.toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="h-6 w-24 rounded-full bg-gray-100 overflow-hidden flex">
                              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-l-full transition-all" style={{ width: `${pctIng}%` }} />
                              <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-r-full transition-all" style={{ width: `${pctEgr}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-left font-semibold text-red-600 tabular-nums">
                          C$ {g.egresos.toFixed(2)}
                        </td>
                        <td className={`px-5 py-4 text-right font-bold tabular-nums ${
                          balance >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {balance >= 0 ? '+' : ''}C$ {balance.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <td className="px-5 py-4 font-bold text-dark">Totales</td>
                    <td className="px-5 py-4 text-right font-bold text-green-600 tabular-nums">C$ {totalIngresos.toFixed(2)}</td>
                    <td />
                    <td className="px-5 py-4 text-left font-bold text-red-600 tabular-nums">C$ {totalEgresos.toFixed(2)}</td>
                    <td className={`px-5 py-4 text-right font-bold tabular-nums ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {saldo >= 0 ? '+' : ''}C$ {saldo.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  /* ─────────────── IMPRIMIBLE ─────────────── */

  function PrintView() {
    const { title, sub } = getReportTitle()
    return (
      <div className="mx-auto max-w-5xl bg-white p-10 print:p-6 relative">
        <img
          src="/Espiritu_Santo_y_Fuego/logo.png"
          alt=""
          className="watermark-logo hidden fixed top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none z-50"
          style={{ display: 'none' }}
        />
        {/* Header */}
        <div className="mb-8 border-b-2 border-primary pb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Iglesia Espíritu Santo y Fuego</h1>
          <p className="text-sm text-gray-500">Misión Cristiana Perfectos en Unidad</p>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
          <p className="text-xs text-gray-400">Generado: {new Date().toLocaleString('es-ES')}</p>
        </div>

        {/* Summary boxes */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-600 tabular-nums mt-1">C$ {totalIngresos.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Total Egresos</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums mt-1">C$ {totalEgresos.toFixed(2)}</p>
          </div>
          <div className={`rounded-xl border-2 p-5 text-center bg-gradient-to-br ${
            saldo >= 0 ? 'border-blue-200 from-blue-50 to-blue-100' : 'border-red-200 from-red-50 to-red-100'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Saldo</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              C$ {saldo.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-green-700 border-b border-green-200 pb-1.5">
              Ingresos por Categoría
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(ingresosPorCategoria).length === 0 ? (
                  <tr><td className="py-2 text-gray-400">Sin ingresos</td></tr>
                ) : Object.entries(ingresosPorCategoria).map(([cat, total]) => (
                  <tr key={cat} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-700">{labelCategoria(cat)}</td>
                    <td className="py-1.5 text-right font-semibold text-green-600 tabular-nums">C$ {total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-green-200">
                  <td className="py-2 text-gray-800">Total Ingresos</td>
                  <td className="py-2 text-right text-green-600">C$ {totalIngresos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-red-700 border-b border-red-200 pb-1.5">
              Egresos por Categoría
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(egresosPorCategoria).length === 0 ? (
                  <tr><td className="py-2 text-gray-400">Sin egresos</td></tr>
                ) : Object.entries(egresosPorCategoria).map(([cat, total]) => (
                  <tr key={cat} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-700">{labelCategoria(cat)}</td>
                    <td className="py-1.5 text-right font-semibold text-red-600 tabular-nums">C$ {total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-red-200">
                  <td className="py-2 text-gray-800">Total Egresos</td>
                  <td className="py-2 text-right text-red-600">C$ {totalEgresos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ingresos table */}
        <div className="mb-6 print:page-break-before:always">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-green-700 border-b border-green-300 pb-1.5">
            Detalle de Ingresos
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-green-50">
                <th className="border border-green-200 px-3 py-2 text-left font-semibold text-green-800">No.</th>
                <th className="border border-green-200 px-3 py-2 text-left font-semibold text-green-800">Fecha</th>
                <th className="border border-green-200 px-3 py-2 text-left font-semibold text-green-800">Categoría</th>
                <th className="border border-green-200 px-3 py-2 text-left font-semibold text-green-800">Concepto</th>
                <th className="border border-green-200 px-3 py-2 text-left font-semibold text-green-800">Responsable</th>
                <th className="border border-green-200 px-3 py-2 text-right font-semibold text-green-800">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.filter(m => m.tipo === 'ingreso').map((m, i) => (
                <tr key={m.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}>
                  <td className="border border-green-100 px-3 py-1.5 text-center text-gray-400">{i + 1}</td>
                  <td className="border border-green-100 px-3 py-1.5 text-gray-700">{formatDate(m.fecha)}</td>
                  <td className="border border-green-100 px-3 py-1.5 text-gray-600">{labelCategoria(m.categoria)}</td>
                  <td className="border border-green-100 px-3 py-1.5 text-gray-800">
                    <span className="text-[10px] font-semibold uppercase tracking-wider mr-1 text-green-700">Motivo:</span>
                    {m.concepto}
                  </td>
                  <td className="border border-green-100 px-3 py-1.5 text-gray-500">{m.ingresadoPor}</td>
                  <td className="border border-green-100 px-3 py-1.5 text-right font-bold text-green-600">C$ {m.monto.toFixed(2)}</td>
                </tr>
              ))}
              {movimientosFiltrados.filter(m => m.tipo === 'ingreso').length === 0 && (
                <tr><td colSpan={6} className="py-3 text-center text-gray-400">Sin ingresos</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 font-semibold">
                <td colSpan={5} className="border border-green-200 px-3 py-2 text-right text-green-800">Total Ingresos:</td>
                <td className="border border-green-200 px-3 py-2 text-right text-green-600">C$ {totalIngresos.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Egresos table */}
        <div className="mb-8">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700 border-b border-red-300 pb-1.5">
            Detalle de Egresos
          </h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-red-200 px-3 py-2 text-left font-semibold text-red-800">No.</th>
                <th className="border border-red-200 px-3 py-2 text-left font-semibold text-red-800">Fecha</th>
                <th className="border border-red-200 px-3 py-2 text-left font-semibold text-red-800">Categoría</th>
                <th className="border border-red-200 px-3 py-2 text-left font-semibold text-red-800">Concepto</th>
                <th className="border border-red-200 px-3 py-2 text-left font-semibold text-red-800">Responsable</th>
                <th className="border border-red-200 px-3 py-2 text-right font-semibold text-red-800">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.filter(m => m.tipo === 'egreso').map((m, i) => (
                <tr key={m.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}>
                  <td className="border border-red-100 px-3 py-1.5 text-center text-gray-400">{i + 1}</td>
                  <td className="border border-red-100 px-3 py-1.5 text-gray-700">{formatDate(m.fecha)}</td>
                  <td className="border border-red-100 px-3 py-1.5 text-gray-600">{labelCategoria(m.categoria)}</td>
                  <td className="border border-red-100 px-3 py-1.5 text-gray-800">
                    <span className="text-[10px] font-semibold uppercase tracking-wider mr-1 text-red-700">Gasto en:</span>
                    {m.concepto}
                  </td>
                  <td className="border border-red-100 px-3 py-1.5 text-gray-500">{m.ingresadoPor}</td>
                  <td className="border border-red-100 px-3 py-1.5 text-right font-bold text-red-600">C$ {m.monto.toFixed(2)}</td>
                </tr>
              ))}
              {movimientosFiltrados.filter(m => m.tipo === 'egreso').length === 0 && (
                <tr><td colSpan={6} className="py-3 text-center text-gray-400">Sin egresos</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-red-50 font-semibold">
                <td colSpan={5} className="border border-red-200 px-3 py-2 text-right text-red-800">Total Egresos:</td>
                <td className="border border-red-200 px-3 py-2 text-right text-red-600">C$ {totalEgresos.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-right text-sm font-bold text-gray-700">Saldo Neto: C$ {saldo.toFixed(2)}</p>
        </div>

        {/* Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-16 text-center">
          {['Pastor(a)', 'Cajera'].map((role) => (
            <div key={role} className="flex flex-col justify-end">
              <div className="border-b-2 border-gray-400 mt-16 mb-1" />
              <p className="text-xs text-gray-400">Nombre y firma</p>
              <p className="mt-2 text-sm font-bold text-gray-700">{role}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function getReportTitle() {
    switch (reportType) {
      case 'detallado':
        return {
          title: 'Reporte Detallado de Ingresos y Egresos',
          sub: `Período: ${from?.toLocaleDateString('es-ES')} al ${to?.toLocaleDateString('es-ES')}`,
        }
      case 'mensual':
        return {
          title: `Reporte Mensual — ${meses[mesSeleccionado]} ${anioSeleccionado}`,
          sub: 'Resumen semanal y detalle de movimientos',
        }
      case 'anual':
        return {
          title: `Reporte Anual ${anioSeleccionado}`,
          sub: 'Resumen mensual con desglose semanal',
        }
      case 'comparativo':
        return {
          title: 'Comparativa de Ingresos vs Egresos',
          sub: `Período: ${from?.toLocaleDateString('es-ES')} al ${to?.toLocaleDateString('es-ES')}`,
        }
    }
  }
}

/* ─── Components ─── */

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const colors: Record<string, { bg: string; text: string; gradient: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-500 to-emerald-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', gradient: 'from-red-500 to-rose-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600' },
  }
  const c = colors[color] || colors.green
  const isNeg = value < 0

  return (
    <div className="card-glass relative overflow-hidden rounded-2xl p-5">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.06]`} />
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 ${c.bg}`}>{icon}</div>
      </div>
      <p className="mb-1 mt-4 text-xs font-medium tracking-wide text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${isNeg ? 'text-red-600' : 'text-dark'}`}>
        C$ {Math.abs(value).toLocaleString('es', { minimumFractionDigits: 2 })}
        {isNeg && <span className="ml-1 text-xs font-medium text-red-500">(deficit)</span>}
      </p>
    </div>
  )
}

function CategoryCard({ title, data, color }: { title: string; data: Record<string, number>; color: string }) {
  const txtColor = color === 'green' ? 'text-green-600' : 'text-red-600'
  const bgColor = color === 'green' ? 'bg-green-100' : 'bg-red-100'
  const borderColor = color === 'green' ? 'border-green-200' : 'border-red-200'

  return (
    <Card>
      <CardHeader>
        <h3 className={`flex items-center gap-2 font-semibold ${txtColor}`}>
          {color === 'green' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {title}
        </h3>
      </CardHeader>
      <CardContent>
        {Object.keys(data).length === 0 ? (
          <p className="text-sm text-gray-400">Sin datos en este período.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([cat, total]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{labelCategoria(cat)}</span>
                <span className={`font-semibold tabular-nums ${txtColor}`}>C$ {total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

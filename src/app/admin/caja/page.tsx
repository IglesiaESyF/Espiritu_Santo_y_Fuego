'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Plus,
  FileText, Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

function CordobaIcon({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-black leading-none ${className || ''}`}
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      C$
    </span>
  )
}
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, MovimientoCaja } from '@/types'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deleteMovimiento } from '@/lib/caja-storage'

const labelCat = (val: string) =>
  [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO].find((c) => c.value === val)?.label || val

function useCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const ref = useRef<number>(0)
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = Date.now()
    ref.current = 0
    const step = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      if (current !== ref.current) {
        ref.current = current
        setValue(current)
      }
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return value
}

const CAT_COLORS: Record<string, string> = {
  ofrendas: 'bg-amber-100 text-amber-700',
  donaciones: 'bg-purple-100 text-purple-700',
  actividades: 'bg-blue-100 text-blue-700',
  luz: 'bg-yellow-100 text-yellow-700',
  agua: 'bg-cyan-100 text-cyan-700',
  telefono: 'bg-indigo-100 text-indigo-700',
  mantenimiento: 'bg-orange-100 text-orange-700',
  evento: 'bg-pink-100 text-pink-700',
  otro: 'bg-gray-100 text-gray-700',
}

export default function CajaPage() {
  const router = useRouter()
  const { puede } = useAuth()
  const [tab, setTab] = useState<'ingresos' | 'egresos'>('ingresos')
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!puede('caja', 'ver')) router.replace('/admin/dashboard')
    const q = query(collection(db, 'caja-movimientos'), orderBy('fecha', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list: MovimientoCaja[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          tipo: data.tipo,
          categoria: data.categoria,
          monto: data.monto,
          concepto: data.concepto,
          fecha: data.fecha,
          ingresadoPor: data.ingresadoPor,
          descripcion: data.descripcion,
          creadoEn: data.creadoEn?.toMillis?.() || data.creadoEn || 0,
        })
      })
      setMovimientos(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtrados = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === (tab === 'ingresos' ? 'ingreso' : 'egreso'))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [movimientos, tab])

  const totalIngresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0),
    [movimientos],
  )
  const totalEgresos = useMemo(
    () => movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0),
    [movimientos],
  )
  const saldo = totalIngresos - totalEgresos

  useEffect(() => {
    if (deleteError) {
      const t = setTimeout(() => setDeleteError(''), 4000)
      return () => clearTimeout(t)
    }
  }, [deleteError])

  const handleDelete = async (id: string) => {
    try {
      await deleteMovimiento(id)
      setDeleteError('')
    } catch (e) {
      setDeleteError('Error al eliminar. Verifica tu conexión e intenta de nuevo.')
      console.error('Error al eliminar:', e)
    }
    setConfirmDeleteId(null)
  }

  const irAEditar = (m: MovimientoCaja) => {
    const prefix = m.tipo === 'ingreso' ? 'ingresos' : 'egresos'
    router.push(`/admin/caja/${prefix}?id=${m.id}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-dark">
            Caja
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/caja/reportes">
            <Button variant="outline" size="sm">
              <FileText className="mr-1.5 h-4 w-4" /> Reportes
            </Button>
          </Link>
          {puede('caja', 'crear') && (
            <Link href={tab === 'ingresos' ? '/admin/caja/ingresos' : '/admin/caja/egresos'}>
              <Button variant="primary" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Nuevo {tab === 'ingresos' ? 'Ingreso' : 'Egreso'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid gap-5 md:grid-cols-3">
            <SummaryCard
              icon={<TrendingUp className="h-6 w-6" />}
              label="Total Ingresos"
              value={totalIngresos}
              gradient="from-green-500 to-emerald-600"
              badgeColor="bg-green-100 text-green-700"
            />
            <SummaryCard
              icon={<TrendingDown className="h-6 w-6" />}
              label="Total Egresos"
              value={totalEgresos}
              gradient="from-red-500 to-rose-600"
              badgeColor="bg-red-100 text-red-700"
            />
            <SummaryCard
              icon={<CordobaIcon className="h-6 w-6 text-2xl" />}
              label="Saldo Actual"
              value={saldo}
              gradient={saldo >= 0 ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-rose-600'}
              badgeColor={saldo >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
            />
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-2">
            <TabButton
              active={tab === 'ingresos'}
              onClick={() => setTab('ingresos')}
              icon={<ArrowUpCircle className="h-4 w-4" />}
              label="Ingresos"
              activeColor="text-green-600 bg-green-50 border-green-200"
              inactiveColor="text-gray-500 border-gray-200"
            />
            <TabButton
              active={tab === 'egresos'}
              onClick={() => setTab('egresos')}
              icon={<ArrowDownCircle className="h-4 w-4" />}
              label="Egresos"
              activeColor="text-red-600 bg-red-50 border-red-200"
              inactiveColor="text-gray-500 border-gray-200"
            />
          </div>

          {deleteError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {deleteError}
            </div>
          )}

          {/* Table */}
          {filtrados.length === 0 ? (
            <Card className="card-glass">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 rounded-full bg-gray-100 p-4">
                  <CordobaIcon className="h-10 w-10 text-4xl text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No hay {tab === 'ingresos' ? 'ingresos' : 'egresos'} registrados.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Agrega el primer {tab === 'ingresos' ? 'ingreso' : 'egreso'} usando el botón superior.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="card-glass overflow-hidden rounded-2xl border border-gray-100/50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <Th>Fecha</Th>
                      <Th>Categoría</Th>
                      <Th>Concepto</Th>
                      <Th>Responsable</Th>
                      <Th className="text-right">Monto</Th>
                      {puede('caja', 'eliminar') && <Th className="w-10 text-center">Acción</Th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtrados.map((m) => (
                      <tr key={m.id} onDoubleClick={() => irAEditar(m)} className="cursor-pointer transition-colors hover:bg-gray-50/50">
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-gray-600">{m.fecha}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${CAT_COLORS[m.categoria] || 'bg-gray-100 text-gray-700'}`}>
                            {labelCat(m.categoria)}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate px-5 py-3.5 text-sm text-gray-800">{m.concepto}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-500">{m.ingresadoPor}</td>
                        <td className={`whitespace-nowrap px-5 py-3.5 text-right text-sm font-bold tabular-nums ${
                          m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {m.tipo === 'ingreso' ? '+' : '–'} C$ {m.monto.toLocaleString('es', { minimumFractionDigits: 2 })}
                        </td>
                        {puede('caja', 'eliminar') && (
                          <td className="whitespace-nowrap px-2 py-3.5 text-center">
                            {confirmDeleteId === m.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(m.id)}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-red-600"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-lg bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 transition hover:bg-gray-300"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(m.id) }}
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 text-right text-xs text-gray-400">
                Actualizado en tiempo real · {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Components ── */

function SummaryCard({
  icon, label, value, gradient, badgeColor,
}: {
  icon: React.ReactNode; label: string; value: number; gradient: string; badgeColor: string
}) {
  const animated = useCounter(value)
  const isNeg = value < 0

  return (
    <div className="card-glass relative overflow-hidden rounded-2xl p-5">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06]`} />
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 ${badgeColor}`}>
          {icon}
        </div>
      </div>
      <p className="mb-1 mt-4 text-xs font-medium tracking-wide text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${isNeg ? 'text-red-600' : 'text-dark'}`}>
        C$ {Math.abs(animated).toLocaleString('es', { minimumFractionDigits: 2 })}
        {isNeg && <span className="ml-1 text-xs font-medium text-red-500">(deficit)</span>}
      </p>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, activeColor, inactiveColor }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
  activeColor: string; inactiveColor: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all ${
        active
          ? `${activeColor} shadow-sm`
          : `${inactiveColor} hover:bg-gray-50 hover:shadow-sm`
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 ${className || ''}`}>
      {children}
    </th>
  )
}

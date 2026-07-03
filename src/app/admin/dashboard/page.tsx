'use client'

import { useState, useEffect } from 'react'
import { getVisitStats, getUbicaciones, getVisitasRecientes, resetMonthlyCounter, clearVisitasRecientes } from '@/lib/analytics'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, limit, query, Timestamp, doc, deleteDoc } from 'firebase/firestore'

interface AuditEntry {
  id: string
  seccion: string
  accion: string
  usuario: string
  detalle: string
  ubicacion: string
  timestamp: Timestamp
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, hoy: 0, mes: 0 })
  const [ubicaciones, setUbicaciones] = useState<{ ciudades: Record<string, number>; ultima_visita: Record<string, unknown> }>({ ciudades: {}, ultima_visita: {} })
  const [recientes, setRecientes] = useState<Record<string, unknown>[]>([])
  const [logs, setLogs] = useState<AuditEntry[]>([])

  useEffect(() => {
    getVisitStats().then(setStats)
    getUbicaciones().then(setUbicaciones)
    getVisitasRecientes(15).then(setRecientes)
    getDocs(query(collection(db, 'auditoria'), orderBy('timestamp', 'desc'), limit(20)))
      .then(snap => {
        const list: AuditEntry[] = []
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as AuditEntry))
        setLogs(list)
      }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark">Panel de Control</h1>

      {/* stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Visitas Totales</p>
          <p className="mt-1 text-3xl font-bold text-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Este Mes</p>
          <p className="mt-1 text-3xl font-bold text-primary">{stats.mes}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Visitas Hoy</p>
          <p className="mt-1 text-3xl font-bold text-dark">{stats.hoy}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ciudades</p>
          <p className="mt-1 text-3xl font-bold text-dark">{Object.keys(ubicaciones.ciudades).length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Borrar conteo</p>
          <button onClick={async () => {
            if (!confirm('¿Borrar el contador del mes actual?')) return
            await resetMonthlyCounter()
            getVisitStats().then(setStats)
          }} className="mt-2 w-full rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition">
            Borrar conteo mensual
          </button>
          <button onClick={async () => {
            if (!confirm('¿Eliminar todas las visitas recientes?')) return
            await clearVisitasRecientes()
            getVisitasRecientes(15).then(setRecientes)
          }} className="mt-1.5 w-full rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition">
            Limpiar visitas recientes
          </button>
        </div>
      </div>

      {/* ubicaciones frecuentes (nunca se eliminan) */}
      {Object.keys(ubicaciones.ciudades).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-dark">
            Ubicaciones Frecuentes
            <span className="ml-2 text-sm font-normal text-gray-500">(acumulado — nunca se reinicia)</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(ubicaciones.ciudades)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 20)
              .map(([ciudad, count]) => {
                const ult = ubicaciones.ultima_visita[ciudad]
                const ultimaStr = ult
                  ? new Date((ult as { seconds: number }).seconds * 1000).toLocaleString('es')
                  : ''
                return (
                  <div key={ciudad} className="rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-gray-700">{ciudad.replace(/_/g, ' ')}</span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{count} visitas</span>
                    </div>
                    {ultimaStr && <p className="mt-1 text-[10px] text-gray-400">Última: {ultimaStr}</p>}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* visitas recientes */}
      {recientes.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-dark">Visitas Recientes</h2>
          <p className="mb-2 text-xs text-gray-400">Doble clic en una fila para abrir ubicación en Google Maps</p>
          <div className="space-y-1.5">
            {recientes.map((v, i) => {
              const query = [v.ciudad, v.region, v.pais].filter(Boolean).join(', ')
              const gmaps = `https://www.google.com/maps/search/${encodeURIComponent(query)}`
              return (
                <div key={String(v.id) || i}
                  onDoubleClick={() => query && window.open(gmaps, '_blank')}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition"
                  title={query || 'Sin ubicación'}>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{String(v.ciudad || 'Desconocido')}</span>
                    {!!v.pais && <span className="text-xs text-gray-400">{String(v.pais)}</span>}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {v.timestamp
                      ? new Date((v.timestamp as Timestamp).toMillis()).toLocaleString('es')
                      : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* audit log */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-dark">Actividad de Administradores</h2>
          {logs.length > 0 && (
            <button onClick={async () => {
              if (!confirm('¿Eliminar TODOS los registros de actividad de administradores?')) return
              try {
                const col = collection(db, 'auditoria')
                const snap = await getDocs(col)
                const p: Promise<void>[] = []
                snap.forEach(d => p.push(deleteDoc(doc(db, 'auditoria', d.id))))
                await Promise.all(p)
                setLogs([])
              } catch {}
            }} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition">
              Eliminar todo
            </button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No hay actividad registrada aún.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const gmaps = log.ubicacion ? `https://www.google.com/maps/search/${encodeURIComponent(log.ubicacion)}` : null
              return (
              <div key={log.id}
                onDoubleClick={() => gmaps && window.open(gmaps, '_blank')}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    log.seccion === 'Caja' ? 'bg-green-100 text-green-700' :
                    log.seccion === 'Usuarios' ? 'bg-blue-100 text-blue-700' :
                    log.seccion === 'Miembros' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.seccion}
                  </span>
                  <span className="text-gray-700 font-medium">{log.usuario}</span>
                  <span className="text-gray-500">{log.accion}</span>
                  {log.ubicacion && <span className="text-[11px] text-gray-400">({log.ubicacion})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">
                    {log.timestamp?.toDate().toLocaleString('es')}
                  </span>
                  <button onClick={async () => {
                    if (!confirm('¿Eliminar este registro?')) return
                    try { await deleteDoc(doc(db, 'auditoria', log.id)); setLogs(prev => prev.filter(l => l.id !== log.id)) } catch {}
                  }} className="text-red-400 hover:text-red-600 transition">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

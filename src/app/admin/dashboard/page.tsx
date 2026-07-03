'use client'

import { useState, useEffect } from 'react'
import { getVisitStats } from '@/lib/analytics'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, limit, query, Timestamp } from 'firebase/firestore'

interface AuditEntry {
  id: string
  seccion: string
  accion: string
  usuario: string
  detalle: string
  timestamp: Timestamp
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, hoy: 0 })
  const [logs, setLogs] = useState<AuditEntry[]>([])

  useEffect(() => {
    getVisitStats().then(setStats)
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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Visitas Totales</p>
          <p className="mt-1 text-3xl font-bold text-dark">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Visitas Hoy</p>
          <p className="mt-1 text-3xl font-bold text-primary">{stats.hoy}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sesión expira</p>
          <p className="mt-1 text-lg font-semibold text-dark">30 min inactividad</p>
        </div>
      </div>

      {/* audit log */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-dark">Actividad Reciente</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No hay actividad registrada aún.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm">
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
                </div>
                <span className="text-[11px] text-gray-400">
                  {log.timestamp?.toDate().toLocaleString('es')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

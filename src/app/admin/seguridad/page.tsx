'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, limit, Timestamp, doc, deleteDoc } from 'firebase/firestore'

interface SeguridadEntry {
  id: string
  seccion: string
  accion: string
  usuario: string
  detalle: string
  ubicacion: string
  timestamp: Timestamp
}

export default function AdminSeguridadPage() {
  const router = useRouter()
  const { user, puede } = useAuth()
  const [logs, setLogs] = useState<SeguridadEntry[]>([])

  useEffect(() => {
    if (!puede('usuarios', 'ver')) router.replace('/admin/dashboard')
    else loadLogs()
  }, [])

  async function loadLogs() {
    try {
      const snap = await getDocs(query(collection(db, 'auditoria'), orderBy('timestamp', 'desc'), limit(50)))
      const list: SeguridadEntry[] = []
      snap.forEach(d => {
        const data = d.data() as Omit<SeguridadEntry, 'id'>
        if (data.seccion === 'Seguridad') list.push({ id: d.id, ...data })
      })
      setLogs(list)
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de seguridad?')) return
    try { await deleteDoc(doc(db, 'auditoria', id)); setLogs(prev => prev.filter(l => l.id !== id)) }
    catch { /* silent */ }
  }

  async function handleDeleteAll() {
    if (!confirm('¿Eliminar TODOS los registros de seguridad?')) return
    try {
      const col = collection(db, 'auditoria')
      const snap = await getDocs(col)
      const p: Promise<void>[] = []
      snap.forEach(d => { if (d.data().seccion === 'Seguridad') p.push(deleteDoc(doc(db, 'auditoria', d.id))) })
      await Promise.all(p)
      setLogs([])
    } catch { /* silent */ }
  }

  if (!puede('usuarios', 'ver')) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}><ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" /></button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Seguridad</h1>
            <p className="text-sm text-gray-500">Registro de cambios de contraseña</p>
          </div>
        </div>
        {logs.length > 0 && (
          <button onClick={handleDeleteAll}
            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition">
            Eliminar todo
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No hay cambios de contraseña registrados aún.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id}
              className="flex items-start justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm hover:bg-gray-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    log.accion === 'cambio_contraseña' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {log.accion === 'cambio_contraseña' ? 'Cambio manual' : 'Reset por PIN'}
                  </span>
                  <span className="font-medium text-gray-700">{log.usuario}</span>
                  {log.ubicacion && <span className="text-[11px] text-gray-400">({log.ubicacion})</span>}
                </div>
                <p className="text-xs text-gray-500 font-mono break-all">{log.detalle}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {log.timestamp?.toDate().toLocaleString('es')}
                </span>
                <button onClick={() => handleDelete(log.id)}
                  className="text-red-400 hover:text-red-600 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

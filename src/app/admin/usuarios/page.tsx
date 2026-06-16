'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Plus, Trash2, Save, X, Key, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { hashPassword } from '@/lib/hash'
import type { User, UserRole, Permisos, PermisosSeccion } from '@/types'
import { ROLES_PRESET } from '@/types'

interface UserForm {
  username: string
  password: string
  nombre: string
  role: UserRole
  permisos: Permisos
}

const SECCIONES: { key: keyof Permisos; label: string }[] = [
  { key: 'caja', label: 'Caja' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'cultos', label: 'Cultos' },
  { key: 'envivo', label: 'En Vivo' },
  { key: 'usuarios', label: 'Usuarios' },
]

const ACCIONES: { key: string; label: string }[] = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
]

function permisosVacios(): Permisos {
  return {
    caja: { ver: false, crear: false, editar: false, eliminar: false },
    actividades: { ver: false, crear: false, editar: false, eliminar: false },
    cultos: { ver: false, crear: false, editar: false, eliminar: false },
    envivo: { ver: false, activar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  }
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { user: currentUser, puede } = useAuth()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>({
    username: '', password: '', nombre: '', role: 'visual', permisos: permisosVacios(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!puede('usuarios', 'ver')) router.replace('/admin/dashboard')
    else loadUsuarios()
  }, [])

  async function loadUsuarios() {
    try {
      const snap = await getDocs(collection(db, 'usuarios'))
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)))
    } catch { setError('Error al cargar usuarios') }
  }

  function startCreate() {
    setEditingId(null)
    setForm({ username: '', password: '', nombre: '', role: 'visual', permisos: permisosVacios() })
    setShowForm(true)
  }

  function startEdit(u: User) {
    setEditingId(u.id)
    setForm({ username: u.username, password: '', nombre: u.nombre, role: u.role, permisos: u.permisos })
    setShowForm(true)
  }

  function applyRolePreset(role: UserRole) {
    setForm((f) => ({ ...f, role, permisos: { ...ROLES_PRESET[role] } }))
  }

  function togglePermiso(seccion: keyof Permisos, accion: string) {
    setForm((f) => ({
      ...f,
      permisos: {
        ...f.permisos,
        [seccion]: {
          ...f.permisos[seccion],
          [accion]: !(f.permisos[seccion] as Record<string, boolean>)[accion],
        },
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const data: Record<string, unknown> = {
        username: form.username,
        nombre: form.nombre,
        role: form.role,
        permisos: form.permisos,
        activo: true,
        creadoEn: Date.now(),
      }
      if (form.password) data.passwordHash = await hashPassword(form.password)
      if (editingId) {
        const existing = usuarios.find((u) => u.id === editingId)
        if (!form.password) data.passwordHash = existing?.passwordHash
        await setDoc(doc(db, 'usuarios', editingId), data, { merge: true })
      } else {
        await setDoc(doc(collection(db, 'usuarios')), data)
      }
      setShowForm(false)
      loadUsuarios()
    } catch { setError('Error al guardar usuario') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return
    try { await deleteDoc(doc(db, 'usuarios', id)); loadUsuarios() }
    catch { setError('Error al eliminar usuario') }
  }

  if (!puede('usuarios', 'ver')) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}><ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" /></button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Usuarios</h1>
            <p className="text-sm text-gray-500">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {puede('usuarios', 'crear') && (
          <Button variant="primary" size="sm" onClick={startCreate}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Usuario
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      {showForm && (
        <div className="card-glass mb-8 rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark">{editingId ? 'Editar' : 'Nuevo'} Usuario</h2>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Input label="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input label={editingId ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} />
            <Input label="Nombre Completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Rol (predefinido)</label>
            <div className="flex flex-wrap gap-2">
              {(['it-admin', 'tesorero', 'secretario', 'visual'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => applyRolePreset(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    form.role === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r === 'it-admin' ? 'IT Admin' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Permisos personalizados
            </label>
            <div className="space-y-3">
              {SECCIONES.map((sec) => (
                <div key={sec.key} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-2 text-sm font-bold text-dark">{sec.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCIONES.map((acc) => {
                      const perms = form.permisos[sec.key] as Record<string, boolean> | undefined
                      const active = perms?.[acc.key] ?? false
                      return (
                        <button
                          key={acc.key}
                          onClick={() => togglePermiso(sec.key, acc.key)}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                            active ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {acc.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {puede('usuarios', editingId ? 'editar' : 'crear') && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="card-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-left">
              <th className="px-4 py-3 font-semibold text-gray-500">Usuario</th>
              <th className="px-4 py-3 font-semibold text-gray-500">Nombre</th>
              <th className="px-4 py-3 font-semibold text-gray-500">Rol</th>
              <th className="px-4 py-3 font-semibold text-gray-500">Activo</th>
              <th className="px-4 py-3 font-semibold text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 transition hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-dark">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.nombre}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.activo ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {puede('usuarios', 'editar') && (
                      <button onClick={() => startEdit(u)} className="text-xs text-primary hover:underline">Editar</button>
                    )}
                    {puede('usuarios', 'eliminar') && u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!usuarios.length && <p className="p-6 text-center text-sm text-gray-400">No hay usuarios registrados</p>}
      </div>
    </div>
  )
}

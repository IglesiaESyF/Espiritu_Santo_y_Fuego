'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Pencil, Trash2, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { PAISES, getDepartamentos, getCiudades, getBarrios } from '@/data/ubicaciones'
import type { Miembro, Familia } from '@/types'

function calcularEdad(fecha: string): number {
  if (!fecha) return 0
  const hoy = new Date()
  const nac = new Date(fecha)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function calcularCategoria(edad: number): string {
  if (edad <= 11) return 'nino'
  if (edad <= 14) return 'preadolescente'
  if (edad <= 17) return 'adolescente'
  if (edad <= 39) return 'joven_adulto'
  return 'adulto_mayor'
}

const CATEGORIA_LABEL: Record<string, string> = {
  nino: 'Niño',
  preadolescente: 'Preadolescente',
  adolescente: 'Adolescente',
  joven_adulto: 'Joven Adulto',
  adulto_mayor: 'Adulto Mayor',
}

const CATEGORIA_COLOR: Record<string, string> = {
  nino: 'bg-blue-100 text-blue-700',
  preadolescente: 'bg-teal-100 text-teal-700',
  adolescente: 'bg-purple-100 text-purple-700',
  joven_adulto: 'bg-green-100 text-green-700',
  adulto_mayor: 'bg-orange-100 text-orange-700',
}

function emptyMiembro(): Omit<Miembro, 'id' | 'creadoEn'> {
  return {
    nombre: '', apellido: '', fecha_nacimiento: '', edad: 0,
    pais: 'Honduras', departamento: '', ciudad: '', barrio: '', direccion: '',
    celular: '', correo: '', estado: 'no_bautizado', categoria: '', familia_id: null,
    notas: '', activo: true,
  }
}

function timeout(ms: number) {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

export default function AdminMiembrosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyMiembro())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showFamiliaForm, setShowFamiliaForm] = useState(false)
  const [familiaForm, setFamiliaForm] = useState({ apellido: '', nombre_padre: '', nombre_madre: '', telefono: '', direccion: '' })
  const [familiaSearch, setFamiliaSearch] = useState('')

  const puedeAcceder = user && (user.role === 'it-admin' || user.role === 'tesorero' || user.role === 'secretario')

  useEffect(() => {
    if (!puedeAcceder) router.replace('/admin/dashboard')
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [miemSnap, famSnap] = await Promise.all([
        Promise.race([getDocs(collection(db, 'miembros')), timeout(8000)]),
        Promise.race([getDocs(collection(db, 'familias')), timeout(8000)]),
      ])
      const ms = miemSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Miembro))
      const fs = famSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Familia))
      setMiembros(ms.sort((a, b) => a.apellido.localeCompare(b.apellido)))
      setFamilias(fs.sort((a, b) => a.apellido.localeCompare(b.apellido)))
    } catch {
      setError('Error al cargar datos')
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let r = [...miembros]
    const q = search.toLowerCase()
    if (q) r = r.filter((m) => `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) || m.celular.includes(q))
    if (filterCategoria) r = r.filter((m) => m.categoria === filterCategoria)
    if (filterEstado) r = r.filter((m) => m.estado === filterEstado)
    return r
  }, [miembros, search, filterCategoria, filterEstado])

  function handleField(field: keyof typeof form, value: string | boolean | null) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'fecha_nacimiento') {
        next.edad = calcularEdad(value as string)
        next.categoria = calcularCategoria(next.edad)
      }
      if (field === 'pais') { next.departamento = ''; next.ciudad = ''; next.barrio = '' }
      if (field === 'departamento') { next.ciudad = ''; next.barrio = '' }
      if (field === 'ciudad') { next.barrio = '' }
      return next
    })
  }

  function handleEdit(m: Miembro) {
    setForm({
      nombre: m.nombre, apellido: m.apellido, fecha_nacimiento: m.fecha_nacimiento,
      edad: m.edad, pais: m.pais, departamento: m.departamento, ciudad: m.ciudad,
      barrio: m.barrio, direccion: m.direccion, celular: m.celular, correo: m.correo,
      estado: m.estado, categoria: m.categoria, familia_id: m.familia_id, notas: m.notas, activo: m.activo,
    })
    setEditingId(m.id)
    setShowForm(true)
  }

  function resetForm() {
    setForm(emptyMiembro())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  async function handleSave() {
    if (!form.nombre || !form.apellido) { setError('Nombre y apellido son obligatorios'); return }
    setSaving(true)
    setError('')
    try {
      const data = { ...form, updatedAt: serverTimestamp() }
      if (editingId) {
        await Promise.race([setDoc(doc(db, 'miembros', editingId), data), timeout(8000)])
      } else {
        await Promise.race([setDoc(doc(db, 'miembros', crypto.randomUUID()), { ...data, creadoEn: Date.now() }), timeout(8000)])
      }
      resetForm()
      loadData()
    } catch {
      setError('Error al guardar')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este miembro?')) return
    try {
      await Promise.race([deleteDoc(doc(db, 'miembros', id)), timeout(8000)])
      loadData()
    } catch {
      setError('Error al eliminar')
    }
  }

  async function handleSaveFamilia() {
    if (!familiaForm.apellido) return
    setSaving(true)
    try {
      await Promise.race([setDoc(doc(db, 'familias', crypto.randomUUID()), { ...familiaForm, creadoEn: Date.now() }), timeout(8000)])
      setShowFamiliaForm(false)
      setFamiliaForm({ apellido: '', nombre_padre: '', nombre_madre: '', telefono: '', direccion: '' })
      const famSnap = await Promise.race([getDocs(collection(db, 'familias')), timeout(8000)])
      setFamilias(famSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Familia)).sort((a, b) => a.apellido.localeCompare(b.apellido)))
    } catch {
      setError('Error al guardar familia')
    }
    setSaving(false)
  }

  const familiasFiltradas = familias.filter((f) =>
    f.apellido.toLowerCase().includes(familiaSearch.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  if (!puedeAcceder) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}><ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" /></button>
          <div>
            <h1 className="text-2xl font-bold text-dark">Miembros</h1>
            <p className="text-sm text-gray-500">{miembros.length} miembro{miembros.length !== 1 ? 's' : ''} registrados</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="mr-1 h-4 w-4" /> Agregar Miembro
        </Button>
      </div>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
          />
        </div>
        <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="bautizado">Bautizado</option>
          <option value="no_bautizado">No Bautizado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Edad</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Familia</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => {
              const fam = familias.find((f) => f.id === m.familia_id)
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.nombre} {m.apellido}</td>
                  <td className="px-4 py-3 text-gray-500">{m.edad} años</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORIA_COLOR[m.categoria] || 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORIA_LABEL[m.categoria] || m.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.celular}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${m.estado === 'bautizado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {m.estado === 'bautizado' ? 'Bautizado' : 'No Bautizado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fam?.apellido || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(m)} className="mr-2 text-gray-400 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No se encontraron miembros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-10" onClick={resetForm}>
          <div
            className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-2xl transition-all duration-300 scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={resetForm} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            <h2 className="mb-6 text-lg font-bold text-dark">{editingId ? 'Editar Miembro' : 'Nuevo Miembro'}</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Nombre *" value={form.nombre} onChange={(e) => handleField('nombre', e.target.value)} />
              <Input label="Apellido *" value={form.apellido} onChange={(e) => handleField('apellido', e.target.value)} />
              <Input label="Fecha de Nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => handleField('fecha_nacimiento', e.target.value)} />
              <Input label="Edad" value={String(form.edad)} disabled />
              <Input label="Celular" value={form.celular} onChange={(e) => handleField('celular', e.target.value)} />
              <Input label="Correo Electrónico" type="email" value={form.correo} onChange={(e) => handleField('correo', e.target.value)} />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">País</label>
                <select value={form.pais} onChange={(e) => handleField('pais', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
                  {PAISES.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Departamento</label>
                <select value={form.departamento} onChange={(e) => handleField('departamento', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  {getDepartamentos(form.pais).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ciudad</label>
                <select value={form.ciudad} onChange={(e) => handleField('ciudad', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  {getCiudades(form.pais, form.departamento).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Barrio</label>
                <select value={form.barrio} onChange={(e) => handleField('barrio', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  {getBarrios(form.pais, form.departamento, form.ciudad).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <Input label="Dirección" value={form.direccion} onChange={(e) => handleField('direccion', e.target.value)} />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="estado" value="bautizado" checked={form.estado === 'bautizado'} onChange={() => handleField('estado', 'bautizado')} className="accent-primary" />
                    <span className="text-sm">Bautizado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="estado" value="no_bautizado" checked={form.estado === 'no_bautizado'} onChange={() => handleField('estado', 'no_bautizado')} className="accent-primary" />
                    <span className="text-sm">No Bautizado</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
                <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                  {form.categoria ? CATEGORIA_LABEL[form.categoria] : 'Se calculará al ingresar fecha de nacimiento'}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Familia</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={familiaSearch}
                      onChange={(e) => setFamiliaSearch(e.target.value)}
                      placeholder="Buscar familia por apellido..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    />
                    {familiaSearch && familiasFiltradas.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {familiasFiltradas.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              handleField('familia_id', f.id)
                              setFamiliaSearch(f.apellido)
                            }}
                            className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 ${form.familia_id === f.id ? 'bg-primary/10 font-medium' : ''}`}
                          >
                            <span>Familia {f.apellido}</span>
                            <span className="text-xs text-gray-400">{f.nombre_padre && f.nombre_padre}{f.nombre_padre && f.nombre_madre ? ' & ' : ''}{f.nombre_madre && f.nombre_madre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowFamiliaForm(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.familia_id && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Familia: {familias.find((f) => f.id === form.familia_id)?.apellido}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Input label="Notas" value={form.notas} onChange={(e) => handleField('notas', e.target.value)} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFamiliaForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowFamiliaForm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-dark">Nueva Familia</h3>
              <button onClick={() => setShowFamiliaForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <Input label="Apellido Familiar *" value={familiaForm.apellido} onChange={(e) => setFamiliaForm((p) => ({ ...p, apellido: e.target.value }))} />
              <Input label="Nombre del Padre" value={familiaForm.nombre_padre} onChange={(e) => setFamiliaForm((p) => ({ ...p, nombre_padre: e.target.value }))} />
              <Input label="Nombre de la Madre" value={familiaForm.nombre_madre} onChange={(e) => setFamiliaForm((p) => ({ ...p, nombre_madre: e.target.value }))} />
              <Input label="Teléfono" value={familiaForm.telefono} onChange={(e) => setFamiliaForm((p) => ({ ...p, telefono: e.target.value }))} />
              <Input label="Dirección" value={familiaForm.direccion} onChange={(e) => setFamiliaForm((p) => ({ ...p, direccion: e.target.value }))} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFamiliaForm(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={handleSaveFamilia} disabled={saving}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

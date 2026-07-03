'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Save, ArrowLeft, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface Noticia {
  id?: string
  titulo: string
  mensaje: string
  imagenUrl: string
  videoUrl: string
  fechaCreacion: Timestamp
  fechaExpiracion: Timestamp
}

const FIRESTORE_COLLECTION = 'noticias'

function timeout(ms: number) {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

export default function AdminNoticiasPage() {
  const router = useRouter()
  const { puede } = useAuth()
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!puede('noticias', 'ver')) router.replace('/admin/dashboard')
    loadNoticias()
  }, [])

  async function loadNoticias() {
    try {
      const snap = await Promise.race([
        getDocs(collection(db, FIRESTORE_COLLECTION)),
        timeout(8000),
      ])
      const list: Noticia[] = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() as Noticia }))
      list.sort((a, b) => b.fechaCreacion?.toMillis() - a.fechaCreacion?.toMillis())
      setNoticias(list)
    } catch {
      setError('No se pudieron cargar las noticias.')
    }
  }

  function resetForm() {
    setTitulo('')
    setMensaje('')
    setImagenUrl('')
    setVideoUrl('')
    setEditingId(null)
  }

  function openEdit(n: Noticia) {
    setTitulo(n.titulo)
    setMensaje(n.mensaje)
    setImagenUrl(n.imagenUrl || '')
    setVideoUrl(n.videoUrl || '')
    setEditingId(n.id || null)
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `noticias/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setImagenUrl(url)
    } catch {
      setError('Error al subir la imagen. Usa el campo "URL de la imagen" como alternativa.')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const ahora = Timestamp.now()
    const expiracion = new Date(ahora.toMillis() + 15 * 24 * 60 * 60 * 1000)

    const data = {
      titulo,
      mensaje,
      imagenUrl: imagenUrl || '',
      videoUrl: videoUrl || '',
      fechaCreacion: editingId ? undefined : ahora,
      fechaExpiracion: Timestamp.fromDate(expiracion),
    }

    try {
      if (editingId) {
        const updateData: Record<string, unknown> = { ...data }
        delete updateData.fechaCreacion
        updateData.updatedAt = serverTimestamp()
        await Promise.race([
          updateDoc(doc(db, FIRESTORE_COLLECTION, editingId), updateData),
          timeout(8000),
        ])
      } else {
        await Promise.race([
          addDoc(collection(db, FIRESTORE_COLLECTION), { ...data, createdAt: serverTimestamp() }),
          timeout(8000),
        ])
      }
      await loadNoticias()
      resetForm()
      setShowForm(false)
    } catch {
      setError('Error al guardar. Verifica tu conexión.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    try {
      await Promise.race([
        deleteDoc(doc(db, FIRESTORE_COLLECTION, id)),
        timeout(8000),
      ])
      await loadNoticias()
    } catch {
      setError('Error al eliminar.')
    }
  }

  const expirado = (n: Noticia) => n.fechaExpiracion?.toMillis() < Date.now()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-dark">Noticias</h1>
        </div>
        {puede('noticias', 'crear') && (
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
            <Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancelar' : 'Nueva Noticia'}
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Título" placeholder="Título de la noticia" value={titulo} onChange={e => setTitulo(e.target.value)} required />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje</label>
                <textarea
                  placeholder="Escribe el mensaje..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Imagen</label>
                <div className="flex gap-3">
                  <Input placeholder="URL de la imagen (pégalo aquí si ya la tienes en internet)" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} />
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Subir
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="mt-1 text-xs text-amber-600">Subiendo imagen... si se tarda mucho, usa el campo URL.</p>}
                {imagenUrl && (
                  <img src={imagenUrl} alt="preview" className="mt-2 h-24 w-40 rounded object-cover" />
                )}
              </div>

              <Input label="Video (URL)" placeholder="https://youtube.com/..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />

              <p className="text-xs text-gray-500">La noticia se eliminará automáticamente después de 15 días.</p>

              <div className="flex gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Publicar'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {noticias.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>No hay noticias aún.</p>
            <p className="mt-1 text-sm">Crea la primera usando el botón "Nueva Noticia".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {noticias.map(n => (
            <Card key={n.id} className={expirado(n) ? 'opacity-50' : ''}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-dark">{n.titulo}</h3>
                    {expirado(n) && <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Expirada</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{n.mensaje}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {n.imagenUrl && <img src={n.imagenUrl} alt="" className="h-14 w-20 rounded object-cover" />}
                    {n.videoUrl && <span className="rounded bg-blue-100 px-2 py-1 text-[10px] text-blue-600">🎬 Video</span>}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Expira: {n.fechaExpiracion?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  {puede('noticias', 'editar') && (
                    <button onClick={() => openEdit(n)} className="text-primary hover:text-primary-dark"><Pencil className="h-4 w-4" /></button>
                  )}
                  {puede('noticias', 'eliminar') && (
                    <button onClick={() => { if (n.id) handleDelete(n.id) }} className="text-accent hover:text-accent-light"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

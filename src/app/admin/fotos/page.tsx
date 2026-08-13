'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Trash2, Upload, Images, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { enhanceImageBlob } from '@/lib/image-enhance'

interface Foto {
  id: string
  imagenUrl: string
  fechaExpiracion: Timestamp
  subidoPor?: string
  creadoEn: number
}

const DIAS_VIGENCIA = 15
const TAMANO_MAX = 600 * 1024

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminFotosPage() {
  const router = useRouter()
  const { user, puede } = useAuth()
  const [fotos, setFotos] = useState<Foto[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [mejorar, setMejorar] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!puede('noticias', 'ver')) {
      router.replace('/admin/dashboard')
      return
    }
    loadFotos()
  }, [])

  async function loadFotos() {
    try {
      const snap = await getDocs(collection(db, 'fotos'))
      const list: Foto[] = []
      const now = Date.now()
      const expiredIds: string[] = []
      snap.forEach(d => {
        const f = { id: d.id, ...d.data() } as Foto
        if (f.fechaExpiracion && f.fechaExpiracion.toMillis() <= now) expiredIds.push(d.id)
        else list.push(f)
      })
      expiredIds.forEach(id => deleteDoc(doc(db, 'fotos', id)).catch(() => {}))
      list.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0))
      setFotos(list)
    } catch {
      setError('No se pudieron cargar las fotos.')
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        if (file.size > TAMANO_MAX) {
          setError(`${file.name} es muy pesada. Máximo 600 KB.`)
          continue
        }
        let imagenUrl: string
        if (mejorar) {
          try {
            const blob = await enhanceImageBlob(file)
            imagenUrl = await blobToDataUrl(blob)
          } catch {
            imagenUrl = await readFile(file)
          }
        } else {
          imagenUrl = await readFile(file)
        }
        await addDoc(collection(db, 'fotos'), {
          imagenUrl,
          fechaExpiracion: Timestamp.fromDate(new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000)),
          subidoPor: user?.nombre || '',
          creadoEn: Date.now(),
        })
      }
      await loadFotos()
    } catch {
      setError('Error al subir las fotos.')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta foto?')) return
    try {
      await deleteDoc(doc(db, 'fotos', id))
      loadFotos()
    } catch {
      setError('Error al eliminar la foto.')
    }
  }

  function diasRestantes(f: Foto): number {
    if (!f.fechaExpiracion) return 0
    return Math.max(0, Math.ceil((f.fechaExpiracion.toMillis() - Date.now()) / (24 * 60 * 60 * 1000)))
  }

  if (!puede('noticias', 'ver')) return null

  return (
    <div className="min-h-screen bg-[#f8f6f0]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-primary/30 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fotos de Actividades y Noticias</h1>
              <p className="mt-1 text-sm text-gray-500">Sube fotos sin necesidad de título ni mensaje. Se eliminan automáticamente a los {DIAS_VIGENCIA} días</p>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="rounded-2xl border border-[#e8e0d0] bg-white p-8 shadow-lg shadow-amber-900/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#f0e8d8] pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100">
              <Camera className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Subir fotos</h2>
              <p className="text-xs text-gray-400">Puedes seleccionar varias a la vez · máximo 600 KB cada una</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#f0e8d8] bg-[#faf8f4] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-purple-100">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Mejora automática al subir</p>
                <p className="text-xs text-gray-500">Corrige tono, contraste, saturación y nitidez para que las fotos se vean mejor</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={mejorar}
              onClick={() => setMejorar(v => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${mejorar ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${mejorar ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#e0d8c8] bg-[#faf8f4] p-8 text-center">
            <Images className="h-10 w-10 text-amber-600/60" />
            <p className="text-sm text-gray-500">Haz clic para seleccionar las fotos</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-700 to-yellow-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition hover:from-amber-800 hover:to-yellow-800">
              <Upload className="h-4 w-4" />
              {uploading ? 'Subiendo...' : 'Seleccionar fotos'}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
            </label>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-600">
              Fotos activas <span className="ml-1 text-gray-400">({fotos.length})</span>
            </h3>
            {fotos.length === 0 ? (
              <p className="rounded-xl border border-[#f0e8d8] bg-[#faf8f4] p-6 text-center text-sm text-gray-400">No hay fotos activas</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {fotos.map(f => (
                  <div key={f.id} className="group relative overflow-hidden rounded-xl border border-[#f0e8d8] bg-[#faf8f4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.imagenUrl} alt="Foto de actividad" className="h-36 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {diasRestantes(f)} día{diasRestantes(f) !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Eliminar foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

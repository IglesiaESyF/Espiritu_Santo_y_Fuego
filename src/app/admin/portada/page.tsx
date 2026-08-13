'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Image as ImageIcon, Trash2, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { getPortada, savePortada, deletePortada } from '@/lib/portada'

export default function AdminPortadaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [imagenUrl, setImagenUrl] = useState('')
  const [actual, setActual] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const esAdmin = user?.role === 'it-admin'

  useEffect(() => {
    if (!esAdmin) {
      router.replace('/admin/dashboard')
      return
    }
    getPortada().then(cfg => {
      if (cfg?.imagenUrl) {
        setActual(cfg.imagenUrl)
        setImagenUrl(cfg.imagenUrl)
      }
    })
  }, [])

  if (!esAdmin) return null

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 300 * 1024) {
      setError('La imagen es muy pesada. Máximo 300 KB. Usa el campo URL para imágenes más grandes.')
      return
    }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setImagenUrl(reader.result as string)
      setUploading(false)
    }
    reader.onerror = () => {
      setError('Error al leer la imagen. Intenta con otra.')
      setUploading(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSave() {
    if (!imagenUrl.trim()) { setError('Pega una URL o sube una imagen primero.'); return }
    setSaving(true)
    setError('')
    try {
      await savePortada({
        imagenUrl: imagenUrl.trim(),
        actualizadoPor: user?.nombre || 'it-admin',
        actualizadoEn: Date.now(),
      })
      setActual(imagenUrl.trim())
      setOk('Portada guardada correctamente.')
    } catch {
      setError('Error al guardar la portada.')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar la portada actual? La imagen desaparecerá de la cabecera y el pie de página.')) return
    setSaving(true)
    setError('')
    try {
      await deletePortada()
      setActual('')
      setImagenUrl('')
      setOk('Portada eliminada.')
    } catch {
      setError('Error al eliminar la portada.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-primary/30 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Portada de la Página</h1>
              <p className="mt-1 text-sm text-gray-500">Sube una imagen que se divida en dos: la mitad superior en la cabecera y la mitad inferior en el pie de página del sitio público</p>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {ok && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</p>}

        <div className="rounded-2xl border border-[#e8e0d0] bg-white p-8 shadow-lg shadow-amber-900/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#f0e8d8] pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100">
              <ImageIcon className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Configuración</h2>
              <p className="text-xs text-gray-400">La imagen se parte en dos desde el centro</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">URL de la imagen</label>
            <input
              type="text"
              value={imagenUrl}
              onChange={(e) => { setImagenUrl(e.target.value); setOk('') }}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-gray-400">O sube una imagen directamente (máximo 300 KB):</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-amber-300 hover:bg-amber-50/50">
              <Upload className="h-4 w-4 text-amber-600" />
              {uploading ? 'Subiendo...' : 'Subir imagen'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {imagenUrl && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">Vista previa del partido en dos</p>
              <div className="space-y-3 rounded-xl border border-[#f0e8d8] bg-[#faf8f4] p-4">
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-gray-500">Mitad superior (cabecera)</p>
                  <div className="overflow-hidden rounded-lg border border-[#e0d8c8]" style={{ maxHeight: 120 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenUrl} alt="Mitad superior" className="w-full" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-gray-500">Mitad inferior (pie de página)</p>
                  <div className="overflow-hidden rounded-lg border border-[#e0d8c8]" style={{ maxHeight: 120 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenUrl} alt="Mitad inferior" className="w-full" style={{ objectFit: 'cover', objectPosition: 'center bottom' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 bg-gradient-to-r from-amber-700 to-yellow-700 text-white shadow-lg shadow-amber-900/20 hover:from-amber-800 hover:to-yellow-800"
              disabled={saving || !imagenUrl.trim()}
              onClick={handleSave}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Portada'}
            </Button>
            {actual && (
              <Button
                variant="outline"
                size="lg"
                className="border-[#e0d8c8] text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50"
                disabled={saving}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

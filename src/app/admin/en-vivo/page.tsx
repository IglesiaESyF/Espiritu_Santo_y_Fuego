'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Video } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const STORAGE_KEY = 'iesfuego-live-settings'
const FIRESTORE_PATH = 'config/live'

export default function AdminEnVivoPage() {
  const router = useRouter()
  const [paginaFacebook, setPaginaFacebook] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [activo, setActivo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const snap = await getDoc(doc(db, FIRESTORE_PATH))
      if (snap.exists()) {
        const d = snap.data()
        setPaginaFacebook(d.paginaFacebook || '')
        setVideoUrl(d.videoUrl || '')
        setActivo(d.activo || false)
        setMensaje(d.mensaje || '')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
        return
      }
    } catch {}
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setPaginaFacebook(data.paginaFacebook || '')
        setVideoUrl(data.videoUrl || '')
        setActivo(data.activo || false)
        setMensaje(data.mensaje || '')
      } catch {}
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const data = { paginaFacebook, videoUrl, activo, mensaje }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    try {
      await setDoc(doc(db, FIRESTORE_PATH), {
        ...data,
        updatedAt: serverTimestamp(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError('No se pudo guardar en la nube. Se guardó localmente.')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const embedUrl = videoUrl
    ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&width=734`
    : paginaFacebook
      ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(paginaFacebook)}&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false`
      : ''

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-dark">Transmisión en Vivo</h1>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Nombre o URL de la página de Facebook"
              placeholder="Ej: https://www.facebook.com/IglesiaEspirituSantoFuego"
              value={paginaFacebook}
              onChange={(e) => setPaginaFacebook(e.target.value)}
            />

            <Input
              label="URL del video en vivo (opcional)"
              placeholder="Ej: https://www.facebook.com/.../videos/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-green-500 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm font-medium text-gray-700">
                {activo ? 'En Vivo ahora' : 'Transmisión desactivada'}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mensaje cuando no hay live <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Ej: Próximo culto: Domingo 10:00 AM"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-amber-600">{error}</p>}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar Configuración'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {embedUrl && (
        <Card className="mx-auto mt-6 max-w-lg">
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <Video className="h-5 w-5 text-primary" /> Vista Previa
            </h3>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden rounded-lg bg-dark/5" style={{ height: 400 }}>
              <iframe
                src={embedUrl}
                className="h-full w-full"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder={0}
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mx-auto mt-6 max-w-lg">
        <CardHeader>
          <h3 className="font-semibold text-dark">Cómo transmitir desde Facebook</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. Crea una página de Facebook para la iglesia.</p>
          <p>2. Abre la página en la app de Facebook en tu celular.</p>
          <p>3. Toca <strong>"Publicar"</strong> → <strong>"Video en vivo"</strong>.</p>
          <p>4. Configura y presiona <strong>"Transmitir en vivo"</strong>.</p>
          <p>5. Vuelve acá y activa el interruptor <strong>"En Vivo ahora"</strong>.</p>
          <p>6. Opcional: pega la URL del video para mostrarlo directamente.</p>
          <p className="mt-2 text-xs text-gray-400">
            Facebook no tiene límite de seguidores para transmitir en vivo desde páginas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

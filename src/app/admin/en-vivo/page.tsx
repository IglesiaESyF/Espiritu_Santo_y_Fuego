'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Video } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const FIRESTORE_PATH = 'config/live'

function timeout(ms: number) {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

export default function AdminEnVivoPage() {
  const router = useRouter()
  const { puede } = useAuth()
  const [plataforma, setPlataforma] = useState('facebook')
  const [paginaFacebook, setPaginaFacebook] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [activo, setActivo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!puede('envivo', 'ver')) router.replace('/admin/dashboard')
    loadData()
  }, [])

  async function loadData() {
    try {
      const snap = await Promise.race([
        getDoc(doc(db, FIRESTORE_PATH)),
        timeout(8000),
      ])
      if (snap.exists()) {
        const d = snap.data()
        setPlataforma(d.plataforma || 'facebook')
        setPaginaFacebook(d.paginaFacebook || '')
        setVideoUrl(d.videoUrl || '')
        setActivo(d.activo || false)
        setMensaje(d.mensaje || '')
      }
    } catch {
      setError('No se pudo cargar la configuración desde Firebase.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const data = { plataforma, paginaFacebook, videoUrl, activo, mensaje }
    try {
      await Promise.race([
        setDoc(doc(db, FIRESTORE_PATH), {
          ...data,
          updatedAt: serverTimestamp(),
        }),
        timeout(8000),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Error al guardar en Firebase. Verifica tu conexión e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const buildEmbedUrl = () => {
    if (!videoUrl) return ''
    switch (plataforma) {
      case 'youtube': {
        const id = extractYouTubeId(videoUrl)
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : ''
      }
      case 'facebook':
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&width=734`
      case 'otro':
        return videoUrl
      default:
        return ''
    }
  }

  const embedUrl = buildEmbedUrl()

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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Plataforma</label>
              <div className="flex gap-4">
                {[
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'otro', label: 'Otro (StreamYard, etc.)' },
                ].map((p) => (
                  <label key={p.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="plataforma"
                      value={p.value}
                      checked={plataforma === p.value}
                      onChange={() => setPlataforma(p.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label={plataforma === 'youtube' ? 'URL del video de YouTube' : plataforma === 'facebook' ? 'URL del video de Facebook' : 'URL o código embed del streaming'}
              placeholder={
                plataforma === 'youtube'
                  ? 'https://youtube.com/watch?v=...'
                  : plataforma === 'facebook'
                    ? 'https://www.facebook.com/.../videos/...'
                    : 'https://streamyard.com/...'
              }
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <Input
              label="Nombre o URL de la página de Facebook"
              placeholder="Ej: https://www.facebook.com/IglesiaEspirituSantoFuego"
              value={paginaFacebook}
              onChange={(e) => setPaginaFacebook(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <label className={`relative inline-flex items-center ${puede('envivo', 'activar') ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  disabled={!puede('envivo', 'activar')}
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

            {puede('envivo', 'activar') && (
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
                <Save className="mr-2 h-4 w-4" /> {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar Configuración'}
              </Button>
            )}
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
          <h3 className="font-semibold text-dark">Cómo transmitir en vivo</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          {plataforma === 'facebook' && (
            <>
              <p>1. Abrí la página de la iglesia en la app de Facebook en tu celular.</p>
              <p>2. Tocá <strong>"Publicar"</strong> → <strong>"Video en vivo"</strong>.</p>
              <p>3. Configurá y presioná <strong>"Transmitir en vivo"</strong>.</p>
              <p>4. Pegá acá la URL del video para mostrarlo en la web.</p>
              <p className="mt-2 text-xs text-gray-400">Facebook no pide mínimo de seguidores para transmitir desde una página.</p>
            </>
          )}
          {plataforma === 'youtube' && (
            <>
              <p>1. Abrí la app de YouTube en tu celular.</p>
              <p>2. Tocá el icono <strong>"+"</strong> → <strong>"Transmitir en vivo"</strong>.</p>
              <p>3. Configurá título, visibilidad y presioná <strong>"Comenzar transmisión"</strong>.</p>
              <p>4. Pegá acá la URL del video de YouTube.</p>
              <p className="mt-2 text-xs text-gray-400">
                YouTube puede pedir verificación de cuenta (sin costo) para habilitar lives desde el celular.
              </p>
            </>
          )}
          {plataforma === 'otro' && (
            <>
              <p>1. Usá <strong>StreamYard</strong>, <strong>Restream</strong> u otro servicio.</p>
              <p>2. Iniciá la transmisión desde la app de ese servicio.</p>
              <p>3. Copiá el link o código embed que te dan.</p>
              <p>4. Pegá acá la URL completa o el iframe.</p>
              <p className="mt-2 text-xs text-gray-400">Estos servicios no piden mínimo de seguidores.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return m ? m[1] : null
}

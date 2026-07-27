'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import type { Miembro } from '@/types'

function getLogoCached(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('logoB64') || ''
}

function useLogoPreload() {
  useEffect(() => {
    if (getLogoCached()) return
    const paths = ['/logo.png']
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH)
      paths.unshift(process.env.NEXT_PUBLIC_BASE_PATH + '/logo.png')
    for (const p of paths) {
      fetch(p).then(r => { if (!r.ok) throw Error(); return r.blob() }).then(b => {
        const r = new FileReader()
        r.onload = () => localStorage.setItem('logoB64', r.result as string)
        r.readAsDataURL(b)
      }).catch(() => {})
    }
  }, [])
}

export default function AdminDiplomasPage() {
  const router = useRouter()
  const { user, puede } = useAuth()
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [miembroId, setMiembroId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [pastor, setPastor] = useState('Pastor ')
  const [secretario, setSecretario] = useState('Secretario(a) General')
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState(false)

  useLogoPreload()

  useEffect(() => {
    const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
    if (!ok) router.replace('/admin/dashboard')
    else loadMiembros()
  }, [])

  async function loadMiembros() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'miembros'))
      const list: Miembro[] = []
      snap.forEach(d => { const m = { id: d.id, ...d.data() } as Miembro; if (m.activo !== false) list.push(m) })
      setMiembros(list.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)))
    } catch {}
    setLoading(false)
  }

  const bautizados = useMemo(() => miembros.filter(m => m.estado === 'bautizado'), [miembros])
  const miembro = useMemo(() => miembros.find(m => m.id === miembroId) || null, [miembros, miembroId])

  function fechaFormateada(f: string): string {
    if (!f) return ''
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const [y, m, d] = f.split('-')
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`
  }

  async function handleGenerate() {
    if (!miembro) return
    setGenerando(true)

    const logoB64 = getLogoCached()
    const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    const fechaLarga = fechaFormateada(fecha)

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
  @page { size: landscape letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 279mm; height: 216mm; font-family: 'Cormorant Garamond', serif; background: #fff; position: relative; overflow: hidden; }

  .border-outer { position: absolute; inset: 10mm; border: 2.5px solid #b8860b; border-radius: 4px; }
  .border-inner { position: absolute; inset: 14mm; border: 0.8px solid #b8860b; border-radius: 3px; }

  .corner { position: absolute; width: 8mm; height: 8mm; border: 2px solid #b8860b; border-radius: 50%; }
  .corner::after { content: ''; position: absolute; inset: 2mm; border-radius: 50%; background: #b8860b; }
  .corner.tl { top: 7mm; left: 7mm; }
  .corner.tr { top: 7mm; right: 7mm; }
  .corner.bl { bottom: 7mm; left: 7mm; }
  .corner.br { bottom: 7mm; right: 7mm; }

  .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.07; z-index: 0; }
  .watermark img { width: 120mm; height: 120mm; object-fit: contain; }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 22mm 30mm 18mm; text-align: center; }

  .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 28pt; color: #b8860b; letter-spacing: 6px; text-transform: uppercase; }
  .subtitle { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 14pt; color: #333; letter-spacing: 3px; text-transform: uppercase; margin-top: 2mm; }

  .gold-line { width: 80mm; height: 0.5px; background: #b8860b; margin: 4mm auto; position: relative; }
  .gold-line::after { content: '✦'; position: absolute; top: -5mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 8pt; }

  .church-name { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-style: italic; font-size: 13pt; color: #b8860b; margin-top: 2mm; }

  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 11pt; color: #666; margin-top: 6mm; line-height: 1.6; }

  .name { font-family: 'UnifrakturMaguntia', cursive; font-size: 38pt; color: #b8860b; margin-top: 4mm; text-shadow: 1px 1px 2px rgba(184,134,11,0.15); line-height: 1.1; }
  .name-underline { width: 100mm; height: 0.5px; background: linear-gradient(90deg, transparent, #b8860b, transparent); margin: 2mm auto 0; }

  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 11pt; color: #666; margin-top: 6mm; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 13pt; color: #333; margin-top: 1mm; }

  .verse { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 9pt; color: #999; margin-top: 8mm; }

  .signatures { display: flex; justify-content: center; gap: 60mm; margin-top: auto; padding-bottom: 4mm; }
  .sig-block { text-align: center; }
  .sig-line { width: 55mm; border-top: 0.5px solid #333; margin-bottom: 2mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #333; }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 8pt; color: #999; }

  .footer-line { width: 80mm; height: 0.5px; background: #b8860b; margin: 0 auto 2mm; position: relative; }
  .footer-line::after { content: '✦'; position: absolute; top: -4mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 7pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 7.5pt; color: #aaa; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  ${logoB64 ? `<div class="watermark"><img src="${logoB64}"></div>` : ''}

  <div class="content">
    <div class="title">Certificado</div>
    <div class="subtitle">de Bautismo Cristiano</div>
    <div class="gold-line"></div>
    <div class="church-name">Iglesia Espíritu Santo y Fuego</div>

    <div class="cert-text">
      Certificamos que la siguiente persona<br>
      ha sido bautizada conforme al mandamiento del Señor:
    </div>

    <div class="name">${nombreCompleto}</div>
    <div class="name-underline"></div>

    <div class="date-text">Fue bautizado/a el día</div>
    <div class="date-value">${fechaLarga}</div>

    <div class="verse">"Porque todos ustedes, que fueron bautizados en Cristo, se han vestido de Cristo." — Gálatas 3:27</div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${pastor || 'Pastor'}</div>
        <div class="sig-role">Pastor(a) Principal</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${secretario || 'Secretario(a)'}</div>
        <div class="sig-role">Secretario(a) General</div>
      </div>
    </div>

    <div class="footer-line"></div>
    <div class="footer-text">Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad</div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 800)
    }
    setGenerando(false)
  }

  const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
  if (!ok) return null

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => router.back()}><ArrowLeft className="h-5 w-5 text-gray-500 hover:text-primary" /></button>
        <div>
          <h1 className="text-2xl font-bold text-dark">Diploma de Bautismo</h1>
          <p className="text-sm text-gray-500">Genera un certificado elegante para miembros bautizados</p>
        </div>
      </div>

      <div className="mx-auto max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-md border border-gray-100">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando miembros bautizados...</p>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Miembro bautizado</label>
              <select
                value={miembroId}
                onChange={e => setMiembroId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              >
                <option value="">Seleccionar miembro bautizado</option>
                {bautizados.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                ))}
              </select>
              {!bautizados.length && <p className="mt-1 text-xs text-amber-600">No hay miembros con estado &quot;Bautizado&quot;. Actualiza el estado en Miembros primero.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha del bautismo</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre del Pastor</label>
              <input
                type="text"
                value={pastor}
                onChange={e => setPastor(e.target.value)}
                placeholder="Ej: Pastor Juan Pérez"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre del Secretario(a)</label>
              <input
                type="text"
                value={secretario}
                onChange={e => setSecretario(e.target.value)}
                placeholder="Ej: Secretaria María López"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!miembro || generando}
              onClick={handleGenerate}
            >
              <Printer className="mr-2 h-4 w-4" />
              {generando ? 'Generando...' : 'Imprimir Certificado'}
            </Button>

            {miembro && (
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
                <p className="text-xs text-gray-500">Vista previa del certificado para:</p>
                <p className="text-lg font-bold text-dark">{miembro.nombre} {miembro.apellido}</p>
                <p className="text-xs text-gray-400">{fechaFormateada(fecha)}</p>
                <p className="text-xs text-gray-400 mt-1">Bautizado: {miembro.estado === 'bautizado' ? 'Sí' : 'No'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

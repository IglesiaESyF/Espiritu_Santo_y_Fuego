'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Download, Shield, Cross, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import type { Miembro } from '@/types'

function getLogoUrl(): string {
  if (typeof window === 'undefined') return '/logo.png'
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) || ''
  return window.location.origin + base + '/logo.png'
}

function buildDiplomaHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
  @page { size: landscape letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 279mm; height: 216mm; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .page { position: relative; width: 279mm; height: 216mm; overflow: hidden; }
  .border-outer { position: absolute; inset: 10mm; border: 2.5px solid #b8860b; border-radius: 4px; }
  .border-inner { position: absolute; inset: 14mm; border: 0.8px solid #b8860b; border-radius: 3px; }
  .corner { position: absolute; width: 8mm; height: 8mm; border: 2px solid #b8860b; border-radius: 50%; }
  .corner::after { content: ''; position: absolute; inset: 2mm; border-radius: 50%; background: #b8860b; }
  .corner.tl { top: 7mm; left: 7mm; }
  .corner.tr { top: 7mm; right: 7mm; }
  .corner.bl { bottom: 7mm; left: 7mm; }
  .corner.br { bottom: 7mm; right: 7mm; }
  .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
  .watermark img { width: 160mm; height: 160mm; object-fit: contain; opacity: 0.10; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; height: 100%; padding: 18mm 28mm 14mm; text-align: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 26pt; color: #b8860b; letter-spacing: 5px; text-transform: uppercase; }
  .gold-line { width: 80mm; height: 1px; background: #b8860b; margin: 2mm auto; position: relative; }
  .gold-line::after { content: '\u2726'; position: absolute; top: -5mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 8pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 16pt; color: #b8860b; margin-top: 1mm; font-weight: 700; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 9pt; color: #b8860b; letter-spacing: 2px; text-transform: uppercase; margin-top: 1mm; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 11pt; color: #444; margin-top: 5mm; line-height: 1.7; }
  .name { font-family: 'UnifrakturMaguntia', cursive; font-size: 36pt; color: #b8860b; margin-top: 2mm; line-height: 1.1; }
  .name-underline { width: 100mm; height: 1px; background: #b8860b; margin: 2mm auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 11pt; color: #444; margin-top: 4mm; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 13pt; color: #222; margin-top: 1mm; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 11pt; color: #555; margin-top: 5mm; max-width: 200mm; }
  .bottom-section { margin-top: auto; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 50mm; padding-bottom: 4mm; }
  .sig-block { text-align: center; }
  .sig-line { width: 50mm; border-top: 1px solid #333; margin-bottom: 2mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #222; }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 8pt; color: #666; }
  .footer-line { width: 80mm; height: 1px; background: #b8860b; margin: 0 auto 2mm; position: relative; }
  .footer-line::after { content: '\u2726'; position: absolute; top: -4mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 7pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 8pt; color: #888; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="watermark"><img src="${logoUrl}"></div>
    <div class="content">
      <div class="title">Certificado</div>
      <div class="title" style="font-size:13pt; letter-spacing:3px; margin-top:1mm;">de Bautismo</div>
      <div class="gold-line"></div>
      <div class="church-name">Iglesia Espíritu Santo y Fuego</div>
      <div class="church-sub">Misión Cristiana Perfectos en Unidad</div>
      <div class="cert-text">Certificamos que el(la) hermano(a):</div>
      <div class="name">${nombreCompleto}</div>
      <div class="name-underline"></div>
      <div class="cert-text" style="margin-top:3mm;">
        ha sido bautizado(a) conforme al mandamiento del Se\u00f1or:<br>
        <strong style="font-size:10pt; color:#555;">"Por tanto, id y haced disc\u00edpulos a todas las naciones,<br>
        bautiz\u00e1ndolos en el nombre del Padre, y del Hijo, y del Esp\u00edritu Santo."<br>
        \u2014 Mateo 28:19</strong>
      </div>
      <div class="date-text">Fue bautizado(a) el d\u00eda</div>
      <div class="date-value">${fechaLarga}</div>
      <div class="verse">"Porque todos ustedes, que fueron bautizados en Cristo, se han vestido de Cristo." \u2014 <strong>G\u00e1latas 3:27</strong></div>
      <div class="bottom-section">
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
        <div class="footer-text">Iglesia Esp\u00edritu Santo y Fuego \u2014 Misi\u00f3n Cristiana Perfectos en Unidad</div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function openDiplomaWindow(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, onLoad?: (win: Window) => void): Window | null {
  const html = buildDiplomaHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
  const win = window.open('', '_blank')
  if (!win) return null
  win.document.write(html)
  win.document.close()
  win.focus()
  if (onLoad) {
    setTimeout(() => onLoad(win), 2500)
  }
  return win
}

export default function AdminDiplomasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [miembroId, setMiembroId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [pastor, setPastor] = useState('Pastor ')
  const [secretario, setSecretario] = useState('Secretario(a) General')
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState<'print' | 'pdf' | null>(null)

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

  function handlePrint() {
    if (!miembro) return
    setGenerando('print')
    const logoUrl = getLogoUrl()
    const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    const fechaLarga = fechaFormateada(fecha)
    const win = openDiplomaWindow(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
    if (win) setTimeout(() => { win.print(); setGenerando(null) }, 2500)
    else setGenerando(null)
  }

  function handleDownloadPDF() {
    if (!miembro) return
    setGenerando('pdf')
    const logoUrl = getLogoUrl()
    const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    const fechaLarga = fechaFormateada(fecha)
    const win = openDiplomaWindow(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
    if (win) {
      setTimeout(() => {
        win.print()
        setGenerando(null)
      }, 2500)
    } else setGenerando(null)
  }

  const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
  if (!ok) return null

  return (
    <div className="min-h-screen bg-[#f8f6f0]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-primary/30 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Diploma de Bautismo</h1>
              <p className="mt-1 text-sm text-gray-500">Genera un certificado personalizado para miembros bautizados</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e0d0] bg-white p-8 shadow-lg shadow-amber-900/5">
          <div className="mb-6 flex items-center gap-3 border-b border-[#f0e8d8] pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100">
              <ScrollText className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Informaci\u00f3n del Certificado</h2>
              <p className="text-xs text-gray-400">Complete los datos para generar el diploma</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Miembro bautizado</label>
                <select
                  value={miembroId}
                  onChange={e => setMiembroId(e.target.value)}
                  className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                >
                  <option value="">Seleccionar miembro bautizado</option>
                  {bautizados.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                </select>
                {!bautizados.length && <p className="mt-1.5 text-xs text-amber-600">No hay miembros con estado &quot;Bautizado&quot;. Actualice el estado en Miembros primero.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Fecha del bautismo</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Pastor</label>
                  <input
                    type="text"
                    value={pastor}
                    onChange={e => setPastor(e.target.value)}
                    placeholder="Nombre del pastor"
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Secretario(a)</label>
                  <input
                    type="text"
                    value={secretario}
                    onChange={e => setSecretario(e.target.value)}
                    placeholder="Nombre del secretario"
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-amber-700 to-yellow-700 text-white shadow-lg shadow-amber-900/20 hover:from-amber-800 hover:to-yellow-800"
                  disabled={!miembro || !!generando}
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {generando === 'print' ? 'Generando...' : 'Imprimir'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 border-2 border-amber-700/30 bg-white text-amber-800 shadow-md hover:bg-amber-50"
                  disabled={!miembro || !!generando}
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {generando === 'pdf' ? 'Generando...' : 'Descargar PDF'}
                </Button>
              </div>

              {miembro && (
                <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-50/60 to-white p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vista previa</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">{miembro.nombre} {miembro.apellido}</p>
                  <p className="text-xs text-gray-500">{fechaFormateada(fecha)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Al hacer clic en &quot;Imprimir&quot; se abrir&aacute; una vista previa. Use &quot;Guardar como PDF&quot; en el di&aacute;logo de impresi&oacute;n.</p>
        </div>
      </div>
    </div>
  )
}
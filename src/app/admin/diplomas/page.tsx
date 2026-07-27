'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import type { Miembro } from '@/types'

const W = 1056
const H = 816

function getLogoUrl(): string {
  if (typeof window === 'undefined') return '/logo.png'
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) || ''
  return window.location.origin + base + '/logo.png'
}

const diplomaStyles = `
  @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html { width: ${W}px; height: ${H}px; overflow: hidden; }
  .diploma { position: relative; width: ${W}px; height: ${H}px; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .border-outer { position: absolute; inset: 38px; border: 2.5px solid #b8860b; border-radius: 4px; }
  .border-inner { position: absolute; inset: 53px; border: 0.8px solid #b8860b; border-radius: 3px; }
  .corner { position: absolute; width: 30px; height: 30px; border: 2px solid #b8860b; border-radius: 50%; }
  .corner::after { content: ''; position: absolute; inset: 7px; border-radius: 50%; background: #b8860b; }
  .corner.tl { top: 26px; left: 26px; }
  .corner.tr { top: 26px; right: 26px; }
  .corner.bl { bottom: 26px; left: 26px; }
  .corner.br { bottom: 26px; right: 26px; }
  .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
  .watermark img { width: 600px; height: 600px; object-fit: contain; opacity: 0.10; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; height: 100%; padding: 68px 106px 53px; text-align: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 35pt; color: #b8860b; letter-spacing: 5px; text-transform: uppercase; }
  .title-sm { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 17pt; color: #b8860b; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
  .gold-line { width: 300px; height: 1px; background: #b8860b; margin: 8px auto; position: relative; }
  .gold-line::after { content: '✦'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 10pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 21pt; color: #b8860b; margin-top: 4px; font-weight: 700; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #b8860b; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #444; margin-top: 20px; line-height: 1.7; }
  .name { font-family: 'UnifrakturMaguntia', cursive; font-size: 48pt; color: #b8860b; margin-top: 12px; line-height: 1.1; }
  .name-underline { width: 380px; height: 1px; background: #b8860b; margin: 8px auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #444; margin-top: 20px; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 17pt; color: #222; margin-top: 4px; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #555; margin-top: 24px; max-width: 750px; }
  .bottom-section { margin-top: auto; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 190px; padding-bottom: 15px; }
  .sig-block { text-align: center; }
  .sig-line { width: 190px; border-top: 1px solid #333; margin-bottom: 8px; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 13pt; color: #222; }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #666; }
  .footer-line { width: 300px; height: 1px; background: #b8860b; margin: 0 auto 8px; position: relative; }
  .footer-line::after { content: '✦'; position: absolute; top: -8px; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 9pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #888; }
`

function buildDiplomaInner(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
  return `
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="watermark"><img src="${logoUrl}"></div>
    <div class="content">
      <div class="title">Certificado</div>
      <div class="title-sm">de Bautismo</div>
      <div class="gold-line"></div>
      <div class="church-name">Iglesia Espíritu Santo y Fuego</div>
      <div class="church-sub">Misión Cristiana Perfectos en Unidad</div>
      <div class="cert-text">Certificamos que el(la) hermano(a):</div>
      <div class="name">${nombreCompleto}</div>
      <div class="name-underline"></div>
      <div class="cert-text" style="margin-top:12px;">
        ha sido bautizado(a) conforme al mandamiento del Señor:<br>
        <strong style="font-size:13pt; color:#555;">"Por tanto, id y haced discípulos a todas las naciones,<br>
        bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo."<br>
        — Mateo 28:19</strong>
      </div>
      <div class="date-text">Fue bautizado(a) el día</div>
      <div class="date-value">${fechaLarga}</div>
      <div class="verse">"Porque todos ustedes, que fueron bautizados en Cristo, se han vestido de Cristo." — <strong>Gálatas 3:27</strong></div>
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
        <div class="footer-text">Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad</div>
      </div>
    </div>
  `
}

function buildPrintHtml(inner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
  @page { size: landscape letter; margin: 0; }
  ${diplomaStyles}
  .diploma { width: 279mm; height: 216mm; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
</style>
</head>
<body>
  <div class="diploma">${inner}</div>
</body>
</html>`
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
  const [generando, setGenerando] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

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

  const renderDiploma = useCallback(() => {
    if (!miembro || !renderRef.current) return
    const logoUrl = getLogoUrl()
    const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    const fechaLarga = fechaFormateada(fecha)
    renderRef.current.innerHTML = buildDiplomaInner(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
  }, [miembro, fecha, pastor, secretario])

  useEffect(() => { renderDiploma() }, [renderDiploma])

  async function handlePrint() {
    if (!miembro) return
    setGenerando(true)
    const logoUrl = getLogoUrl()
    const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    const fechaLarga = fechaFormateada(fecha)
    const inner = buildDiplomaInner(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
    const html = buildPrintHtml(inner)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 2000)
    }
    setGenerando(false)
  }

  async function handleDownloadPDF() {
    if (!miembro || !renderRef.current) return
    setGenerando(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      renderDiploma()

      await new Promise(r => setTimeout(r, 1500))

      const img = renderRef.current.querySelector('img')
      if (img && !img.complete) {
        await new Promise<void>(r => {
          img.onload = () => r()
          img.onerror = () => r()
          setTimeout(r, 3000)
        })
      }

      const canvas = await html2canvas(renderRef.current, {
        width: W,
        height: H,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
      pdf.save(`diploma-${miembro.nombre}-${miembro.apellido}.pdf`)
    } catch (e) {
      console.error('Error generando PDF:', e)
      alert('Error al generar el PDF. Intente imprimir y guardar como PDF desde el navegador.')
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

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!miembro || generando}
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={!miembro || generando}
                onClick={handleDownloadPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                {generando ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>

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

      <div
        ref={renderRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: `${W}px`,
          height: `${H}px`,
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: diplomaStyles }} />
    </div>
  )
}
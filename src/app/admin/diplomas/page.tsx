'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText } from 'lucide-react'
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
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
      const pw = doc.internal.pageSize.width
      const ph = doc.internal.pageSize.height

      // ── outer gold border ──
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(2.5)
      doc.roundedRect(12, 12, pw - 24, ph - 24, 3, 3)
      doc.setLineWidth(0.8)
      doc.roundedRect(16, 16, pw - 32, ph - 32, 2, 2)

      // ── corner ornaments ──
      const corners = [[18, 18], [pw - 18, 18], [18, ph - 18], [pw - 18, ph - 18]]
      doc.setFillColor(184, 134, 11)
      for (const [cx, cy] of corners) {
        doc.circle(cx, cy, 2.5, 'F')
        doc.setFillColor(255, 255, 255)
        doc.circle(cx, cy, 1.2, 'F')
        doc.setFillColor(184, 134, 11)
      }

      // ── watermark logo ──
      const logoB64 = getLogoCached()
      if (logoB64) {
        try {
          const img = new window.Image()
          const opaqueLogo = await new Promise<string>((resolve, reject) => {
            img.onload = () => {
              const c = document.createElement('canvas')
              c.width = 180; c.height = 180
              const cx = c.getContext('2d')!
              cx.globalAlpha = 0.1
              cx.drawImage(img, 0, 0, 180, 180)
              resolve(c.toDataURL('image/png'))
            }
            img.onerror = reject
            img.src = logoB64
          })
          doc.addImage(opaqueLogo, 'PNG', (pw - 80) / 2, (ph - 80) / 2 - 15, 80, 80)
        } catch {}
      }

      // ── decorative top line ──
      const lm = 30
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.4)
      doc.line(lm, 38, pw - lm, 38)
      // center ornament
      doc.setFillColor(184, 134, 11)
      doc.circle(pw / 2, 38, 1.5, 'F')

      // ── title ──
      doc.setFont('times', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(184, 134, 11)
      doc.text('CERTIFICADO', pw / 2, 48, { align: 'center' })
      doc.setFontSize(14)
      doc.setTextColor(51, 51, 51)
      doc.text('DE BAUTISMO CRISTIANO', pw / 2, 55, { align: 'center' })

      // ── decorative line under title ──
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(pw / 2 - 50, 60, pw / 2 + 50, 60)

      // ── church name ──
      doc.setFont('times', 'bolditalic')
      doc.setFontSize(13)
      doc.setTextColor(184, 134, 11)
      doc.text('Iglesia Espíritu Santo y Fuego', pw / 2, 68, { align: 'center' })

      // ── "Certificamos que" ──
      doc.setFont('times', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text('Certificamos que el/las siguiente persona', pw / 2, 78, { align: 'center' })
      doc.text('ha sido bautizada conforme al mandamiento del Señor:', pw / 2, 84, { align: 'center' })

      // ── member name (large elegant) ──
      doc.setFont('times', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(184, 134, 11)
      const nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
      doc.text(nombreCompleto, pw / 2, 98, { align: 'center' })

      // ── underline under name ──
      const nameW = doc.getTextWidth(nombreCompleto)
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(pw / 2 - nameW / 2 - 10, 100, pw / 2 + nameW / 2 + 10, 100)

      // ── date of baptism ──
      doc.setFont('times', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text('Fue bautizado/a el día', pw / 2, 110, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(51, 51, 51)
      doc.text(fechaFormateada(fecha), pw / 2, 118, { align: 'center' })

      // ── decorative divider ──
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(pw / 2 - 40, 126, pw / 2 + 40, 126)
      doc.setFillColor(184, 134, 11)
      doc.circle(pw / 2, 126, 1.2, 'F')

      // ── verse ──
      doc.setFont('times', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(140, 140, 140)
      doc.text('"' + 'Porque todos ustedes, que fueron bautizados en Cristo, se han vestido de Cristo.' + '"', pw / 2, 133, { align: 'center' })
      doc.text('— Gálatas 3:27', pw / 2, 137, { align: 'center' })

      // ── signatures ──
      const sigY = ph - 55
      // pastor
      doc.setDrawColor(51, 51, 51)
      doc.setLineWidth(0.4)
      doc.line(40, sigY, pw / 2 - 20, sigY)
      doc.setFont('times', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(51, 51, 51)
      doc.text(pastor || 'Pastor', pw / 4 + 10, sigY + 5, { align: 'center' })
      doc.setFont('times', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Pastor(a) Principal', pw / 4 + 10, sigY + 9, { align: 'center' })

      // secretary
      doc.setDrawColor(51, 51, 51)
      doc.setLineWidth(0.4)
      doc.line(pw / 2 + 20, sigY, pw - 40, sigY)
      doc.setFont('times', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(51, 51, 51)
      doc.text(secretario || 'Secretario(a)', pw * 3 / 4 - 10, sigY + 5, { align: 'center' })
      doc.setFont('times', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Secretario(a) General', pw * 3 / 4 - 10, sigY + 9, { align: 'center' })

      // ── footer line ──
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(lm, ph - 28, pw - lm, ph - 28)
      doc.setFillColor(184, 134, 11)
      doc.circle(pw / 2, ph - 28, 1.2, 'F')

      // ── footer text ──
      doc.setFont('times', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(140, 140, 140)
      doc.text('Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad', pw / 2, ph - 24, { align: 'center' })

      doc.save(`Bautismo_${nombreCompleto.replace(/\s+/g, '_')}.pdf`)
    } catch (e) {
      console.error('Error generando PDF:', e)
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
              {!bautizados.length && <p className="mt-1 text-xs text-amber-600">No hay miembros con estado "Bautizado". Actualiza el estado en Miembros primero.</p>}
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
              <Download className="mr-2 h-4 w-4" />
              {generando ? 'Generando...' : 'Generar Certificado PDF'}
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

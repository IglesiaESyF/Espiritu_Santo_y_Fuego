'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, ScrollText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, getDocs, setDoc, doc } from 'firebase/firestore'
import type { Miembro } from '@/types'
import { CARGOS_MIEMBRO } from '@/types'

function getLogoUrl(): string {
  if (typeof window === 'undefined') return '/logo.png'
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) || ''
  return window.location.origin + base + '/logo.png'
}

function getDiplomaCSS(): string {
  return `* { margin: 0; padding: 0; box-sizing: border-box; }
  .page { position: relative; width: 1056px; height: 816px; overflow: hidden; font-family: 'Cormorant Garamond', serif; background: #fff; }
  .border-outer { position: absolute; inset: 38px; border: 2.5px solid #b8860b; border-radius: 4px; }
  .border-inner { position: absolute; inset: 53px; border: 0.8px solid #b8860b; border-radius: 3px; }
  .corner { position: absolute; width: 30px; height: 30px; border: 2px solid #b8860b; border-radius: 50%; }
  .corner::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: #b8860b; }
  .corner.tl { top: 26px; left: 26px; }
  .corner.tr { top: 26px; right: 26px; }
  .corner.bl { bottom: 26px; left: 26px; }
  .corner.br { bottom: 26px; right: 26px; }
  .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
  .watermark img { width: 600px; height: 600px; object-fit: contain; opacity: 0.15; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; height: 100%; padding: 102px 90px 140px; text-align: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 28pt; color: #b8860b; letter-spacing: 5px; text-transform: uppercase; }
  .gold-line { width: 300px; height: 1px; background: #b8860b; margin: 5px auto; position: relative; }
  .gold-line::after { content: '\u2726'; position: absolute; top: -13px; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 7pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 20pt; color: #b8860b; margin-top: 3px; font-weight: 700; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 12pt; color: #b8860b; letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #444; margin-top: 6px; line-height: 1.4; }
  .name { font-family: 'UnifrakturMaguntia', cursive; font-size: 40pt; color: #b8860b; margin-top: 4px; line-height: 1.1; }
  .name-underline { width: 378px; height: 1px; background: #b8860b; margin: 5px auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 15pt; color: #444; margin-top: 6px; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 16pt; color: #222; margin-top: 2px; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #555; margin-top: -8px; max-width: 750px; }
  .bottom-section { margin-top: 55px; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 150px; padding-bottom: 8px; }
  .sig-line { width: 150px; border-top: 1px solid #333; margin-bottom: 4px; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #222; }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 12pt; color: #666; }
  .footer-line { width: 300px; height: 1px; background: #b8860b; margin: 11px auto 4px; position: relative; }
  .footer-line::after { content: '\u2726'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 6pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #888; }`
}

function getDiplomaBodyHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
  return `<div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="watermark"><img src="${logoUrl}"></div>
    <div class="content">
      <div class="title">Certificado</div>
      <div class="title" style="font-size:16pt; letter-spacing:3px; margin-top:3px;">de Bautismo</div>
      <div class="gold-line"></div>
      <div class="church-name">Iglesia Espíritu Santo y Fuego</div>
      <div class="church-sub">Misión Cristiana Perfectos en Unidad</div>
      <div class="cert-text">Certificamos que el(la) hermano(a):</div>
      <div class="name">${nombreCompleto}</div>
      <div class="name-underline"></div>
      <div class="cert-text" style="margin-top:8px;">
        ha sido bautizado(a) conforme al mandamiento del Se\u00f1or:<br>
        <strong style="font-size:12pt; color:#555;">"Por tanto, id y haced disc\u00edpulos a todas las naciones,<br>
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
  </div>`
}

function getMmCSS(): string {
  return `@page { size: landscape letter; margin: 0; }
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
  .watermark img { width: 160mm; height: 160mm; object-fit: contain; opacity: 0.15; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; height: 100%; padding: 27mm 24mm 37mm; text-align: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 28pt; color: #b8860b; letter-spacing: 5px; text-transform: uppercase; }
  .gold-line { width: 80mm; height: 1px; background: #b8860b; margin: 1.5mm auto; position: relative; }
  .gold-line::after { content: '\u2726'; position: absolute; top: -3.5mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 7pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 20pt; color: #b8860b; margin-top: 0.8mm; font-weight: 700; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 12pt; color: #b8860b; letter-spacing: 2px; text-transform: uppercase; margin-top: 0.8mm; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #444; margin-top: 1.5mm; line-height: 1.4; }
  .name { font-family: 'UnifrakturMaguntia', cursive; font-size: 40pt; color: #b8860b; margin-top: 1mm; line-height: 1.1; }
  .name-underline { width: 100mm; height: 1px; background: #b8860b; margin: 1.5mm auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 15pt; color: #444; margin-top: 1.5mm; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 16pt; color: #222; margin-top: 0.5mm; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #555; margin-top: -2mm; max-width: 200mm; }
  .bottom-section { margin-top: 14mm; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 50mm; padding-bottom: 2mm; }
  .sig-line { width: 50mm; border-top: 1px solid #333; margin-bottom: 1.5mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 14pt; color: #222; }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 12pt; color: #666; }
  .footer-line { width: 80mm; height: 1px; background: #b8860b; margin: 3mm auto 1.5mm; position: relative; }
  .footer-line::after { content: '\u2726'; position: absolute; top: -3mm; left: 50%; transform: translateX(-50%); color: #b8860b; font-size: 6pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 10pt; color: #888; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}

function buildDiplomaHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, capturePng?: boolean, miembro?: Miembro): string {
  const captureScript = capturePng ? `
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script>
window.addEventListener('load', function() {
  setTimeout(async function() {
    try {
      await document.fonts.ready;
      var target = document.querySelector('.page.diploma') || document.body;
      var canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 1056,
        height: 816,
      });
      window.opener.postMessage({ type: 'diploma-png', data: canvas.toDataURL('image/png') }, '*');
    } catch(e) {
      window.opener.postMessage({ type: 'diploma-png-error', error: String(e) }, '*');
    }
  }, 2500);
});
</script>` : ''

  const pages = [
    `<div class="page diploma">${getDiplomaBodyHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)}</div>`,
  ]

  if (miembro) {
    pages.push(getCertificacionPageHtml(miembro, logoUrl, pastor, secretario, fechaLarga))
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>${getMmCSS()}${miembro ? getCertificacionCss() : ''}</style>
${captureScript}
</head>
<body>${pages.join('\n')}</body>
</html>`
}

function getCertificacionCss(): string {
  return `
  .page.certificacion { position: relative; width: 279mm; height: 216mm; overflow: hidden; font-family: 'Cormorant Garamond', serif; background: #fff; page-break-before: always; }
  .cert-border-outer { position: absolute; inset: 10mm; border: 2px solid #b8860b; border-radius: 4px; }
  .cert-border-inner { position: absolute; inset: 14mm; border: 0.8px solid #b8860b; border-radius: 3px; }
  .cert-watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
  .cert-watermark img { width: 140mm; height: 140mm; object-fit: contain; opacity: 0.08; }
  .cert-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 20mm 24mm 18mm; }
  .cert-header { text-align: center; margin-bottom: 8mm; }
  .cert-header .church { font-family: 'UnifrakturMaguntia', cursive; font-size: 18pt; color: #b8860b; font-weight: 700; }
  .cert-header .sub { font-family: 'Cormorant Garamond', serif; font-size: 10pt; color: #b8860b; letter-spacing: 2px; text-transform: uppercase; margin-top: 1mm; }
  .cert-header .gold-line { width: 60mm; height: 1px; background: #b8860b; margin: 3mm auto; }
  .cert-header .title { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 16pt; color: #b8860b; letter-spacing: 3px; text-transform: uppercase; }
  .cert-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2.5mm; padding: 0 10mm; }
  .cert-row { display: flex; }
  .cert-label { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 11pt; color: #b8860b; min-width: 70mm; }
  .cert-value { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 11pt; color: #333; border-bottom: 1px dashed #ccc; flex: 1; padding-left: 2mm; }
  .cert-footer { text-align: center; margin-top: auto; padding-top: 5mm; }
  .cert-footer-text { font-family: 'Cormorant Garamond', serif; font-size: 9pt; color: #888; font-weight: 700; }
  @media print {
    .page.certificacion { page-break-before: always; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}

function getCertificacionPageHtml(miembro: Miembro, logoUrl: string, pastor: string, secretario: string, fechaBautismo: string): string {
  function fmt(d: string): string {
    if (!d) return ''
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const [y, m, day] = d.split('-')
    return `${parseInt(day)} de ${meses[parseInt(m) - 1]} de ${y}`
  }
  function calcTiempo(fecha: string): string {
    if (!fecha) return ''
    const inicio = new Date(fecha)
    const hoy = new Date()
    let años = hoy.getFullYear() - inicio.getFullYear()
    let meses = hoy.getMonth() - inicio.getMonth()
    if (meses < 0) { años--; meses += 12 }
    const partes: string[] = []
    if (años > 0) partes.push(`${años} año${años !== 1 ? 's' : ''}`)
    if (meses > 0) partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`)
    return partes.join(' y ') || 'Menos de 1 mes'
  }

  const direccion = [miembro.direccion, miembro.barrio, miembro.ciudad, miembro.departamento].filter(Boolean).join(', ') || 'No registrada'
  const nacionalidad = miembro.pais || 'No registrada'
  const fechaNac = fmt(miembro.fecha_nacimiento) || 'No registrada'
  const fechaLleg = fmt(miembro.fecha_llegada_iglesia) || 'No registrada'
  const tiempoIglesia = calcTiempo(miembro.fecha_llegada_iglesia)
  const llegoBautizado = miembro.llego_bautizado ? 'Sí' : 'No'
  const motivo = miembro.motivo_llegada || 'No registrado'

  return `<div class="page certificacion">
    <div class="cert-border-outer"></div>
    <div class="cert-border-inner"></div>
    <div class="cert-watermark"><img src="${logoUrl}"></div>
    <div class="cert-content">
      <div class="cert-header">
        <div class="church">Iglesia Espíritu Santo y Fuego</div>
        <div class="sub">Misión Cristiana Perfectos en Unidad</div>
        <div class="gold-line"></div>
        <div class="title">Certificación de Datos del Bautizado</div>
      </div>
      <div class="cert-body">
        <div class="cert-row"><span class="cert-label">Nombre completo:</span><span class="cert-value">${miembro.nombre} ${miembro.apellido}</span></div>
        <div class="cert-row"><span class="cert-label">Fecha de nacimiento:</span><span class="cert-value">${fechaNac}</span></div>
        <div class="cert-row"><span class="cert-label">Nacionalidad:</span><span class="cert-value">${nacionalidad}</span></div>
        <div class="cert-row"><span class="cert-label">Dirección:</span><span class="cert-value">${direccion}</span></div>
        <div class="cert-row"><span class="cert-label">Fecha de bautismo:</span><span class="cert-value">${fechaBautismo || 'No registrada'}</span></div>
        <div class="cert-row"><span class="cert-label">Fecha de 1ra. llegada a la iglesia:</span><span class="cert-value">${fechaLleg}</span></div>
        <div class="cert-row"><span class="cert-label">Tiempo en la iglesia:</span><span class="cert-value">${tiempoIglesia}</span></div>
        <div class="cert-row"><span class="cert-label">¿Llegó bautizado de otra iglesia?:</span><span class="cert-value">${llegoBautizado}</span></div>
        <div class="cert-row"><span class="cert-label">Motivo de llegada:</span><span class="cert-value">${motivo}</span></div>
      </div>
      <div class="cert-footer">
        <div class="cert-footer-text">Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad</div>
      </div>
    </div>
  </div>`
}

function openDiplomaWindow(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, capturePng?: boolean, miembro?: Miembro): Window | null {
  const html = buildDiplomaHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario, capturePng, miembro)
  const win = window.open('', '_blank')
  if (!win) return null
  win.document.write(html)
  win.document.close()
  win.focus()
  return win
}

const CATEGORIA_LABEL: Record<string, string> = {
  nino: 'Niño', preadolescente: 'Preadolescente', adolescente: 'Adolescente',
  joven_adulto: 'Joven Adulto', adulto_mayor: 'Adulto Mayor',
}

export default function AdminDiplomasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [miembroId, setMiembroId] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [pastor, setPastor] = useState('')
  const [secretario, setSecretario] = useState('')
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [tipoMiembro, setTipoMiembro] = useState<'existente' | 'nuevo'>('existente')
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [guardarMiembro, setGuardarMiembro] = useState(true)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
    if (!ok) router.replace('/admin/dashboard')
    else loadMiembros()
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    const p = miembros.find(m => m.cargo === 'Pastor(a) Principal')
    if (p) setPastor(`${p.nombre} ${p.apellido}`)
    const s = miembros.find(m => m.cargo === 'Secretario(a) General')
    if (s) setSecretario(`${s.nombre} ${s.apellido}`)
  }, [miembros])

  function onClickOutside(e: MouseEvent) {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }

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

  const filteredMiembros = useMemo(() => {
    if (!searchText.trim()) return bautizados
    const q = searchText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return bautizados.filter(m =>
      `${m.nombre} ${m.apellido}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    ).slice(0, 10)
  }, [bautizados, searchText])

  function seleccionarMiembro(m: Miembro) {
    setMiembroId(m.id)
    setSearchText(`${m.nombre} ${m.apellido}`)
    setShowDropdown(false)
    if (m.fecha_bautismo) setFecha(m.fecha_bautismo)
  }

  function fechaFormateada(f: string): string {
    if (!f) return ''
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const [y, m, d] = f.split('-')
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`
  }

  function buildPxDiplomaHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
    return buildDiplomaHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
      .replace(/@page\s*\{[^}]*\}/g, '')
      .replace(/279mm/g, '1056px')
      .replace(/216mm/g, '816px')
      .replace(/(\d+)mm/g, (m, n) => Math.round(parseFloat(n) * 3.78) + 'px')
      .replace(/(\d+)pt/g, (m, n) => n + 'pt')
  }

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type === 'diploma-png') {
        const nombre = miembro
          ? `${miembro.nombre}_${miembro.apellido}`
          : `${nuevoNombre}_${nuevoApellido}`.trim().replace(/\s+/g, '_')
        const link = document.createElement('a')
        link.download = `${nombre}_diploma.png`.replace(/\s+/g, '_')
        link.href = e.data.data
        link.click()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [miembro, nuevoNombre, nuevoApellido])

  function handlePrint() {
    setGenerando(true)
    const logoUrl = getLogoUrl()
    const pastorNombre = pastor || 'Pastor'
    const secretarioNombre = secretario || 'Secretario(a)'
    const fechaLarga = fechaFormateada(fecha)

    let nombreCompleto: string
    if (tipoMiembro === 'existente') {
      if (!miembro) { setGenerando(false); return }
      nombreCompleto = `${miembro.nombre} ${miembro.apellido}`
    } else {
      if (!nuevoNombre.trim() || !nuevoApellido.trim()) { setGenerando(false); return }
      nombreCompleto = `${nuevoNombre.trim()} ${nuevoApellido.trim()}`
    }

    const win = openDiplomaWindow(nombreCompleto, fechaLarga, logoUrl, pastorNombre, secretarioNombre, true, tipoMiembro === 'existente' ? (miembro ?? undefined) : undefined)
    if (win) {
      setTimeout(() => {
        win.print()
        setGenerando(false)
        if (tipoMiembro === 'nuevo' && guardarMiembro && nuevoNombre.trim() && nuevoApellido.trim()) {
          setDoc(doc(db, 'miembros', crypto.randomUUID()), {
            nombre: nuevoNombre.trim(), apellido: nuevoApellido.trim(),
            fecha_nacimiento: '', edad: 0, pais: 'Nicaragua', departamento: '',
            ciudad: '', barrio: '', direccion: '', celular: '', correo: '',
            estado: 'bautizado', fecha_bautismo: fecha, fecha_llegada_iglesia: '',
            llego_bautizado: false, motivo_llegada: '', categoria: '', cargo: '',
            familiares: [], notas: '', activo: true, creadoEn: Date.now(),
          }).catch(() => {})
        }
      }, 3500)
    } else {
      setGenerando(false)
    }
  }

  const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
  if (!ok) return null

  const puedeImprimir = (tipoMiembro === 'existente' && miembro) ||
    (tipoMiembro === 'nuevo' && nuevoNombre.trim() && nuevoApellido.trim())

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
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Información del Certificado</h2>
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Tipo de certificado</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipoMiembro" checked={tipoMiembro === 'nuevo'} onChange={() => { setTipoMiembro('nuevo'); setMiembroId(''); setSearchText('') }} className="accent-amber-600" />
                    <span className="text-sm text-gray-700">Nuevo bautizado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipoMiembro" checked={tipoMiembro === 'existente'} onChange={() => setTipoMiembro('existente')} className="accent-amber-600" />
                    <span className="text-sm text-gray-700">Reimprimir (miembro activo)</span>
                  </label>
                </div>
              </div>

              {tipoMiembro === 'nuevo' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Nombre</label>
                    <input
                      type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                      placeholder="Nombre del bautizado"
                      className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Apellido</label>
                    <input
                      type="text" value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)}
                      placeholder="Apellido del bautizado"
                      className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={guardarMiembro} onChange={e => setGuardarMiembro(e.target.checked)} className="accent-amber-600" />
                      <span className="text-sm text-gray-600">Guardar como nuevo miembro en la base de datos</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div ref={searchRef}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Miembro bautizado</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={e => { setSearchText(e.target.value); setMiembroId(''); setShowDropdown(true) }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Escriba para buscar miembro bautizado..."
                      className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] pl-9 pr-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                    />
                    {showDropdown && filteredMiembros.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#e0d8c8] bg-white shadow-lg">
                        {filteredMiembros.map(m => (
                          <button
                            key={m.id}
                            onClick={() => seleccionarMiembro(m)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-amber-50/50 transition-colors"
                          >
                            <span className="font-medium text-gray-800">{m.nombre} {m.apellido}</span>
                            <span className="text-xs text-gray-400">{m.categoria ? CATEGORIA_LABEL[m.categoria] : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && searchText.trim() && filteredMiembros.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl border border-[#e0d8c8] bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
                        No se encontraron miembros
                      </div>
                    )}
                  </div>
                  {!bautizados.length && <p className="mt-1.5 text-xs text-amber-600">No hay miembros con estado &quot;Bautizado&quot;. Actualice el estado en Miembros primero.</p>}
                </div>
              )}

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
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Pastor(a) Principal</label>
                  <input
                    type="text"
                    value={pastor}
                    onChange={e => setPastor(e.target.value)}
                    placeholder="Nombre del pastor"
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Secretario(a) General</label>
                  <input
                    type="text"
                    value={secretario}
                    onChange={e => setSecretario(e.target.value)}
                    placeholder="Nombre del secretario"
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-700 to-yellow-700 text-white shadow-lg shadow-amber-900/20 hover:from-amber-800 hover:to-yellow-800"
                  disabled={!puedeImprimir || generando}
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {generando ? 'Generando...' : 'Imprimir Diploma'}
                </Button>
              </div>

              {tipoMiembro === 'existente' && miembro && (
                <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-50/60 to-white p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vista previa</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">{miembro.nombre} {miembro.apellido}</p>
                  <p className="text-xs text-gray-500">{fechaFormateada(fecha)}</p>
                </div>
              )}
              {tipoMiembro === 'nuevo' && nuevoNombre.trim() && (
                <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-50/60 to-white p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vista previa</p>
                  <p className="mt-1 text-lg font-bold text-gray-800">{nuevoNombre} {nuevoApellido}</p>
                  <p className="text-xs text-gray-500">{fechaFormateada(fecha)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cross, Tv, Calendar, Heart, ArrowRight, Flame, X, ThumbsUp, Smile, ThumbsDown, MessageCircle, Download, Printer } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, getDocs, getDoc, addDoc, doc, runTransaction, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import logoSrc from '@/../public/logo.png'

interface Noticia {
  id: string
  titulo: string
  mensaje: string
  imagenUrl: string
  videoUrl: string
  fechaExpiracion: Timestamp
  descargable?: boolean
  imprimible?: boolean
  reacciones?: { me_gusta: number; me_encanta: number; no_me_gusta: number }
}

interface Comentario {
  id?: string
  nombre: string
  texto: string
  timestamp: Timestamp
}

export default function HomePage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [selected, setSelected] = useState<Noticia | null>(null)

  useEffect(() => {
    getDocs(collection(db, 'noticias')).then(snap => {
      const now = Date.now()
      const list: Noticia[] = []
      snap.forEach(d => {
        const n = { id: d.id, ...d.data() } as Noticia
        if (n.fechaExpiracion?.toMillis() > now) list.push(n)
      })
      setNoticias(list)
    }).catch(() => {})
  }, [])

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-dark via-dark-light to-dark py-24 text-center text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
              <span className="logo-wrapper shrink-0">
                <Image src={logoSrc} alt="IESFuego" width={96} height={96} className="logo-spin h-24 w-24 object-contain md:h-28 md:w-28" />
              </span>
              <div className="text-center md:text-left">
                <h1 className="mb-2 text-4xl font-bold leading-tight md:text-5xl">
                  Iglesia Espíritu Santo{' '}
                  <span className="text-primary-light">y Fuego</span>
                </h1>
                <p className="mb-2 text-sm text-gray-400">
                  Misión Cristiana Perfectos en Unidad
                </p>
                <p className="mb-8 text-lg text-gray-300">
                  Transformando vidas con el poder del Espíritu Santo
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cultos" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-dark">
                <Tv className="h-5 w-5" /> Nuestros Cultos
              </Link>
              <Link href="/en-vivo" className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-light px-8 py-3.5 font-semibold text-primary-light transition hover:bg-primary-light/10">
                <Flame className="h-5 w-5" /> En Vivo
              </Link>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <section className="mx-auto max-w-6xl px-4 -mt-10 relative z-10">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Cross, title: 'Cultos', desc: 'Únete a nuestros servicios donde la presencia de Dios transforma vidas.', href: '/cultos' },
              { icon: Calendar, title: 'Actividades', desc: 'Conoce nuestras actividades, eventos especiales y programas.', href: '/actividades' },
              { icon: Heart, title: 'En Vivo', desc: 'No te pierdas ningún servicio. Transmitimos en vivo cada culto.', href: '/en-vivo' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="group rounded-xl bg-white p-6 shadow-lg transition hover:shadow-xl">
                <item.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-bold text-dark group-hover:text-primary">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                  Ver más <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Noticias activas */}
        {noticias.length > 0 && (
          <section className="relative mx-auto max-w-6xl px-4 py-20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-primary-light/5 blur-3xl" />
            </div>
            <h2 className="relative mb-4 text-center text-3xl font-bold text-dark">
              Últimas <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Noticias</span>
            </h2>
            <p className="relative mb-10 text-center text-sm text-gray-500">Mantente al día con lo último de la iglesia</p>
            <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {noticias.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="group"
                  style={{ animation: `fadeSlideUp 0.5s ease-out ${i * 0.1}s both` }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:rotate-x-2">
                    {/* glow hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary-light/20 to-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative overflow-hidden">
                      {n.imagenUrl ? (
                        <div className="relative h-48 w-full overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                          <img src={n.imagenUrl} alt={n.titulo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary-light/5 to-primary/10">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                          <Image src={logoSrc} alt="" width={72} height={72} className="h-16 w-16 object-contain opacity-25" />
                        </div>
                      )}
                      {n.videoUrl && (
                        <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          <Flame className="h-3 w-3" /> Video
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex flex-col p-5">
                      <h3 className="mb-2 text-lg font-bold text-dark group-hover:text-primary transition-colors">{n.titulo}</h3>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">{n.mensaje}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                        Leer más <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Versículo */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <blockquote className="text-2xl italic text-dark md:text-3xl">
            &ldquo;Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-500">— 2 Timoteo 1:7</p>
        </section>
      </main>

      {/* Modal noticia */}
      {selected && <NewsModal noticia={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </>
  )
}

/* ─────────────── News Modal ─────────────── */

function NewsModal({ noticia, onClose }: { noticia: Noticia; onClose: () => void }) {
  const [reacciones, setReacciones] = useState({ me_gusta: 0, me_encanta: 0, no_me_gusta: 0 })
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nombre, setNombre] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const storageKey = `reaccion_${noticia.id}`
  const [reaccionUsuario, setReaccionUsuario] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(storageKey)
  })

  useEffect(() => {
    const ref = doc(db, 'noticias', noticia.id)
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setReacciones(snap.data()?.reacciones || { me_gusta: 0, me_encanta: 0, no_me_gusta: 0 })
      }
    }).catch(() => {})
    const col = collection(db, 'noticias', noticia.id, 'comentarios')
    getDocs(query(col, orderBy('timestamp', 'desc'), limit(20))).then(snap => {
      const list: Comentario[] = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() as Comentario }))
      setComentarios(list)
    }).catch(() => {})
  }, [noticia.id])

  const reaccionar = useCallback(async (tipo: string) => {
    if (reaccionUsuario) return
    const campo = `reacciones.${tipo}`
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'noticias', noticia.id)
        const snap = await tx.get(ref)
        const actual = snap.data()?.reacciones?.[tipo] || 0
        tx.update(ref, { [`reacciones.${tipo}`]: actual + 1 })
      })
      setReacciones(prev => ({ ...prev, [tipo]: prev[tipo as keyof typeof prev] + 1 }))
      setReaccionUsuario(tipo)
      localStorage.setItem(storageKey, tipo)
    } catch { /* silent */ }
  }, [noticia.id, reaccionUsuario, storageKey])

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !texto.trim() || enviando) return
    setEnviando(true)
    try {
      await addDoc(collection(db, 'noticias', noticia.id, 'comentarios'), {
        nombre: nombre.trim(),
        texto: texto.trim().slice(0, 100),
        timestamp: Timestamp.now(),
      })
      setTexto('')
      const col = collection(db, 'noticias', noticia.id, 'comentarios')
      const snap = await getDocs(query(col, orderBy('timestamp', 'desc'), limit(20)))
      const list: Comentario[] = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() as Comentario }))
      setComentarios(list)
    } catch { /* silent */ }
    setEnviando(false)
  }

  // ── helper: logo como dataURL (solo desde caché, no bloquea) ──
  function getLogoCached(): string {
    return localStorage.getItem('logoB64') || ''
  }
  // precargar logo al montar el componente
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

  async function handlePrint() {
    const logoB64 = getLogoCached()
    const watermarkHtml = logoB64
      ? `<div class="watermark"><img src="${logoB64}" alt=""/></div>`
      : ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${noticia.titulo}</title>
      <style>
        @page{margin:0.5in;size:letter}
        body{font-family:Georgia,serif;color:#333;max-width:700px;margin:auto;padding:20px}
        .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;pointer-events:none;z-index:-1;text-align:center}
        .watermark img{width:120px;height:auto}
        .imagen{margin:0 auto 24px;text-align:center}
        .imagen img{max-width:100%;max-height:300px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.12)}
        h1{text-align:center;color:#b8860b;font-size:22px;margin:0 0 8px}
        .linea{margin:0 auto 20px;width:80%;height:1px;background:#b8860b}
        .content{white-space:pre-wrap;line-height:1.9;font-size:14px;margin-top:16px}
        .footer{text-align:center;margin-top:40px;font-size:12px;color:#999;border-top:1px solid #ddd;padding-top:12px}
      </style></head><body>
      ${watermarkHtml}
      ${noticia.imagenUrl ? `<div class="imagen"><img src="${noticia.imagenUrl}" alt=""/></div>` : ''}
      <h1>${noticia.titulo}</h1>
      <div class="linea"></div>
      <div class="content">${noticia.mensaje}</div>
      ${noticia.videoUrl ? `<p style="text-align:center;margin-top:20px"><a href="${noticia.videoUrl}" style="color:#b8860b">Ver video relacionado</a></p>` : ''}
      <div class="footer">
        <p>Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad</p>
        <p>Impreso desde la página oficial</p>
      </div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 800)
  }

  async function handleDownload() {
    const { default: jsPDF } = await import('jspdf')

    // carta: 216 × 279 mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const pw = doc.internal.pageSize.width
    const ph = doc.internal.pageSize.height
    const margin = 20
    let y = margin

    // ── watermark (logo con opacidad vía canvas) ──
    const logoB64 = getLogoCached()
    let opaqueLogo = ''
    if (logoB64) {
      try {
        const img = new window.Image()
        opaqueLogo = await new Promise<string>((resolve, reject) => {
          img.onload = () => { const c=document.createElement('canvas'); c.width=120; c.height=120; const cx=c.getContext('2d')!; cx.globalAlpha=0.1; cx.drawImage(img,0,0,120,120); resolve(c.toDataURL('image/png')) }
          img.onerror = reject; img.src = logoB64
        })
        doc.addImage(opaqueLogo, 'PNG', (pw-60)/2, (ph-60)/2-20, 60, 60)
      } catch {}
    }
    function ponerMarca() { if (opaqueLogo) doc.addImage(opaqueLogo, 'PNG', (pw-60)/2, (ph-60)/2-20, 60, 60) }

    // ── image al inicio ──
    if (noticia.imagenUrl) {
      try {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        const dataUrl = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            const c = document.createElement('canvas')
            c.width = img.width; c.height = img.height
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            resolve(c.toDataURL('image/jpeg', 0.85))
          }
          img.onerror = reject
          img.src = noticia.imagenUrl
        })
        const maxW = pw - margin * 2
        const imgW = Math.min(maxW, 160)
        const imgH = imgW * (img.height / img.width)
        doc.addImage(dataUrl, 'JPEG', (pw - imgW) / 2, y, imgW, imgH)
        y += imgH + 12
      } catch { /* ignore image */ }
    }

    // ── línea decorativa ──
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pw - margin, y)
    y += 8

    // ── título ──
    doc.setFont('times', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(184, 134, 11)
    doc.text(noticia.titulo, pw / 2, y, { align: 'center' })
    y += 10

    // ── segunda línea ──
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.3)
    doc.line(margin + 30, y, pw - margin - 30, y)
    y += 8

    // ── mensaje ──
    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(51, 51, 51)
    const lineH = 6
    const maxY = ph - margin - 10
    const fullText = noticia.mensaje
    const paragraphs = fullText.split('\n').filter(Boolean)
    for (const p of paragraphs) {
      if (y > maxY) { doc.addPage(); y = margin; ponerMarca() }
      const lines = doc.splitTextToSize(p, pw - margin * 2)
      doc.text(lines, margin, y)
      y += lines.length * lineH + 4
    }

    // ── pie ──
    y = Math.max(y + 8, ph - margin)
    doc.setFont('times', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text('Iglesia Espíritu Santo y Fuego — Misión Cristiana Perfectos en Unidad', pw / 2, y, { align: 'center' })

    doc.save(`${noticia.titulo.replace(/\s+/g, '_')}.pdf`)
  }

  const reactionBtns = [
    { key: 'me_gusta', label: 'Me gusta', icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { key: 'me_encanta', label: 'Me encanta', icon: Smile, color: 'text-amber-600', bg: 'bg-amber-100' },
    { key: 'no_me_gusta', label: 'No me gusta', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-100' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary-light/5 blur-3xl" />
        </div>

        <button onClick={onClose} className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>

        {noticia.imagenUrl && (
          <div className="relative h-56 w-full md:h-72 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-10" />
            <img src={noticia.imagenUrl} alt={noticia.titulo} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="relative z-10 p-8 pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {noticia.titulo}
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-primary/40 to-primary-light/40" />
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-100 shadow-inner">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700 [&>br]:block [&>br]:content-[''] [&>br]:my-2">
              {noticia.mensaje}
            </p>
          </div>

          {/* video button */}
          {noticia.videoUrl && (
            <div className="mt-6 text-center">
              <a href={noticia.videoUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
              >
                <Flame className="h-4 w-4" /> Ver Video
              </a>
            </div>
          )}

          {/* Reactions */}
          <div className="mt-6 flex justify-center gap-3">
            {reactionBtns.map(({ key, label, icon: Icon, color, bg }) => (
              <button
                key={key}
                onClick={() => reaccionar(key)}
                disabled={!!reaccionUsuario}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  reaccionUsuario === key
                    ? `${bg} ${color} ring-2 ring-offset-1 ring-${color.replace('text-', '')}`
                    : reaccionUsuario
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${reaccionUsuario === key ? color : ''}`} />
                <span>{label}</span>
                <span className="ml-1 text-xs font-bold tabular-nums">{reacciones[key as keyof typeof reacciones]}</span>
              </button>
            ))}
          </div>

          {/* Download / Print - AHORA SIEMPRE VISIBLES */}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" /> Descargar PDF
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-500/25 transition hover:shadow-gray-500/40 hover:-translate-y-0.5"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <MessageCircle className="h-4 w-4" /> Comentarios ({comentarios.length})
            </h3>

            {!mostrarFormulario ? (
              <button onClick={() => setMostrarFormulario(true)}
                className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
              >
                <MessageCircle className="h-4 w-4" /> Comentar
              </button>
            ) : (
              <form onSubmit={enviarComentario} className="mb-4 space-y-2">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un comentario (máx. 100 caracteres)"
                    value={texto}
                    onChange={e => setTexto(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                  <button type="submit" disabled={enviando || !nombre.trim() || !texto.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    {enviando ? '...' : 'Enviar'}
                  </button>
                  <button type="button" onClick={() => setMostrarFormulario(false)}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comentarios.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin comentarios aún. ¡Sé el primero!</p>
              ) : (
                comentarios.map((c) => (
                  <div key={c.id} className="rounded-xl bg-gray-50 px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">{c.nombre}</span>
                      <span className="text-[10px] text-gray-400">
                        {c.timestamp?.toDate().toLocaleString('es')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-gray-600">{c.texto}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-400">Presiona ESC o haz clic fuera para cerrar</p>
        </div>
      </div>
    </div>
  )
}

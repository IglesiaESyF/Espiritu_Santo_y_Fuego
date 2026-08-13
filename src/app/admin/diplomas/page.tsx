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

interface DiplomaConfig {
  colorTitulo: string
  colorNombre: string
  colorTexto: string
  colorBorde: string
  tipoBorde: string
  negrita: boolean
  superNegrita: boolean
  tamTitulo: number
  tamNombre: number
  tamTexto: number
  fuenteNombre: 'cursiva' | 'gotica'
  template: 'clasico' | 'elegante' | 'marco'
}

const DEFAULT_CONFIG: DiplomaConfig = {
  colorTitulo: '#b8860b',
  colorNombre: '#b8860b',
  colorTexto: '#444444',
  colorBorde: '#b8860b',
  tipoBorde: 'doble',
  negrita: true,
  superNegrita: false,
  tamTitulo: 28,
  tamNombre: 42,
  tamTexto: 14,
  fuenteNombre: 'cursiva',
  template: 'clasico',
}

const TEMPLATES: Record<DiplomaConfig['template'], { label: string; desc: string }> = {
  clasico: { label: 'Clásico', desc: 'Marco de borde configurable, logo y marca de agua de lluvia' },
  elegante: { label: 'Elegante', desc: 'Marco dorado pulido, paloma blanca y ondas de agua' },
  marco: { label: 'Marco', desc: 'Diseño personalizado con el logo de la iglesia arriba a la izquierda' },
}

const FUENTES_NOMBRE: Record<DiplomaConfig['fuenteNombre'], { label: string; family: string }> = {
  cursiva: { label: 'Cursiva (Great Vibes)', family: "'Great Vibes', cursive" },
  gotica: { label: 'Gótica legible (Grenze Gotisch)', family: "'Grenze Gotisch', 'UnifrakturMaguntia', cursive" },
}

interface BordeDef {
  label: string
  outer: string
  inner: string
  corner: string
  cornerShape?: 'circle' | 'cross' | 'diamond' | 'bracket'
  sideDots?: boolean
}

const TIPOS_BORDE: Record<string, BordeDef> = {
  doble: { label: 'Doble', outer: '3px double var(--c-borde)', inner: '1px double var(--c-borde)', corner: '2px solid var(--c-borde)' },
  doble_grueso: { label: 'Doble grueso', outer: '4px double var(--c-borde)', inner: '1.5px double var(--c-borde)', corner: '3px solid var(--c-borde)' },
  simple: { label: 'Simple', outer: '2px solid var(--c-borde)', inner: '0.8px solid var(--c-borde)', corner: '2px solid var(--c-borde)' },
  sencillo: { label: 'Sencillo', outer: '1.2px solid var(--c-borde)', inner: '0.6px solid var(--c-borde)', corner: '1px solid var(--c-borde)' },
  grueso: { label: 'Grueso', outer: '4px solid var(--c-borde)', inner: '1.5px solid var(--c-borde)', corner: '3px solid var(--c-borde)' },
  fino: { label: 'Fino', outer: '1px solid var(--c-borde)', inner: '0.5px solid var(--c-borde)', corner: '1px solid var(--c-borde)' },
  punteado: { label: 'Punteado', outer: '2.5px dotted var(--c-borde)', inner: '1px dotted var(--c-borde)', corner: '2px solid var(--c-borde)' },
  rayado: { label: 'Rayado', outer: '2.5px dashed var(--c-borde)', inner: '1px dashed var(--c-borde)', corner: '2px solid var(--c-borde)' },
  esquinas: { label: 'Solo esquinas', outer: 'none', inner: 'none', corner: '3px solid var(--c-borde)' },
  esquinas_finas: { label: 'Esquinas finas', outer: 'none', inner: 'none', corner: '1.5px solid var(--c-borde)', cornerShape: 'bracket' },
  romanos: { label: 'Esquinas romanas', outer: '1.5px solid var(--c-borde)', inner: '0.8px solid var(--c-borde)', corner: '2px solid var(--c-borde)', cornerShape: 'bracket' },
  cruz: { label: 'Cruces en esquinas', outer: '2.5px double var(--c-borde)', inner: '1px double var(--c-borde)', corner: '2px solid var(--c-borde)', cornerShape: 'cross' },
  diamante: { label: 'Diamantes', outer: '2.5px double var(--c-borde)', inner: '1px double var(--c-borde)', corner: '2px solid var(--c-borde)', cornerShape: 'diamond' },
  lazo: { label: 'Línea con puntos', outer: '1.2px solid var(--c-borde)', inner: '1px dotted var(--c-borde)', corner: '2px solid var(--c-borde)', sideDots: true },
  gala: { label: 'Gala', outer: '3px double var(--c-borde)', inner: '1px solid var(--c-borde)', corner: '2px solid var(--c-borde)', cornerShape: 'diamond', sideDots: true },
  cincelado: { label: 'Cincelado', outer: '3px ridge var(--c-borde)', inner: '1px ridge var(--c-borde)', corner: '2px solid var(--c-borde)' },
  relieve: { label: 'Relieve', outer: '3px outset var(--c-borde)', inner: '1px outset var(--c-borde)', corner: '2px solid var(--c-borde)' },
}

function bordeRules(cfg: DiplomaConfig, prefix: string): string {
  const b = TIPOS_BORDE[cfg.tipoBorde] || TIPOS_BORDE.doble
  const p = prefix
  let cornerCss: string
  switch (b.cornerShape) {
    case 'cross':
      cornerCss = `.${p}corner { position: absolute; width: 9mm; height: 9mm; }
  .${p}corner::before { content: ''; position: absolute; top: 50%; left: 50%; width: 9mm; height: 2.6mm; transform: translate(-50%, -50%); background: var(--c-borde); }
  .${p}corner::after { content: ''; position: absolute; top: 50%; left: 50%; width: 2.6mm; height: 9mm; transform: translate(-50%, -50%); background: var(--c-borde); }`
      break
    case 'diamond':
      cornerCss = `.${p}corner { position: absolute; width: 6.5mm; height: 6.5mm; transform: rotate(45deg); background: var(--c-borde); }`
      break
    case 'bracket':
      cornerCss = `.${p}corner { position: absolute; width: 11mm; height: 11mm; }
  .${p}corner.tl { border-top: 1.8mm solid var(--c-borde); border-left: 1.8mm solid var(--c-borde); }
  .${p}corner.tr { border-top: 1.8mm solid var(--c-borde); border-right: 1.8mm solid var(--c-borde); }
  .${p}corner.bl { border-bottom: 1.8mm solid var(--c-borde); border-left: 1.8mm solid var(--c-borde); }
  .${p}corner.br { border-bottom: 1.8mm solid var(--c-borde); border-right: 1.8mm solid var(--c-borde); }`
      break
    default:
      cornerCss = `.${p}corner { position: absolute; width: 8mm; height: 8mm; border-radius: 50%; border: ${b.corner}; }
  .${p}corner::after { content: ''; position: absolute; inset: 2mm; border-radius: 50%; background: var(--c-borde); }`
  }
  const dotsCss = b.sideDots ? `
  .${p}dot { position: absolute; width: 3mm; height: 3mm; border-radius: 50%; background: var(--c-borde); }
  .${p}dot.top { top: 9mm; left: 50%; transform: translateX(-50%); }
  .${p}dot.bottom { bottom: 9mm; left: 50%; transform: translateX(-50%); }
  .${p}dot.left { left: 9mm; top: 50%; transform: translateY(-50%); }
  .${p}dot.right { right: 9mm; top: 50%; transform: translateY(-50%); }` : ''
  return `
  .${p}border-outer { position: absolute; inset: 10mm; border-radius: 4px; border: ${b.outer}; }
  .${p}border-inner { position: absolute; inset: 14mm; border-radius: 3px; border: ${b.inner}; }
  ${cornerCss}
  ${dotsCss}`
}

const STORAGE_KEY = 'diploma_config'

const COLOR_PRESETS = ['#b8860b', '#daa520', '#c2410c', '#dc2626', '#be185d', '#7c3aed', '#1d4ed8', '#0f766e', '#15803d', '#1f2937']

function loadConfig(): DiplomaConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(cfg: DiplomaConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {}
}

function colorVars(cfg: DiplomaConfig): string {
  return `:root {
  --c-main: ${cfg.colorTitulo};
  --c-name: ${cfg.colorNombre};
  --c-text: ${cfg.colorTexto};
  --c-borde: ${cfg.colorBorde};
  --fw: ${cfg.negrita ? '700' : '400'};
  --stroke: ${cfg.superNegrita ? '0.45px' : '0px'};
  --fs-titulo: ${cfg.tamTitulo}pt;
  --fs-nombre: ${cfg.tamNombre}pt;
  --fs-texto: ${cfg.tamTexto}pt;
  --fn-nombre: ${FUENTES_NOMBRE[cfg.fuenteNombre]?.family || FUENTES_NOMBRE.cursiva.family};
}`
}

function getDiplomaBodyHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
  return `<div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
    <div class="dot top"></div><div class="dot bottom"></div><div class="dot left"></div><div class="dot right"></div>
    <div class="watermark">
      <div class="water-bg"></div>
      <div class="water-wave w1"></div><div class="water-wave w2"></div><div class="water-wave w3"></div>
    </div>
    <div class="content">
      <div class="content-inner">
      <div class="logo"><img src="${logoUrl}"></div>
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
        <strong style="font-size:var(--fs-texto); color:var(--c-text);">"Por tanto, id y haced disc\u00edpulos a todas las naciones,<br>
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
  </div>`
}

function getMmCSS(cfg: DiplomaConfig): string {
  return `${colorVars(cfg)}
  @page { size: landscape letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 279mm; height: 216mm; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .page { position: relative; width: 279mm; height: 216mm; overflow: hidden; }
  ${bordeRules(cfg, '')}
  .corner.tl { top: 7mm; left: 7mm; }
  .corner.tr { top: 7mm; right: 7mm; }
  .corner.bl { bottom: 7mm; left: 7mm; }
  .corner.br { bottom: 7mm; right: 7mm; }
  .watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
  ${WATER_CSS}
  .content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; height: 100%; padding: 27mm 24mm 37mm; -webkit-text-stroke: var(--stroke); }
  .content-inner { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transform-origin: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-titulo); color: var(--c-main); letter-spacing: 5px; text-transform: uppercase; }
  .gold-line { width: 80mm; height: 1px; background: var(--c-borde); margin: 1.5mm auto; position: relative; }
  .gold-line::after { content: '\u2726'; position: absolute; top: -3.5mm; left: 50%; transform: translateX(-50%); color: var(--c-borde); font-size: 7pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 20pt; color: var(--c-main); margin-top: 0.8mm; font-weight: 700; -webkit-text-stroke: 0; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 12pt; color: var(--c-main); letter-spacing: 2px; text-transform: uppercase; margin-top: 0.8mm; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 1.5mm; line-height: 1.4; }
  .name { font-family: var(--fn-nombre); font-size: var(--fs-nombre); color: var(--c-name); margin-top: 1mm; line-height: 1.1; }
  .name-underline { width: 100mm; height: 1px; background: var(--c-borde); margin: 1.5mm auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 1.5mm; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) + 1pt); color: var(--c-text); margin-top: 0.5mm; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: -2mm; max-width: 200mm; }
  .bottom-section { margin-top: 14mm; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 50mm; padding-bottom: 2mm; }
  .sig-block { display: flex; flex-direction: column; align-items: center; }
  .sig-line { width: 42mm; min-width: 42mm; border-top: 1px solid #333; margin-bottom: 1.5mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) - 2pt); color: var(--c-text); }
  .footer-line { width: 80mm; height: 1px; background: var(--c-borde); margin: 3mm auto 1.5mm; position: relative; }
  .footer-line::after { content: '\u2726'; position: absolute; top: -3mm; left: 50%; transform: translateX(-50%); color: var(--c-borde); font-size: 6pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 10pt; color: var(--c-text); }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}

const FIT_SCRIPT = `
<script>
window.__fitDiplomas = function() {
  var content = document.querySelector('.content');
  var inner = document.querySelector('.content-inner');
  if (content && inner) {
    inner.style.transform = 'none';
    var scale = Math.min(content.clientHeight / inner.scrollHeight, content.clientWidth / inner.scrollWidth, 1);
    if (scale < 1) inner.style.transform = 'scale(' + scale + ')';
  }
  document.querySelectorAll('.sig-block').forEach(function(block) {
    var name = block.querySelector('.sig-name');
    var line = block.querySelector('.sig-line');
    if (name && line) line.style.width = (name.getBoundingClientRect().width + 8) + 'px';
  });
  var cbody = document.querySelector('.cert-body');
  var cinner = document.querySelector('.cert-body-inner');
  if (cbody && cinner) {
    cinner.style.transform = 'none';
    var cscale = Math.min(cbody.clientHeight / cinner.scrollHeight, cbody.clientWidth / cinner.scrollWidth, 1);
    if (cscale < 1) cinner.style.transform = 'scale(' + cscale + ')';
  }
  document.querySelectorAll('.cert-sig-block').forEach(function(block) {
    var name = block.querySelector('.cert-sig-name');
    var line = block.querySelector('.cert-sig-line');
    if (name && line) line.style.width = (name.getBoundingClientRect().width + 6) + 'px';
  });
};
window.addEventListener('load', function() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(window.__fitDiplomas);
  } else {
    window.__fitDiplomas();
  }
});
</script>
`

const WATER_CSS = `
.watermark, .cert-watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
.water-bg { position: absolute; inset: 0; background:
  radial-gradient(ellipse at 25% 30%, rgba(150,200,255,0.14), transparent 55%),
  radial-gradient(ellipse at 75% 70%, rgba(150,200,255,0.14), transparent 55%),
  linear-gradient(180deg, rgba(190,220,255,0.06), rgba(160,205,255,0.12) 55%, rgba(140,195,255,0.18)); }
.water-wave { position: absolute; left: -15%; width: 130%; height: 8mm; border-top: 1px solid rgba(150,205,255,0.30); border-radius: 50%; }
.water-wave.w1 { top: 34%; animation: wave-drift 8s ease-in-out infinite alternate; }
.water-wave.w2 { top: 58%; animation: wave-drift 11s ease-in-out infinite alternate-reverse; }
.water-wave.w3 { top: 80%; animation: wave-drift 9s ease-in-out infinite alternate; }
@keyframes wave-drift { from { transform: translateX(-2%); } to { transform: translateX(2%); } }
.wr-drop { position: absolute; top: 0; left: 0; z-index: 2; opacity: 0.6; pointer-events: none; }
.wr-drop::before { content: ''; display: block; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(180,220,255,0.85), rgba(115,170,240,0.75)); border-radius: 50% 50% 46% 54%; box-shadow: 0 0 1.5mm rgba(140,190,255,0.5); }
.wr-ripple { position: absolute; width: 14mm; height: 14mm; margin: -7mm 0 0 -7mm; border: 1mm solid rgba(130,185,255,0.55); border-radius: 50%; opacity: 0; transform: scale(0.15); animation: wr-ripple 2s ease-out forwards; pointer-events: none; }
@keyframes wr-ripple { 0% { opacity: 0; transform: scale(0.15); } 15% { opacity: 0.6; } 100% { opacity: 0; transform: scale(2.4); } }
.logo { width: 26mm; height: 26mm; border-radius: 50%; padding: 1.5mm; background: #fff; border: 1px solid var(--c-borde); margin-bottom: 2.5mm; display: flex; align-items: center; justify-content: center; }
.logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
.cert-logo { width: 20mm; height: 20mm; border-radius: 50%; padding: 1.2mm; background: #fff; border: 1px solid var(--c-borde); margin: 0 auto 2.5mm; display: flex; align-items: center; justify-content: center; }
.cert-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
`

const WATER_SCRIPT = `
<script>
window.__startWater = function() {
  var wrap = document.querySelector('.watermark') || document.querySelector('.cert-watermark');
  if (!wrap || wrap.getAttribute('data-water')) return;
  wrap.setAttribute('data-water', '1');
  var w = wrap.clientWidth, h = wrap.clientHeight;
  function spawnRipple(x, y) {
    var el = document.createElement('div');
    el.className = 'wr-ripple';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    wrap.appendChild(el);
    setTimeout(function() { el.remove(); }, 2100);
  }
  function spawnDrop() {
    var el = document.createElement('div');
    el.className = 'wr-drop';
    var x = 6 + Math.random() * 88;
    var y = 16 + Math.random() * 62;
    var size = 2.2 + Math.random() * 2.2;
    el.style.left = (w * x / 100) + 'px';
    el.style.width = size + 'mm';
    el.style.height = (size * 1.45) + 'mm';
    wrap.appendChild(el);
    var startY = -(30 + Math.random() * 60);
    var endY = h * y / 100;
    var dur = 2400 + Math.random() * 2400;
    var anim = el.animate([
      { transform: 'translateY(' + startY + 'px)' },
      { transform: 'translateY(' + endY + 'px)' }
    ], { duration: dur, easing: 'ease-in' });
    anim.onfinish = function() {
      spawnRipple(w * x / 100, h * y / 100);
      el.remove();
    };
  }
  for (var i = 0; i < 5; i++) setTimeout(spawnDrop, 400 * i);
  setInterval(spawnDrop, 1700);
};
function __waterBoot() {
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(window.__startWater);
  else window.__startWater();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __waterBoot);
} else {
  __waterBoot();
}
</script>
`

const DOVE_SVG = `<svg viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="doveBody" cx="42%" cy="35%" r="80%">
<stop offset="0%" stop-color="#ffffff"/>
<stop offset="70%" stop-color="#f4f8fc"/>
<stop offset="100%" stop-color="#dbe7f2"/>
</radialGradient>
<linearGradient id="doveWing" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#ffffff"/>
<stop offset="100%" stop-color="#e3edf6"/>
</linearGradient>
</defs>
<g fill="url(#doveWing)" stroke="#cfdce9" stroke-width="1">
<path d="M82 58 C 96 22, 140 4, 186 12 C 178 20, 172 28, 170 38 C 152 34, 136 38, 126 46 C 112 44, 96 50, 84 62 Z"/>
<path d="M104 24 C 118 19, 138 17, 158 20" fill="none"/>
<path d="M100 40 C 114 33, 132 30, 150 35" fill="none"/>
</g>
<g fill="url(#doveWing)" stroke="#cfdce9" stroke-width="1">
<path d="M84 74 C 96 106, 132 144, 188 140 C 178 126, 170 112, 166 98 C 150 106, 134 104, 122 94 C 108 98, 96 90, 86 78 Z"/>
<path d="M108 118 C 122 126, 140 126, 156 120" fill="none"/>
</g>
<g fill="url(#doveBody)" stroke="#cfdce9" stroke-width="1">
<path d="M140 66 C 168 58, 196 44, 214 28 C 212 48, 208 64, 202 78 C 198 90, 192 100, 184 108 C 174 94, 160 84, 144 80 Z"/>
<path d="M198 38 C 200 52, 198 66, 192 78" fill="none"/>
</g>
<g fill="url(#doveBody)" stroke="#cfdce9" stroke-width="1.2">
<path d="M50 64 C 52 48, 70 42, 88 46 C 108 50, 128 52, 142 62 C 148 66, 150 74, 144 80 C 132 90, 112 94, 92 90 C 72 86, 58 78, 52 70 Z"/>
</g>
<circle cx="52" cy="56" r="11" fill="url(#doveBody)" stroke="#cfdce9" stroke-width="1.2"/>
<path d="M44 54 L24 57 L44 60 Z" fill="#e0b64e" stroke="#c99b3e" stroke-width="0.8"/>
<circle cx="52" cy="54" r="1.8" fill="#2f4254"/>
</svg>`

const WATER_WAVES_SVG = `<svg viewBox="0 -6 220 104" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="110" cy="66" rx="9" ry="3" fill="rgba(150,202,255,0.5)"/>
<ellipse cx="110" cy="66" rx="22" ry="7" fill="none" stroke="rgba(150,202,255,0.45)" stroke-width="1.4"/>
<ellipse cx="110" cy="66" rx="40" ry="12.5" fill="none" stroke="rgba(150,202,255,0.35)" stroke-width="1.2"/>
<ellipse cx="110" cy="66" rx="62" ry="19" fill="none" stroke="rgba(150,202,255,0.26)" stroke-width="1.1"/>
<ellipse cx="110" cy="66" rx="88" ry="27" fill="none" stroke="rgba(150,202,255,0.18)" stroke-width="1"/>
<ellipse cx="110" cy="66" rx="118" ry="36" fill="none" stroke="rgba(150,202,255,0.12)" stroke-width="1"/>
<path d="M110 26 C 110 16, 102 10, 102 4 C 102 -3, 106 -6, 110 -6 C 114 -6, 118 -3, 118 4 C 118 10, 110 16, 110 26 Z" fill="rgba(140,196,255,0.85)"/>
</svg>`

function getEleganteCss(cfg: DiplomaConfig): string {
  return `${colorVars(cfg)}
  @page { size: landscape letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 279mm; height: 216mm; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .page.diploma { position: relative; width: 279mm; height: 216mm; overflow: hidden; background: #fff; font-family: 'Cormorant Garamond', serif; }
  .e-border-blue { position: absolute; inset: 5.5mm; border: 0.7mm solid rgba(120,170,215,0.6); border-radius: 1mm; }
  .e-frame-gold-outer { position: absolute; inset: 7.8mm; border: 0.45mm solid #d9b25c; border-radius: 1mm; }
  .e-band-gold { position: absolute; inset: 9.4mm; background: linear-gradient(165deg, #f8e4ac 0%, #efca6b 30%, #dcab44 62%, #c08e2c 100%); box-shadow: 0 0 2mm rgba(200,160,60,0.35); }
  .e-band-gold-inner { position: absolute; inset: 1.15mm; background: #fff; }
  .e-frame-gold-inner { position: absolute; inset: 12.6mm; border: 0.4mm solid #d9b25c; border-radius: 0.5mm; }
  .e-frame-gold-fine { position: absolute; inset: 14.4mm; border: 0.25mm solid rgba(217,178,92,0.85); }
  .e-dove { position: absolute; top: 12mm; right: 14.5mm; width: 54mm; height: 42mm; z-index: 2; }
  .e-dove svg { width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 1.2mm 1.6mm rgba(120,160,210,0.28)); }
  .e-water { position: absolute; bottom: 5mm; left: 50%; transform: translateX(-50%); width: 200mm; height: 62mm; z-index: 1; opacity: 0.9; }
  .e-water svg { width: 100%; height: 100%; }
  .e-logo { position: absolute; top: 17mm; left: 50%; transform: translateX(-50%); width: 18mm; height: 18mm; border-radius: 50%; padding: 1mm; background: #fff; border: 0.6mm solid #d9b25c; z-index: 3; display: flex; align-items: center; justify-content: center; }
  .e-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
  .content { position: relative; z-index: 3; display: flex; align-items: center; justify-content: center; height: 100%; padding: 40mm 32mm 56mm; -webkit-text-stroke: var(--stroke); }
  .content-inner { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transform-origin: center; }
  .e-title { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-titulo); color: var(--c-main); letter-spacing: 6px; text-transform: uppercase; }
  .e-title-sub { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 15pt; letter-spacing: 4px; color: var(--c-main); text-transform: uppercase; margin-top: 1mm; }
  .e-gold-line { width: 70mm; height: 0.5mm; background: linear-gradient(90deg, transparent, #d9b25c, transparent); margin: 2.5mm auto; }
  .e-church { font-family: 'UnifrakturMaguntia', cursive; font-size: 21pt; color: var(--c-main); font-weight: 700; -webkit-text-stroke: 0; margin-top: 1mm; }
  .e-church-sub { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 11.5pt; letter-spacing: 2px; text-transform: uppercase; color: var(--c-main); margin-top: 0.8mm; }
  .e-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 2mm; line-height: 1.45; max-width: 195mm; }
  .e-name { font-family: var(--fn-nombre); font-size: var(--fs-nombre); color: var(--c-name); margin-top: 1.5mm; line-height: 1.1; }
  .e-name-underline { width: 95mm; height: 0.4mm; background: linear-gradient(90deg, transparent, var(--c-borde), transparent); margin: 1.8mm auto 0; }
  .e-date-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 2mm; }
  .e-date-value { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) + 1.5pt); color: var(--c-text); margin-top: 0.5mm; letter-spacing: 1px; }
  .e-verse { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: var(--fw); font-size: calc(var(--fs-texto) - 0.5pt); color: var(--c-text); margin-top: 2.5mm; max-width: 195mm; line-height: 1.4; }
  .signatures { display: flex; justify-content: center; gap: 46mm; padding-bottom: 2mm; margin-top: 6mm; }
  .sig-block { display: flex; flex-direction: column; align-items: center; }
  .sig-line { width: 42mm; min-width: 42mm; border-top: 0.5mm solid #8a929c; margin-bottom: 1.5mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) - 2pt); color: var(--c-text); }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}

function getEleganteBodyHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string): string {
  return `<div class="page diploma page-elegante">
    <div class="e-border-blue"></div>
    <div class="e-frame-gold-outer"></div>
    <div class="e-band-gold"><div class="e-band-gold-inner"></div></div>
    <div class="e-frame-gold-inner"></div>
    <div class="e-frame-gold-fine"></div>
    <div class="e-dove">${DOVE_SVG}</div>
    <div class="e-water">${WATER_WAVES_SVG}</div>
    <div class="e-logo"><img src="${logoUrl}"></div>
    <div class="content">
      <div class="content-inner">
      <div class="e-title">Certificado</div>
      <div class="e-title-sub">de Bautismo</div>
      <div class="e-gold-line"></div>
      <div class="e-church">Iglesia Esp\u00edritu Santo y Fuego</div>
      <div class="e-church-sub">Misi\u00f3n Cristiana Perfectos en Unidad</div>
      <div class="e-text">Certificamos que el(la) hermano(a):</div>
      <div class="e-name">${nombreCompleto}</div>
      <div class="e-name-underline"></div>
      <div class="e-verse">"Porque todos ustedes, que fueron bautizados en Cristo, se han vestido de Cristo." \u2014 <strong>G\u00e1latas 3:27</strong></div>
      <div class="e-date-text">Fue bautizado(a) el d\u00eda</div>
      <div class="e-date-value">${fechaLarga}</div>
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
      </div>
    </div>
  </div>`
}

function getMarcoCss(cfg: DiplomaConfig): string {
  return `${colorVars(cfg)}
  @page { size: landscape letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 279mm; height: 216mm; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .page.marco { position: relative; width: 279mm; height: 216mm; overflow: hidden; background: #fff; }
  .marco-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .marco-logo { position: absolute; top: 12mm; left: 12mm; width: 24mm; height: 24mm; z-index: 3; border-radius: 50%; padding: 1.2mm; background: rgba(255,255,255,0.95); border: 0.5mm solid var(--c-borde); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 1.5mm rgba(0,0,0,0.18); }
  .marco-logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
  .content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; height: 100%; padding: 26mm; -webkit-text-stroke: var(--stroke); }
  .content-inner { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transform-origin: center; }
  .title { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-titulo); color: var(--c-main); letter-spacing: 5px; text-transform: uppercase; }
  .gold-line { width: 80mm; height: 1px; background: var(--c-borde); margin: 1.5mm auto; position: relative; }
  .gold-line::after { content: '\u2726'; position: absolute; top: -3.5mm; left: 50%; transform: translateX(-50%); color: var(--c-borde); font-size: 7pt; }
  .church-name { font-family: 'UnifrakturMaguntia', cursive; font-size: 20pt; color: var(--c-main); margin-top: 0.8mm; font-weight: 700; -webkit-text-stroke: 0; }
  .church-sub { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 12pt; color: var(--c-main); letter-spacing: 2px; text-transform: uppercase; margin-top: 0.8mm; }
  .cert-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 1.5mm; line-height: 1.4; }
  .name { font-family: var(--fn-nombre); font-size: var(--fs-nombre); color: var(--c-name); margin-top: 1mm; line-height: 1.1; }
  .name-underline { width: 100mm; height: 1px; background: var(--c-borde); margin: 1.5mm auto 0; }
  .date-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: 1.5mm; }
  .date-value { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) + 1pt); color: var(--c-text); margin-top: 0.5mm; }
  .verse { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); margin-top: -2mm; max-width: 200mm; }
  .bottom-section { margin-top: 18mm; width: 100%; }
  .signatures { display: flex; justify-content: center; gap: 50mm; padding-bottom: 2mm; }
  .sig-block { display: flex; flex-direction: column; align-items: center; }
  .sig-line { width: 42mm; min-width: 42mm; border-top: 1px solid #333; margin-bottom: 1.5mm; }
  .sig-name { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); }
  .sig-role { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) - 2pt); color: var(--c-text); }
  .footer-line { width: 80mm; height: 1px; background: var(--c-borde); margin: 3mm auto 1.5mm; position: relative; }
  .footer-line::after { content: '\u2726'; position: absolute; top: -3mm; left: 50%; transform: translateX(-50%); color: var(--c-borde); font-size: 6pt; }
  .footer-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 10pt; color: var(--c-text); }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 279mm; height: 216mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}

function getMarcoBodyHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, marcoBgUrl: string): string {
  return `<div class="page diploma marco">
    <img class="marco-bg" src="${marcoBgUrl}" alt="">
    <div class="marco-logo"><img src="${logoUrl}"></div>
    <div class="content">
      <div class="content-inner">
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
        <strong style="font-size:var(--fs-texto); color:var(--c-text);">"Por tanto, id y haced disc\u00edpulos a todas las naciones,<br>
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
  </div>`
}

function buildDiplomaHtml(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, capturePng?: boolean, cfg: DiplomaConfig = DEFAULT_CONFIG): string {
  const captureScript = capturePng ? `
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script>
window.addEventListener('load', function() {
  setTimeout(async function() {
    try {
      if (window.__fitDiplomas) window.__fitDiplomas();
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

  const elegante = cfg.template === 'elegante'
  const marco = cfg.template === 'marco'
  let css = getMmCSS(cfg)
  let body: string
  if (elegante) {
    css = getEleganteCss(cfg)
    body = getEleganteBodyHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
  } else if (marco) {
    css = getMarcoCss(cfg)
    const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) || ''
    const marcoBgUrl = (typeof window !== 'undefined' ? window.location.origin : '') + base + '/diploma-marco.png'
    body = getMarcoBodyHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario, marcoBgUrl)
  } else {
    body = getDiplomaBodyHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario)
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Great+Vibes&family=Grenze+Gotisch:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>${css}</style>
${FIT_SCRIPT}
${WATER_SCRIPT}
${captureScript}
</head>
<body>${body}</body>
</html>`
}

function getCertificacionCss(cfg: DiplomaConfig): string {
  return `${colorVars(cfg)}
  @page { size: letter portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 216mm; height: 279mm; font-family: 'Cormorant Garamond', serif; background: #fff; overflow: hidden; }
  .page.certificacion { position: relative; width: 216mm; height: 279mm; overflow: hidden; font-family: 'Cormorant Garamond', serif; background: #fff; }
  ${bordeRules(cfg, 'cert-')}
  .cert-corner.tl { top: 7mm; left: 7mm; }
  .cert-corner.tr { top: 7mm; right: 7mm; }
  .cert-corner.bl { bottom: 7mm; left: 7mm; }
  .cert-corner.br { bottom: 7mm; right: 7mm; }
  .cert-watermark { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
  ${WATER_CSS}
  .cert-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 22mm 20mm 18mm; -webkit-text-stroke: var(--stroke); }
  .cert-header { text-align: center; margin-bottom: 10mm; }
  .cert-header .church { font-family: 'UnifrakturMaguntia', cursive; font-size: 20pt; color: var(--c-main); font-weight: 700; -webkit-text-stroke: 0; }
  .cert-header .sub { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 11pt; color: var(--c-main); letter-spacing: 2px; text-transform: uppercase; margin-top: 1mm; }
  .cert-header .gold-line { width: 60mm; height: 1px; background: var(--c-borde); margin: 4mm auto; }
  .cert-header .title { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-titulo); color: var(--c-main); letter-spacing: 3px; text-transform: uppercase; }
  .cert-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 8mm; }
  .cert-body-inner { width: 100%; display: flex; flex-direction: column; gap: 3mm; }
  .cert-row { display: flex; flex-direction: column; gap: 0.5mm; }
  .cert-label { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-main); }
  .cert-value { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) + 1pt); color: var(--c-text); border-bottom: 1px dashed #ccc; padding-bottom: 1mm; padding-left: 2mm; }
  .cert-footer { text-align: center; margin-top: auto; padding-top: 6mm; }
  .cert-footer-text { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: 10pt; color: var(--c-text); }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; width: 216mm; height: 279mm; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }`
}



function openDiplomaWindow(nombreCompleto: string, fechaLarga: string, logoUrl: string, pastor: string, secretario: string, capturePng?: boolean, cfg: DiplomaConfig = DEFAULT_CONFIG): Window | null {
  const html = buildDiplomaHtml(nombreCompleto, fechaLarga, logoUrl, pastor, secretario, capturePng, cfg)
  const win = window.open('', '_blank')
  if (!win) return null
  win.document.write(html)
  win.document.close()
  win.focus()
  return win
}

function buildCertificacionHtml(miembro: Miembro, logoUrl: string, pastor: string, secretario: string, testigo: string, fechaBautismo: string, capturePng?: boolean, cfg: DiplomaConfig = DEFAULT_CONFIG): string {
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
  const testigoNombre = testigo || '_________________________'

  const captureScript = capturePng ? `
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script>
window.addEventListener('load', function() {
  setTimeout(async function() {
    try {
      if (window.__fitDiplomas) window.__fitDiplomas();
      await document.fonts.ready;
      var target = document.querySelector('.page.certificacion') || document.body;
      var canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 816,
        height: 1056,
      });
      window.opener.postMessage({ type: 'certificacion-png', data: canvas.toDataURL('image/png') }, '*');
    } catch(e) {
      window.opener.postMessage({ type: 'certificacion-png-error', error: String(e) }, '*');
    }
  }, 2500);
});
</script>` : ''

  const body = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>${getCertificacionCss(cfg)}
.cert-sigs { display: flex; justify-content: space-between; margin-top: 10mm; padding: 0 8mm; }
.cert-sig-block { text-align: center; flex: 1; }
.cert-sig-line { width: 70%; height: 1px; background: #333; margin: 0 auto 2mm; }
.cert-sig-name { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: var(--fs-texto); color: var(--c-text); }
.cert-sig-role { font-family: 'Cormorant Garamond', serif; font-weight: var(--fw); font-size: calc(var(--fs-texto) - 2pt); color: var(--c-main); }
</style>
${FIT_SCRIPT}
${WATER_SCRIPT}
${captureScript}
</head>
<body>
<div class="page certificacion">
  <div class="cert-border-outer"></div>
  <div class="cert-border-inner"></div>
  <div class="cert-corner tl"></div><div class="cert-corner tr"></div><div class="cert-corner bl"></div><div class="cert-corner br"></div>
  <div class="cert-dot top"></div><div class="cert-dot bottom"></div><div class="cert-dot left"></div><div class="cert-dot right"></div>
  <div class="cert-watermark">
    <div class="water-bg"></div>
    <div class="water-wave w1"></div><div class="water-wave w2"></div><div class="water-wave w3"></div>
  </div>
  <div class="cert-content">
    <div class="cert-header">
      <div class="cert-logo"><img src="${logoUrl}"></div>
      <div class="church">Iglesia Esp\u00edritu Santo y Fuego</div>
      <div class="sub">Misi\u00f3n Cristiana Perfectos en Unidad</div>
      <div class="gold-line"></div>
      <div class="title">Certificaci\u00f3n de Datos del Bautizado</div>
    </div>
    <div class="cert-body">
      <div class="cert-body-inner">
      <div class="cert-row"><span class="cert-label">Nombre completo:</span><span class="cert-value">${miembro.nombre} ${miembro.apellido}</span></div>
      <div class="cert-row"><span class="cert-label">Fecha de nacimiento:</span><span class="cert-value">${fechaNac}</span></div>
      <div class="cert-row"><span class="cert-label">Nacionalidad:</span><span class="cert-value">${nacionalidad}</span></div>
      <div class="cert-row"><span class="cert-label">Direcci\u00f3n:</span><span class="cert-value">${direccion}</span></div>
      <div class="cert-row"><span class="cert-label">Fecha de bautismo:</span><span class="cert-value">${fechaBautismo || 'No registrada'}</span></div>
      <div class="cert-row"><span class="cert-label">Fecha de 1ra. llegada a la iglesia:</span><span class="cert-value">${fechaLleg}</span></div>
      <div class="cert-row"><span class="cert-label">Tiempo en la iglesia:</span><span class="cert-value">${tiempoIglesia}</span></div>
      <div class="cert-row"><span class="cert-label">\u00bfLleg\u00f3 bautizado de otra iglesia?:</span><span class="cert-value">${llegoBautizado}</span></div>
      </div>
    </div>
    <div class="cert-sigs">
      <div class="cert-sig-block">
        <div class="cert-sig-line"></div>
        <div class="cert-sig-name">${pastor}</div>
        <div class="cert-sig-role">Pastor(a) Principal</div>
      </div>
      <div class="cert-sig-block">
        <div class="cert-sig-line"></div>
        <div class="cert-sig-name">${secretario}</div>
        <div class="cert-sig-role">Secretario(a) General</div>
      </div>
      <div class="cert-sig-block">
        <div class="cert-sig-line"></div>
        <div class="cert-sig-name">${testigoNombre}</div>
        <div class="cert-sig-role">Diácono</div>
      </div>
    </div>
    <div class="cert-footer">
      <div class="cert-footer-text">Iglesia Esp\u00edritu Santo y Fuego \u2014 Misi\u00f3n Cristiana Perfectos en Unidad</div>
    </div>
  </div>
</div>
</body>
</html>`
  return body
}

function openCertificacionWindow(miembro: Miembro, logoUrl: string, pastor: string, secretario: string, testigo: string, fechaBautismo: string, capturePng?: boolean, cfg: DiplomaConfig = DEFAULT_CONFIG): Window | null {
  const html = buildCertificacionHtml(miembro, logoUrl, pastor, secretario, testigo, fechaBautismo, capturePng, cfg)
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-[#e0d8c8] bg-white p-0.5"
          title={label}
        />
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`h-6 w-6 rounded-full border transition hover:scale-110 ${value.toLowerCase() === c ? 'border-gray-800 ring-2 ring-gray-400/50' : 'border-gray-200'}`}
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
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
  const [generandoCert, setGenerandoCert] = useState(false)
  const [tipoMiembro, setTipoMiembro] = useState<'existente' | 'nuevo'>('existente')
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoApellido, setNuevoApellido] = useState('')
  const [guardarMiembro, setGuardarMiembro] = useState(true)
  const searchRef = useRef<HTMLDivElement>(null)
  const [testigo, setTestigo] = useState('')
  const [config, setConfig] = useState<DiplomaConfig>(() => loadConfig())

  function updateConfig(patch: Partial<DiplomaConfig>) {
    setConfig(prev => {
      const next = { ...prev, ...patch }
      saveConfig(next)
      return next
    })
  }

  useEffect(() => {
    const ok = user?.role === 'it-admin' || user?.role === 'secretario' || (user?.cargo && user.cargo.toLowerCase().includes('pastor'))
    if (!ok) router.replace('/admin/dashboard')
    else loadMiembros()
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function cargoArr(m: Miembro): string[] {
    return Array.isArray(m.cargo) ? m.cargo : (m.cargo ? [m.cargo] : [])
  }

  useEffect(() => {
    const p = miembros.find(m => cargoArr(m).includes('Pastor(a) Principal'))
    if (p) setPastor(`${p.nombre} ${p.apellido}`)
    const s = miembros.find(m => cargoArr(m).includes('Secretario(a) General'))
    if (s) setSecretario(`${s.nombre} ${s.apellido}`)
    const d = miembros.find(m => cargoArr(m).includes('Diácono(a)'))
    if (d && !testigo) setTestigo(`${d.nombre} ${d.apellido}`)
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
  const diaconos = useMemo(() => miembros.filter(m => cargoArr(m).includes('Diácono(a)')), [miembros])

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
      if (e.data?.type === 'certificacion-png') {
        if (!miembro) return
        const link = document.createElement('a')
        link.download = `${miembro.nombre}_${miembro.apellido}_certificacion.png`.replace(/\s+/g, '_')
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

    const win = openDiplomaWindow(nombreCompleto, fechaLarga, logoUrl, pastorNombre, secretarioNombre, true, config)
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
            llego_bautizado: false, motivo_llegada: '', categoria: '', cargo: [],
            familiares: [], notas: '', activo: true, creadoEn: Date.now(),
          }).catch(() => {})
        }
      }, 3500)
    } else {
      setGenerando(false)
    }
  }

  function handlePrintCertificacion() {
    if (!miembro) return
    setGenerandoCert(true)
    const logoUrl = getLogoUrl()
    const pastorNombre = pastor || 'Pastor'
    const secretarioNombre = secretario || 'Secretario(a)'
    const testigoNombre = testigo || 'Líder'
    const fechaLarga = fechaFormateada(fecha)
    const win = openCertificacionWindow(miembro, logoUrl, pastorNombre, secretarioNombre, testigoNombre, fechaLarga, true, config)
    if (win) {
      setTimeout(() => { win.print(); setGenerandoCert(false) }, 1500)
    } else {
      setGenerandoCert(false)
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
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Testigo (Diácono)</label>
                  <select
                    value={testigo}
                    onChange={e => setTestigo(e.target.value)}
                    className="w-full rounded-xl border border-[#e0d8c8] bg-[#faf8f4] px-4 py-3 text-sm text-gray-800 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/30 focus:outline-none"
                  >
                    {diaconos.length === 0 && <option value="">No hay diáconos registrados</option>}
                    {diaconos.map(d => (
                      <option key={d.id} value={`${d.nombre} ${d.apellido}`}>{d.nombre} {d.apellido}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-[#f0e8d8] bg-[#faf8f4] p-5">
                <div className="mb-4 flex items-center justify-between border-b border-[#f0e8d8] pb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">Colores, bordes, tamaño y estilo</h3>
                    <p className="text-xs text-gray-400">Elige colores, tipo de borde, negritas y tamaño de las letras</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateConfig(DEFAULT_CONFIG)}
                    className="rounded-lg border border-[#e0d8c8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-amber-300 hover:text-amber-700"
                  >
                    Restablecer
                  </button>
                </div>

                <div className="mb-4 border-b border-[#f0e8d8] pb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600">Plantilla del diploma</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(TEMPLATES) as DiplomaConfig['template'][]).map(id => {
                      const active = config.template === id
                      const t = TEMPLATES[id]
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateConfig({ template: id })}
                          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                            active
                              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40'
                              : 'border-[#e0d8c8] bg-white hover:border-amber-300'
                          }`}
                        >
                          <span className={`text-sm font-bold ${active ? 'text-amber-700' : 'text-gray-700'}`}>{t.label}</span>
                          <span className="text-[11px] leading-snug text-gray-400">{t.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ColorField
                    label="Títulos, bordes y nombre de la iglesia"
                    value={config.colorTitulo}
                    onChange={v => updateConfig({ colorTitulo: v })}
                  />
                  <ColorField
                    label="Nombre del bautizado"
                    value={config.colorNombre}
                    onChange={v => updateConfig({ colorNombre: v })}
                  />
                  <ColorField
                    label="Texto del cuerpo y fechas"
                    value={config.colorTexto}
                    onChange={v => updateConfig({ colorTexto: v })}
                  />
                  <ColorField
                    label="Bordes y líneas decorativas"
                    value={config.colorBorde}
                    onChange={v => updateConfig({ colorBorde: v })}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Texto en negrita</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.negrita}
                      onClick={() => updateConfig({ negrita: !config.negrita })}
                      className={`relative h-7 w-12 rounded-full transition ${config.negrita ? 'bg-gradient-to-r from-amber-600 to-yellow-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${config.negrita ? 'left-6' : 'left-1'}`} />
                    </button>
                    <p className="mt-1 text-xs text-gray-400">{config.negrita ? 'Negrita activada' : 'Peso normal'}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Súper negrita</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.superNegrita}
                      onClick={() => updateConfig({ superNegrita: !config.superNegrita })}
                      className={`relative h-7 w-12 rounded-full transition ${config.superNegrita ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${config.superNegrita ? 'left-6' : 'left-1'}`} />
                    </button>
                    <p className="mt-1 text-xs text-gray-400">{config.superNegrita ? 'Letras aún más gruesas y llamativas' : 'Grosor normal'}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Tamaño del título</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={8}
                        max={60}
                        value={config.tamTitulo}
                        onChange={e => updateConfig({ tamTitulo: Math.max(8, Math.min(60, Number(e.target.value) || DEFAULT_CONFIG.tamTitulo)) })}
                        className="w-24 rounded-xl border border-[#e0d8c8] bg-white px-3 py-2 text-sm text-gray-800"
                      />
                      <span className="text-xs text-gray-400">pt</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Tamaño del nombre</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={16}
                        max={90}
                        value={config.tamNombre}
                        onChange={e => updateConfig({ tamNombre: Math.max(16, Math.min(90, Number(e.target.value) || DEFAULT_CONFIG.tamNombre)) })}
                        className="w-24 rounded-xl border border-[#e0d8c8] bg-white px-3 py-2 text-sm text-gray-800"
                      />
                      <span className="text-xs text-gray-400">pt</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Tamaño del texto del cuerpo</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={8}
                        max={40}
                        value={config.tamTexto}
                        onChange={e => updateConfig({ tamTexto: Math.max(8, Math.min(40, Number(e.target.value) || DEFAULT_CONFIG.tamTexto)) })}
                        className="w-24 rounded-xl border border-[#e0d8c8] bg-white px-3 py-2 text-sm text-gray-800"
                      />
                      <span className="text-xs text-gray-400">pt</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#f0e8d8] pt-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600">Tipo de letra del nombre del bautizado</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FUENTES_NOMBRE) as DiplomaConfig['fuenteNombre'][]).map(id => {
                      const active = config.fuenteNombre === id
                      const f = FUENTES_NOMBRE[id]
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateConfig({ fuenteNombre: id })}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                            active
                              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40'
                              : 'border-[#e0d8c8] bg-white hover:border-amber-300'
                          }`}
                        >
                          <span className="text-2xl leading-tight" style={{ fontFamily: f.family }}>Juan Pérez</span>
                          <span className={`text-[11px] font-semibold ${active ? 'text-amber-700' : 'text-gray-600'}`}>{f.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-5 border-t border-[#f0e8d8] pt-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600">Tipo de borde del marco</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    {Object.entries(TIPOS_BORDE).map(([id, b]) => {
                      const active = config.tipoBorde === id
                      const previewBorder = b.outer.replace(/var\(--c-borde\)/g, config.colorBorde)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateConfig({ tipoBorde: id })}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition ${
                            active
                              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40'
                              : 'border-[#e0d8c8] bg-white hover:border-amber-300'
                          }`}
                        >
                          <div className="relative h-7 w-full rounded-md" style={{ border: previewBorder }}>
                            {b.cornerShape === 'cross' && (
                              <>
                                <span className="absolute left-[1px] top-[1px] flex h-2 w-2 items-center justify-center">
                                  <span className="absolute h-[1.5px] w-2" style={{ background: config.colorBorde }} />
                                  <span className="absolute h-2 w-[1.5px]" style={{ background: config.colorBorde }} />
                                </span>
                                <span className="absolute right-[1px] top-[1px] flex h-2 w-2 items-center justify-center">
                                  <span className="absolute h-[1.5px] w-2" style={{ background: config.colorBorde }} />
                                  <span className="absolute h-2 w-[1.5px]" style={{ background: config.colorBorde }} />
                                </span>
                                <span className="absolute bottom-[1px] left-[1px] flex h-2 w-2 items-center justify-center">
                                  <span className="absolute h-[1.5px] w-2" style={{ background: config.colorBorde }} />
                                  <span className="absolute h-2 w-[1.5px]" style={{ background: config.colorBorde }} />
                                </span>
                                <span className="absolute bottom-[1px] right-[1px] flex h-2 w-2 items-center justify-center">
                                  <span className="absolute h-[1.5px] w-2" style={{ background: config.colorBorde }} />
                                  <span className="absolute h-2 w-[1.5px]" style={{ background: config.colorBorde }} />
                                </span>
                              </>
                            )}
                            {b.cornerShape === 'diamond' && (
                              <>
                                <span className="absolute left-[4px] top-[4px] h-1.5 w-1.5 rotate-45" style={{ background: config.colorBorde }} />
                                <span className="absolute right-[4px] top-[4px] h-1.5 w-1.5 rotate-45" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-[4px] left-[4px] h-1.5 w-1.5 rotate-45" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-[4px] right-[4px] h-1.5 w-1.5 rotate-45" style={{ background: config.colorBorde }} />
                              </>
                            )}
                            {b.cornerShape === 'bracket' && (
                              <>
                                <span className="absolute left-0 top-0 h-[2px] w-2.5" style={{ background: config.colorBorde }} />
                                <span className="absolute left-0 top-0 h-2.5 w-[2px]" style={{ background: config.colorBorde }} />
                                <span className="absolute right-0 top-0 h-[2px] w-2.5" style={{ background: config.colorBorde }} />
                                <span className="absolute right-0 top-0 h-2.5 w-[2px]" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-0 left-0 h-[2px] w-2.5" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-0 left-0 h-2.5 w-[2px]" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-0 right-0 h-[2px] w-2.5" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-0 right-0 h-2.5 w-[2px]" style={{ background: config.colorBorde }} />
                              </>
                            )}
                            {b.sideDots && (
                              <>
                                <span className="absolute left-1/2 top-[2px] h-[3px] w-[3px] -translate-x-1/2 rounded-full" style={{ background: config.colorBorde }} />
                                <span className="absolute bottom-[2px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full" style={{ background: config.colorBorde }} />
                                <span className="absolute left-[2px] top-1/2 h-[3px] w-[3px] -translate-y-1/2 rounded-full" style={{ background: config.colorBorde }} />
                                <span className="absolute right-[2px] top-1/2 h-[3px] w-[3px] -translate-y-1/2 rounded-full" style={{ background: config.colorBorde }} />
                              </>
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold ${active ? 'text-amber-700' : 'text-gray-600'}`}>{b.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-3">
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
                {tipoMiembro === 'existente' && miembro && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-[#e0d8c8] text-gray-700 shadow-sm hover:border-amber-300 hover:bg-amber-50/50"
                    disabled={generandoCert}
                    onClick={handlePrintCertificacion}
                  >
                    <ScrollText className="mr-2 h-4 w-4" />
                    {generandoCert ? 'Generando...' : 'Imprimir Certificación'}
                  </Button>
                )}
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
'use client'

export interface EnhanceOptions {
  maxDim?: number
  saturation?: number
  warmth?: number
  contrast?: number
}

const DEFAULT_OPTS: Required<EnhanceOptions> = {
  maxDim: 1600,
  saturation: 1.15,
  warmth: 1.03,
  contrast: 1.06,
}

function clamp(v: number, lo = 0, hi = 255) {
  return v < lo ? lo : v > hi ? hi : v
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('no-se-pudo-cargar')) }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('no-blob'))), type, quality)
  })
}

export async function enhanceImageBlob(file: File, opts: EnhanceOptions = {}): Promise<Blob> {
  const { maxDim, saturation, warmth, contrast } = { ...DEFAULT_OPTS, ...opts }

  const img = await loadImage(file)
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w === 0 || h === 0) throw new Error('imagen-invalida')

  const largest = Math.max(w, h)
  const scale = maxDimScale(largest, maxDim)
  w = Math.max(1, Math.round(w * scale))
  h = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no-canvas')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const px = imageData.data
  const total = px.length / 4

  // Auto contraste por canal (histograma, clip 1% / 99%)
  const hist: number[][] = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)]
  for (let i = 0; i < px.length; i += 4) {
    for (let c = 0; c < 3; c++) hist[c][px[i + c]]++
  }
  const lo: number[] = []
  const hi: number[] = []
  const clipLo = Math.floor(total * 0.01)
  const clipHi = Math.ceil(total * 0.99)
  for (let c = 0; c < 3; c++) {
    let acc = 0
    let minV = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[c][v]
      if (acc >= clipLo) { minV = v; break }
    }
    acc = 0
    let maxV = 255
    for (let v = 255; v >= 0; v--) {
      acc += hist[c][v]
      if (acc >= clipHi) { maxV = v; break }
    }
    lo.push(minV)
    hi.push(maxV)
  }

  const lumR = 0.2126
  const lumG = 0.7152
  const lumB = 0.0722
  const sat = saturation
  const invSat = 1 - sat

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i]
    let g = px[i + 1]
    let b = px[i + 2]

    // 1) estirar contraste por canal
    r = clamp(((r - lo[0]) / Math.max(1, hi[0] - lo[0])) * 255)
    g = clamp(((g - lo[1]) / Math.max(1, hi[1] - lo[1])) * 255)
    b = clamp(((b - lo[2]) / Math.max(1, hi[2] - lo[2])) * 255)

    // 2) contraste global suave alrededor del punto medio
    if (contrast !== 1) {
      r = clamp(((r - 128) * contrast) + 128)
      g = clamp(((g - 128) * contrast) + 128)
      b = clamp(((b - 128) * contrast) + 128)
    }

    // 3) saturación
    const lum = r * lumR + g * lumG + b * lumB
    r = clamp(lum * invSat + r * sat)
    g = clamp(lum * invSat + g * sat)
    b = clamp(lum * invSat + b * sat)

    // 4) tono cálido (sube rojos, baja azules)
    r = clamp(r * warmth)
    b = clamp(b / warmth)

    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
  }
  ctx.putImageData(imageData, 0, 0)

  // Nitidez suave (unsharp mask vía blur)
  sharpen(canvas, ctx, 0.45)

  // Exportar JPEG con calidad ajustada para caber en Firestore (< ~650 KB crudo)
  let quality = 0.92
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  while (blob.size > 650 * 1024 && quality > 0.55) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }
  return blob
}

function maxDimScale(largest: number, maxDim: number): number {
  if (largest <= maxDim) {
    // solo ampliar si la imagen es pequeña y no más de 2x
    return Math.min(maxDim / largest, 2)
  }
  // reducir grandes imágenes a maxDim para rendimiento y tamaño
  return maxDim / largest
}

function sharpen(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, amount: number) {
  const w = canvas.width
  const h = canvas.height

  const copy = document.createElement('canvas')
  copy.width = w
  copy.height = h
  const cctx = copy.getContext('2d')
  if (!cctx) return
  cctx.drawImage(canvas, 0, 0)

  const blur = document.createElement('canvas')
  blur.width = w
  blur.height = h
  const bctx = blur.getContext('2d')
  if (!bctx) return
  bctx.filter = 'blur(1px)'
  bctx.drawImage(copy, 0, 0)

  const orig = cctx.getImageData(0, 0, w, h).data
  const bl = bctx.getImageData(0, 0, w, h).data
  const out = new Uint8ClampedArray(orig.length)
  for (let i = 0; i < orig.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = orig[i + c] + (orig[i + c] - bl[i + c]) * amount
      out[i + c] = clamp(v)
    }
    out[i + 3] = 255
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0)
}

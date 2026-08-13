'use client'

import { useState, useEffect } from 'react'
import { getPortada } from '@/lib/portada'

interface Props {
  position: 'top' | 'bottom'
}

export function PortadaBanner({ position }: Props) {
  const [imagenUrl, setImagenUrl] = useState('')
  const [ratio, setRatio] = useState<string | null>(null)

  useEffect(() => {
    getPortada().then(cfg => {
      if (cfg?.imagenUrl) setImagenUrl(cfg.imagenUrl)
    })
  }, [])

  useEffect(() => {
    if (!imagenUrl) return
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w > 0 && h > 0) setRatio(`${w} / ${h / 2}`)
    }
    img.src = imagenUrl
  }, [imagenUrl])

  if (!imagenUrl || !ratio) return null

  return (
    <div style={{ width: '100%', aspectRatio: ratio, overflow: 'hidden', background: '#000' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagenUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: position === 'top' ? 'center top' : 'center bottom',
        }}
      />
    </div>
  )
}

'use client'

import Image from 'next/image'
import logoSrc from '@/../public/logo.png'

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 4.3) % 100}%`,
  top: `${60 + (i * 3.7) % 40}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.25) % 5}s`,
  duration: `${3 + (i % 4)}s`,
}))

export function PreStream({ mensaje }: { mensaje?: string }) {
  return (
    <div className="relative flex h-80 w-full max-w-xl items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-dark via-dark-light to-dark isolate">
      {/* particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 ? 'rgba(218,165,32,0.6)' : p.id % 3 === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(239,68,68,0.4)',
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* glow rings */}
      <div className="glow-ring" style={{ width: 220, height: 220, animationDelay: '0s' }} />
      <div className="glow-ring" style={{ width: 300, height: 300, animationDelay: '1s' }} />
      <div className="glow-ring" style={{ width: 380, height: 380, animationDelay: '2s' }} />

      {/* logo 3d */}
      <div className="scale-[2.5] md:scale-[3]">
        <span className="logo-wrapper" style={{ perspective: '600px' }}>
          <Image src={logoSrc} alt="IESFuego" width={120} height={120} className="logo-spin h-24 w-24 object-contain" style={{ filter: 'drop-shadow(0 0 20px rgba(218,165,32,0.5))' }} />
        </span>
      </div>

      {/* message */}
      <div className="absolute bottom-6 left-0 right-0 text-center px-4">
        <p className="text-sm font-bold text-primary-light animate-pulse tracking-widest uppercase">
          Próximamente en vivo
        </p>
        {mensaje && (
          <p className="mt-1.5 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}

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
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-dark via-dark-light to-dark isolate w-full" style={{ minHeight: 450 }}>
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
      <div className="glow-ring" style={{ width: 200, height: 200, animationDelay: '0s' }} />
      <div className="glow-ring" style={{ width: 280, height: 280, animationDelay: '1s' }} />
      <div className="glow-ring" style={{ width: 360, height: 360, animationDelay: '2s' }} />

      {/* logo 3d */}
      <div className="scale-[1.8] md:scale-[2.2] mb-6">
        <span className="logo-wrapper" style={{ perspective: '600px' }}>
          <Image src={logoSrc} alt="IESFuego" width={120} height={120} className="logo-spin h-24 w-24 object-contain" style={{ filter: 'drop-shadow(0 0 20px rgba(218,165,32,0.5))' }} />
        </span>
      </div>

      {/* message below logo */}
      <p className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase text-center px-4 drop-shadow-lg">
        Próximamente en vivo
      </p>
      {mensaje && (
        <p className="mt-2 text-sm md:text-base text-white/80 font-semibold max-w-md mx-auto text-center px-4 leading-relaxed drop-shadow">
          {mensaje}
        </p>
      )}
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AdminDashboard() {
  const router = useRouter()
  const { puede } = useAuth()

  useEffect(() => {
    const sections: { key: Parameters<typeof puede>[0]; href: string }[] = [
      { key: 'caja', href: '/admin/caja' },
      { key: 'actividades', href: '/admin/actividades' },
      { key: 'cultos', href: '/admin/cultos' },
      { key: 'envivo', href: '/admin/en-vivo' },
      { key: 'usuarios', href: '/admin/usuarios' },
    ]
    for (const s of sections) {
      if (puede(s.key, 'ver')) {
        router.replace(s.href)
        return
      }
    }
  }, [router, puede])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gold-accent shadow-lg shadow-primary/20">
          <span className="text-3xl font-black text-white" style={{ fontFamily: "'Times New Roman', serif" }}>ESF</span>
        </div>
        <h1 className="text-xl font-bold text-dark">Bienvenido</h1>
        <p className="mt-1 text-sm text-gray-500">No tienes acceso a ninguna sección.</p>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, Tv, DollarSign, LogOut,
  Church, Menu, X, Wifi, Shield, Users, BarChart3,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { auditLog } from '@/lib/audit'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout, puede } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const homeHref = useMemo(() => {
    const sections: { key: Parameters<typeof puede>[0]; href: string }[] = [
      { key: 'caja', href: '/admin/caja' },
      { key: 'actividades', href: '/admin/actividades' },
      { key: 'cultos', href: '/admin/cultos' },
      { key: 'noticias', href: '/admin/noticias' },
      { key: 'envivo', href: '/admin/en-vivo' },
      { key: 'usuarios', href: '/admin/usuarios' },
    ]
    for (const s of sections) {
      if (puede(s.key, 'ver')) return s.href
    }
    return '/admin/dashboard'
  }, [puede])

  // audit log on sensitive sections
  useEffect(() => {
    if (!user) return
    const sensitive: Record<string, string> = {
      '/admin/caja': 'Caja',
      '/admin/miembros': 'Miembros',
      '/admin/usuarios': 'Usuarios',
    }
    for (const [path, label] of Object.entries(sensitive)) {
      if (pathname.startsWith(path)) {
        auditLog(label, 'acceder', user.nombre, `Accedió a ${label}`)
        break
      }
    }
  }, [pathname, user])

  if (pathname === '/login') return <>{children}</>

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  const navItems = [
    { href: '/admin/actividades', label: 'Actividades', icon: CalendarDays, permiso: 'actividades' as const },
    { href: '/admin/cultos', label: 'Cultos', icon: Tv, permiso: 'cultos' as const },
    { href: '/admin/noticias', label: 'Noticias', icon: CalendarDays, permiso: 'noticias' as const },
    { href: '/admin/en-vivo', label: 'En Vivo', icon: Wifi, permiso: 'envivo' as const },
    { href: '/admin/caja', label: 'Caja', icon: DollarSign, permiso: 'caja' as const },
    { href: '/admin/dashboard', label: 'Estadísticas', icon: BarChart3, permiso: 'caja' as const },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-dark text-white transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <Link href={homeHref} className="flex items-center gap-2">
            <Church className="h-6 w-6 text-primary-light" />
            <span className="font-bold">IESFuego Admin</span>
          </Link>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-700 px-5 py-3 text-xs text-gray-400">
          {user.nombre} <span className="text-primary-light">({user.role})</span>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            if (item.permiso && !puede(item.permiso, 'ver')) return null
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          {user?.role !== 'visual' && (
            <Link
              href="/admin/miembros"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                pathname.startsWith('/admin/miembros')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Users className="h-5 w-5" /> Miembros
            </Link>
          )}

          {puede('usuarios', 'ver') && (
            <Link
              href="/admin/usuarios"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                pathname.startsWith('/admin/usuarios')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Shield className="h-5 w-5" /> Usuarios
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" /> Cerrar Sesión
          </button>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-white px-6 py-3">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="ml-auto text-xs text-gray-500 underline hover:text-primary">
            Ver sitio público →
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

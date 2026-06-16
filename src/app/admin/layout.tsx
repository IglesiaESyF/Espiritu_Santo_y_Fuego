'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, Tv, DollarSign, LogOut,
  Church, Menu, X, Wifi, Shield,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout, puede } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === '/login') return <>{children}</>

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permiso: null },
    { href: '/admin/actividades', label: 'Actividades', icon: CalendarDays, permiso: 'actividades' as const },
    { href: '/admin/cultos', label: 'Cultos', icon: Tv, permiso: 'cultos' as const },
    { href: '/admin/en-vivo', label: 'En Vivo', icon: Wifi, permiso: 'envivo' as const },
    { href: '/admin/caja', label: 'Caja', icon: DollarSign, permiso: 'caja' as const },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-dark text-white transition-transform md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
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

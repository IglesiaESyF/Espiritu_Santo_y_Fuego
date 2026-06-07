'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Cross as CrossIcon, Lock } from 'lucide-react'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/cultos', label: 'Cultos' },
  { href: '/actividades', label: 'Actividades' },
  { href: '/en-vivo', label: 'En Vivo' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname.startsWith('/admin')) return null

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <CrossIcon className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-dark">
            IES<span className="text-primary">Fuego</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                pathname === l.href
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
          >
            <Lock className="h-3.5 w-3.5" /> Identifícate
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-primary/10 bg-white md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium ${
                pathname === l.href ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-primary"
          >
            <Lock className="h-4 w-4" /> Identifícate
          </Link>
        </div>
      )}
    </header>
  )
}

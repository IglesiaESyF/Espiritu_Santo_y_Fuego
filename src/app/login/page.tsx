'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, Eye, EyeOff, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, login, seedInitialAdmin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    seedInitialAdmin()
  }, [seedInitialAdmin])

  useEffect(() => {
    if (user) router.replace('/admin/dashboard')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await login(username, password)
    if (!ok) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark via-dark-light to-dark p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Flame className="mx-auto mb-4 h-12 w-12 text-primary-light animate-pulse" />
          <h1 className="text-2xl font-bold text-white">IESFuego Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Inicia sesión para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              <User className="mr-1 inline h-3.5 w-3.5" /> Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="Ingresa tu usuario"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Lock className="mr-1 inline h-3.5 w-3.5" /> Contraseña
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-9 text-gray-400 hover:text-white"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <Link href="/" className="block text-center text-xs text-gray-500 hover:text-primary-light">
            ← Volver al sitio público
          </Link>
        </form>
      </div>
    </div>
  )
}

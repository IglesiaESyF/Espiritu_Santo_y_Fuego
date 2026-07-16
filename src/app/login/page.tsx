'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, Eye, EyeOff, User, Lock, Search, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

type Paso = 'login' | 'buscar' | 'recuperar' | 'listo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, login, seedInitialAdmin, resetAdminPassword, findUserByNombre, changePassword } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paso, setPaso] = useState<Paso>('login')
  const [nombreBusqueda, setNombreBusqueda] = useState('')
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<{ username: string; nombre: string } | null>(null)
  const [pin, setPin] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [nuevaPass, setNuevaPass] = useState('')
  const [nuevaPass2, setNuevaPass2] = useState('')
  const [passMsg, setPassMsg] = useState('')

  useEffect(() => { seedInitialAdmin() }, [seedInitialAdmin])
  useEffect(() => { if (user) router.replace('/admin/dashboard') }, [user, router])

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

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMsg('')
    setUsuarioEncontrado(null)
    const u = await findUserByNombre(nombreBusqueda)
    if (u) {
      setUsuarioEncontrado(u)
      setPaso('recuperar')
    } else {
      setResetMsg('No se encontró ningún usuario con ese nombre. Verifica e intenta de nuevo.')
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMsg('')
    if (!usuarioEncontrado) return
    const ok = await resetAdminPassword(pin, usuarioEncontrado.username)
    if (ok) {
      setPaso('listo')
      setPin('')
    } else {
      setResetMsg('PIN incorrecto. Intenta de nuevo.')
    }
  }

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg('')
    if (nuevaPass.length < 6) { setPassMsg('La contraseña debe tener al menos 6 caracteres.'); return }
    if (nuevaPass !== nuevaPass2) { setPassMsg('Las contraseñas no coinciden.'); return }
    if (!user) return
    const ok = await changePassword(user.id, nuevaPass)
    if (ok) {
      setPassMsg('Contraseña cambiada exitosamente.')
      setNuevaPass(''); setNuevaPass2('')
      setCambiandoPass(false)
    } else {
      setPassMsg('Error al cambiar la contraseña.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark via-dark-light to-dark p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Flame className="mx-auto mb-4 h-12 w-12 text-primary-light animate-pulse" />
          <h1 className="text-2xl font-bold text-white">IESFuego Admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            {paso === 'buscar' ? 'Recuperar tu cuenta' :
             paso === 'recuperar' ? 'Restablecer contraseña' :
             paso === 'listo' ? 'Contraseña restablecida' :
             'Inicia sesión para acceder'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">

          {paso === 'login' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <User className="mr-1 inline h-3.5 w-3.5" /> Usuario
                </label>
                <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="Ingresa tu usuario"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" autoFocus required />
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Lock className="mr-1 inline h-3.5 w-3.5" /> Contraseña
                </label>
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Ingresa tu contraseña"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-center text-sm text-red-400">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </Button>
              <button type="button" onClick={() => { setPaso('buscar'); setResetMsg('') }}
                className="block w-full text-center text-xs text-gray-500 hover:text-primary-light transition">
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {paso === 'buscar' && (
            <>
              <p className="text-xs text-gray-400">Ingresa tu <strong>nombre completo</strong> para buscar tu usuario:</p>
              <div className="flex gap-2">
                <input type="text" value={nombreBusqueda} onChange={e => setNombreBusqueda(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" autoFocus required />
                <button type="button" onClick={handleBuscar}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition">
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {resetMsg && <p className="text-center text-sm text-red-400">{resetMsg}</p>}
              <button type="button" onClick={() => setPaso('login')}
                className="block w-full text-center text-xs text-gray-500 hover:text-primary-light transition">
                ← Volver al inicio de sesión
              </button>
            </>
          )}

          {paso === 'recuperar' && usuarioEncontrado && (
            <>
              <div className="rounded-xl bg-green-900/20 p-3 text-center">
                <p className="text-xs text-gray-400">Usuario encontrado:</p>
                <p className="text-lg font-bold text-green-400">{usuarioEncontrado.username}</p>
                <p className="text-xs text-gray-500">{usuarioEncontrado.nombre}</p>
              </div>
              <p className="text-xs text-gray-400">Ingresa el PIN de recuperación para restablecer tu contraseña a <strong>admin123</strong>:</p>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                placeholder="PIN de recuperación (1234)"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" required />
              {resetMsg && <p className="text-center text-sm text-red-400">{resetMsg}</p>}
              <div className="flex gap-2">
                <Button type="button" onClick={handleReset} variant="primary" size="md" className="flex-1">Restablecer</Button>
                <button type="button" onClick={() => { setPaso('buscar'); setUsuarioEncontrado(null) }}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/20 transition">Cancelar</button>
              </div>
            </>
          )}

          {paso === 'listo' && (
            <>
              <div className="text-center">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-400" />
                <p className="text-sm text-gray-300">Contraseña restablecida a <strong className="text-white">admin123</strong></p>
                <p className="mt-1 text-xs text-gray-500">para el usuario <strong>{usuarioEncontrado?.username}</strong></p>
              </div>
              <Button type="button" variant="primary" size="lg" className="w-full"
                onClick={() => { setPaso('login'); setUsername(usuarioEncontrado?.username || ''); setPassword('admin123') }}>
                Iniciar sesión ahora
              </Button>
            </>
          )}

          <Link href="/" className="block text-center text-xs text-gray-500 hover:text-primary-light">
            ← Volver al sitio público
          </Link>
        </form>

        {/* Cambiar contraseña después de iniciar sesión */}
        {user && !cambiandoPass && (
          <div className="mt-4 text-center">
            <button onClick={() => setCambiandoPass(true)}
              className="text-xs text-gray-500 hover:text-primary-light transition">
              Cambiar contraseña
            </button>
          </div>
        )}

        {user && cambiandoPass && (
          <form onSubmit={handleChangePass} className="mt-4 space-y-3 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold text-gray-400">Cambiar contraseña</p>
            <input type="password" value={nuevaPass} onChange={e => setNuevaPass(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" required />
            <input type="password" value={nuevaPass2} onChange={e => setNuevaPass2(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none" required />
            {passMsg && <p className={`text-center text-sm ${passMsg.includes('exitosamente') ? 'text-green-400' : 'text-red-400'}`}>{passMsg}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="md" className="flex-1">Guardar</Button>
              <button type="button" onClick={() => { setCambiandoPass(false); setPassMsg('') }}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/20 transition">Cancelar</button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
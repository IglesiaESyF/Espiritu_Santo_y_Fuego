'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PIN = '1234'

export default function AdminLoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      localStorage.setItem('iesfuego-admin', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('PIN incorrecto')
      setPin('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark via-dark-light to-dark p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Flame className="mx-auto mb-4 h-12 w-12 text-primary-light animate-pulse" />
          <h1 className="text-2xl font-bold text-white">IESFuego Admin</h1>
          <p className="mt-1 text-sm text-gray-400">Ingresa tu PIN para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <div className="relative">
            <Input
              label="PIN de acceso"
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError('') }}
              placeholder="Ingresa tu PIN"
              maxLength={4}
              className="bg-white/5 text-white placeholder:text-gray-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-9 text-gray-400 hover:text-white"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Ingresar
          </Button>

          <Link href="/" className="block text-center text-xs text-gray-500 hover:text-primary-light">
            ← Volver al sitio público
          </Link>
        </form>
      </div>
    </div>
  )
}

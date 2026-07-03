'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { db } from './firebase'
import { collection, doc, getDocs, setDoc, getDoc, query, where, Timestamp } from 'firebase/firestore'
import { hashPassword } from './hash'
import type { User, Permisos, UserRole, PermisosSeccion } from '@/types'
import { ROLES_PRESET } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  puede: (section: keyof Permisos, action: string) => boolean
  seedInitialAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  puede: () => false,
  seedInitialAdmin: async () => {},
})

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 min

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('iesfuego-auth')
    const loginTime = localStorage.getItem('iesfuego-login-time')
    if (stored && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10)
      if (elapsed > SESSION_TIMEOUT) {
        localStorage.removeItem('iesfuego-auth')
        localStorage.removeItem('iesfuego-login-time')
        router.push('/login')
        setLoading(false)
        return
      }
      try {
        setUser(JSON.parse(stored) as User)
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [router])

  // reset timeout on user activity
  useEffect(() => {
    if (!user) return
    function refresh() {
      localStorage.setItem('iesfuego-login-time', String(Date.now()))
    }
    window.addEventListener('click', refresh)
    window.addEventListener('keydown', refresh)
    return () => {
      window.removeEventListener('click', refresh)
      window.removeEventListener('keydown', refresh)
    }
  }, [user])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'usuarios'), where('username', '==', username), where('activo', '==', true))
      const snap = await getDocs(q)
      if (snap.empty) return false
      const docData = snap.docs[0]
      const data = docData.data() as Omit<User, 'id'>
      const hash = await hashPassword(password)
      if (data.passwordHash !== hash) return false
      const foundUser: User = { id: docData.id, ...data }
      localStorage.setItem('iesfuego-auth', JSON.stringify(foundUser))
      localStorage.setItem('iesfuego-login-time', String(Date.now()))
      setUser(foundUser)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('iesfuego-auth')
    localStorage.removeItem('iesfuego-login-time')
    setUser(null)
    router.push('/login')
  }, [router])

  const puede = useCallback((section: keyof Permisos, action: string): boolean => {
    if (!user) return false
    if (user.role === 'it-admin') return true
    const perms = user.permisos[section]
    if (!perms) return false
    return (perms as Record<string, boolean>)[action] ?? false
  }, [user])

  const seedInitialAdmin = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'usuarios'))
      if (!snap.empty) return
      const hash = await hashPassword('admin123')
      const permisos = ROLES_PRESET['it-admin']
      await setDoc(doc(collection(db, 'usuarios')), {
        username: 'admin',
        passwordHash: hash,
        nombre: 'Administrador IT',
        role: 'it-admin',
        permisos,
        activo: true,
        creadoEn: Date.now(),
      })
    } catch { /* ignore — Firestore may not exist yet */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, puede, seedInitialAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'iesfuego-admin'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setIsAuthenticated(true)
    setLoading(false)
  }, [])

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234'

  const login = useCallback((pin: string) => {
    if (pin === adminPin) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, loading, login, logout }
}

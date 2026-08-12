// ============================================================
// Breachwyre - Auth Context
// Global authentication state management via React Context
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Rehydrate session on mount ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('bw_token')
    const storedUser = localStorage.getItem('bw_user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('bw_token')
        localStorage.removeItem('bw_user')
      }
    }
    setLoading(false)
  }, [])

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user: userData } = res.data
    localStorage.setItem('bw_token', token)
    localStorage.setItem('bw_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  // ── Register ────────────────────────────────────────────
  const register = useCallback(async (name, email, password, role = 'user') => {
    const res = await authAPI.register({ name, email, password, role })
    const { token, user: userData } = res.data
    localStorage.setItem('bw_token', token)
    localStorage.setItem('bw_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('bw_token')
    localStorage.removeItem('bw_user')
    setUser(null)
  }, [])

  const isExpert = user?.role === 'expert' || user?.role === 'admin'
  const isAdmin  = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isExpert, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

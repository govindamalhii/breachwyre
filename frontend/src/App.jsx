// ============================================================
// Breachwyre - App Router
// React Router v6 with protected routes and auth-aware routing
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Home      from './pages/Home'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'

// ── Protected Route Guard ────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-10 h-10 border-3" />
          <p className="text-cyber-muted text-sm font-mono animate-pulse">
            Authenticating session...
          </p>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

// ── Public Route Guard (redirect if already logged in) ───
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// ── Root App ─────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          {/* Protected Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

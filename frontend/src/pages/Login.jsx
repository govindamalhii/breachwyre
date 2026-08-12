// ============================================================
// Breachwyre - Login / Register Page
// Unified auth page with tabs for Sign In and Register
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()

  // ── State ─────────────────────────────────────────────
  const [tab, setTab]         = useState(searchParams.get('tab') === 'register' ? 'register' : 'login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'user' })

  // ── Helpers ────────────────────────────────────────────
  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.name.trim()) return setError('Full name is required.')
        if (form.password.length < 8) return setError('Password must be at least 8 characters.')
        await register(form.name, form.email, form.password, form.role)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex">
      {/* ── Left Panel: Branding ───────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-surface to-cyber-dark" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Shield size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-cyber-text">
              Breach<span className="text-gradient-cyan">wyre</span>
            </span>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl font-display font-bold text-cyber-text leading-tight mb-6">
            Incident Response<br />
            <span className="text-gradient-cyan">Powered by AI</span>
          </h2>
          <p className="text-cyber-muted text-sm leading-relaxed max-w-sm">
            Enterprise-grade cyber incident response platform with cryptographic evidence preservation and expert triage routing.
          </p>
        </div>

        {/* Security Indicators */}
        <div className="relative space-y-3">
          {[
            { icon: Lock,   text: 'AES-256 encryption at rest' },
            { icon: Shield, text: 'TLS 1.3 in transit' },
            { icon: User,   text: 'JWT + RBAC access control' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon size={14} className="text-emerald-400" />
              </div>
              <span className="text-xs text-cyber-muted">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Auth Form ─────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-text transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-cyber-text">
              Breach<span className="text-gradient-cyan">wyre</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-cyber-text mb-2">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-cyber-muted text-sm">
              {tab === 'login'
                ? 'Sign in to access your incident dashboard'
                : 'Register to report and track cyber incidents'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl border border-cyber-border bg-cyber-surface/50 p-1 mb-8">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                  tab === t
                    ? 'bg-cyber-card text-cyber-text shadow-sm border border-cyber-border/60'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-5"
              id="auth-form"
            >
              {/* Name Field (Register only) */}
              {tab === 'register' && (
                <div>
                  <label className="input-label">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted" />
                    <input
                      id="register-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={update('name')}
                      className="input-field pl-11"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={update('email')}
                    className="input-field pl-11"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-muted" />
                  <input
                    id="auth-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder={tab === 'register' ? 'Minimum 8 characters' : '••••••••'}
                    value={form.password}
                    onChange={update('password')}
                    className="input-field pl-11 pr-12"
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    minLength={tab === 'register' ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role Selector (Register only) */}
              {tab === 'register' && (
                <div>
                  <label className="input-label">Account Type</label>
                  <select
                    id="register-role"
                    value={form.role}
                    onChange={update('role')}
                    className="select-field"
                  >
                    <option value="user">Incident Reporter (Victim / User)</option>
                    <option value="expert">Cyber Expert / Incident Responder</option>
                  </select>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                id="auth-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3.5 text-base"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              {/* Security note */}
              <p className="text-xs text-cyber-muted text-center">
                <Lock size={10} className="inline mr-1" />
                Secured with AES-256 encryption and TLS 1.3
              </p>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

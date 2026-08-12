// ============================================================
// Breachwyre - Dashboard Page
// Role-aware shell that renders UserDashboard or ExpertDashboard
// with sidebar navigation, user profile, and logout.
// ============================================================
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, FileText, Users,
  Settings, LogOut, Bell, ChevronDown, Menu, X,
  Activity, Lock, Brain
} from 'lucide-react'
import { useAuth } from '../AuthContext'
import UserDashboard   from '../components/UserDashboard'
import ExpertDashboard from '../components/ExpertDashboard'

// ── Sidebar nav items per role ─────────────────────────────
const USER_NAV = [
  { id: 'overview',  label: 'My Incidents',  icon: LayoutDashboard },
]

const EXPERT_NAV = [
  { id: 'queue',     label: 'Triage Queue',  icon: Activity },
  { id: 'overview',  label: 'My Incidents',  icon: FileText },
]

// ── Sidebar Component ──────────────────────────────────────
function Sidebar({ activeTab, onTabChange, collapsed, onCollapse }) {
  const { user, logout, isExpert } = useAuth()
  const navItems = isExpert ? EXPERT_NAV : USER_NAV

  const roleLabel = {
    user:   'Incident Reporter',
    expert: 'Cyber Expert',
    admin:  'Administrator',
  }[user?.role] || 'User'

  const roleColor = {
    user:   'text-cyan-400',
    expert: 'text-violet-400',
    admin:  'text-amber-400',
  }[user?.role] || 'text-cyan-400'

  return (
    <aside className={`sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-cyber-border/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg text-cyber-text">
            Breach<span className="text-gradient-cyan">wyre</span>
          </span>
        )}
        <button
          onClick={onCollapse}
          className="ml-auto text-cyber-muted hover:text-cyber-text transition-colors p-1 rounded"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-b border-cyber-border/40 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`
            w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
            ${user?.role === 'expert' || user?.role === 'admin'
              ? 'bg-violet-500/20 border-2 border-violet-500/40 text-violet-400'
              : 'bg-cyan-500/20 border-2 border-cyan-500/40 text-cyan-400'
            }
          `}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-cyber-text truncate">{user?.name}</p>
              <p className={`text-xs ${roleColor}`}>{roleLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full nav-link ${activeTab === id ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Security indicators (non-collapsed only) */}
      {!collapsed && (
        <div className="p-4 border-t border-cyber-border/40">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-cyber-muted">Defense-in-Depth Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={10} className="text-emerald-400" />
              <span className="text-xs text-cyber-muted">AES-256 · TLS 1.3 · JWT</span>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className={`p-3 border-t border-cyber-border/40 ${collapsed ? 'px-3' : ''}`}>
        <button
          onClick={logout}
          className={`w-full nav-link text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title="Sign out"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}

// ── Top Bar ────────────────────────────────────────────────
function TopBar({ activeTab }) {
  const { user, isExpert } = useAuth()
  const pageTitle = {
    overview: 'My Incidents',
    queue:    'Triage Queue',
  }[activeTab] || 'Dashboard'

  return (
    <header className="h-16 border-b border-cyber-border/50 bg-cyber-darker/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-sm font-semibold text-cyber-text">{pageTitle}</h2>
        <p className="text-xs text-cyber-muted">Breachwyre · Secure Incident Response</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Role indicator */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          isExpert
            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        }`}>
          {isExpert ? <Brain size={11} /> : <Shield size={11} />}
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
        </div>

        {/* Notifications placeholder */}
        <button className="relative w-9 h-9 rounded-lg border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-text hover:border-cyber-glow/30 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}

// ── Main Dashboard Page ────────────────────────────────────
export default function Dashboard() {
  const { isExpert } = useAuth()
  const [activeTab, setActiveTab] = useState(isExpert ? 'queue' : 'overview')
  const [collapsed, setCollapsed] = useState(false)

  // Content rendering based on active tab + role
  const renderContent = () => {
    if (activeTab === 'queue' && isExpert) return <ExpertDashboard />
    return <UserDashboard />
  }

  return (
    <div className="flex h-screen bg-cyber-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={collapsed}
        onCollapse={() => setCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar activeTab={activeTab} />

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="max-w-6xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

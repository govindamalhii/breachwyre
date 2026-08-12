// ============================================================
// Breachwyre - Home Page
// Landing page with Hero, Features, and CTA sections
// ============================================================
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, Zap, Lock, Brain, ArrowRight, CheckCircle,
  Activity, Globe, Database, AlertTriangle, ChevronRight,
  Eye, FileSearch, Users
} from 'lucide-react'

// ── Animation Variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}

// ── Stat Card Component ───────────────────────────────────
function StatCard({ value, label, icon: Icon, color }) {
  return (
    <motion.div variants={fadeUp} className="glass-card p-6 text-center">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="text-3xl font-display font-bold text-cyber-text">{value}</div>
      <div className="text-sm text-cyber-muted mt-1">{label}</div>
    </motion.div>
  )
}

// ── Feature Card Component ────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-card-hover p-6 group"
      whileHover={{ scale: 1.02 }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold text-cyber-text mb-2">{title}</h3>
      <p className="text-sm text-cyber-muted leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ── Main Home Page ────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Zap, color: 'bg-cyan-500/15 text-cyan-400',
      title: 'Instant AI Triage',
      description: 'AI-powered severity scoring classifies incidents as Critical, High, Medium, or Low in milliseconds with confidence percentages and containment recommendations.',
    },
    {
      icon: Lock, color: 'bg-violet-500/15 text-violet-400',
      title: 'Cryptographic Evidence Preservation',
      description: 'SHA-256 fingerprinting of every uploaded file guarantees forensic chain-of-custody integrity, independently verifiable with included Java CLI tools.',
    },
    {
      icon: Brain, color: 'bg-amber-500/15 text-amber-400',
      title: 'Expert Routing & Triage Queue',
      description: 'Certified incident responders receive priority-sorted queues with full forensic context, cryptographic hashes, AI classification, and expert note collaboration.',
    },
    {
      icon: Shield, color: 'bg-emerald-500/15 text-emerald-400',
      title: 'OWASP Defense-in-Depth',
      description: 'Hardened from line one: parameterized queries, Argon2 password hashing, JWT RBAC, rate limiting, Helmet.js CSP headers, and AES-256 encryption at rest.',
    },
    {
      icon: Activity, color: 'bg-red-500/15 text-red-400',
      title: 'Live Incident Tracking',
      description: 'Victims monitor their incident status in real-time through a visual timeline: Submitted → AI Triaged → Expert Assigned → Actively Investigated → Resolved.',
    },
    {
      icon: FileSearch, color: 'bg-blue-500/15 text-blue-400',
      title: 'Forensic Java CLI Tools',
      description: 'Standalone JDK 17 utilities for independent SHA-256 hash verification and log security auditing — no platform dependency required.',
    },
  ]

  const stats = [
    { value: '<2s',    label: 'AI Triage Time',        icon: Zap,    color: 'bg-cyan-500/15 text-cyan-400' },
    { value: 'SHA-256',label: 'Evidence Fingerprinting',icon: Lock,   color: 'bg-violet-500/15 text-violet-400' },
    { value: 'AES-256',label: 'Encryption at Rest',     icon: Shield, color: 'bg-emerald-500/15 text-emerald-400' },
    { value: 'OWASP',  label: 'Top 10 Mitigated',      icon: Eye,    color: 'bg-amber-500/15 text-amber-400' },
  ]

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="border-b border-cyber-border/50 bg-cyber-darker/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-cyber-text">
              Breach<span className="text-gradient-cyan">wyre</span>
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-cyber-muted hover:text-cyber-text transition-colors">Features</a>
            <a href="#security"  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors">Security</a>
            <a href="#forensics" className="text-sm text-cyber-muted hover:text-cyber-text transition-colors">Forensics</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2 px-4">
              Sign In
            </button>
            <button
              onClick={() => navigate('/login?tab=register')}
              className="btn-primary text-sm py-2 px-4"
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-cyan-500/3 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-5xl mx-auto text-center relative"
        >
          {/* Alert Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/8 mb-8">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-ping-slow" />
            <span className="text-xs font-semibold text-red-400 tracking-wider uppercase">
              Enterprise Cyber Incident Response Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-display font-black text-cyber-text leading-[1.08] mb-6">
            Breach Response,{' '}
            <br />
            <span className="text-gradient-cyan">Redefined by AI</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-cyber-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            When a cyberattack hits, every second counts. Breachwyre delivers instant AI triage,
            cryptographic evidence preservation, and expert responder routing — all from a single,
            hardened platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/login?tab=register')}
              className="btn-danger text-base py-4 px-8 shadow-glow-red animate-pulse-glow"
            >
              <AlertTriangle size={20} />
              Report an Incident
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost text-base py-4 px-8"
            >
              Expert Sign In <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* Stats Row */}
          <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold text-cyan-400 tracking-widest uppercase mb-4">Platform Capabilities</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-display font-bold text-cyber-text mb-4">
              Built for the Worst Case Scenario
            </motion.h2>
            <motion.p variants={fadeUp} className="text-cyber-muted max-w-xl mx-auto">
              Every feature designed for one purpose: getting your organization from breach to resolution faster than ever before.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </motion.div>
        </div>
      </section>

      {/* ── Security Section ─────────────────────────────── */}
      <section id="security" className="py-24 px-6 border-t border-cyber-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <motion.p variants={fadeUp} className="text-xs font-semibold text-violet-400 tracking-widest uppercase mb-4">Security Architecture</motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl font-display font-bold text-cyber-text mb-6">
                Hardened Against<br />
                <span className="text-gradient-purple">OWASP Top 10</span>
              </motion.h2>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  'A01: Broken Access Control → JWT RBAC with role enforcement',
                  'A03: Injection → Parameterized SQL with mysql2 prepared statements',
                  'A04: Insecure Design → UUID file renaming + SHA-256 pre-storage',
                  'A07: Auth Failures → bcrypt salt-12, rate-limited login (5/15min)',
                  'A05: Security Misconfiguration → Helmet.js CSP, HSTS, X-Frame-Options',
                  'Transit Security → TLS 1.3 enforcement, HttpOnly/SameSite cookies',
                ].map((item) => (
                  <motion.div key={item} variants={fadeUp} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-cyber-muted font-mono">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="glass-card p-8" id="forensics">
              <div className="flex items-center gap-3 mb-6">
                <Database size={20} className="text-cyan-400" />
                <h3 className="font-display font-bold text-cyber-text text-lg">Forensic Evidence Integrity</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Evidence Hash Algorithm',  value: 'SHA-256 (streaming, FIPS 180-4)' },
                  { label: 'Password Hashing',         value: 'bcrypt / Argon2 (cost factor 12)' },
                  { label: 'Encryption at Rest',       value: 'AES-256-GCM (per-file IV)' },
                  { label: 'Session Management',       value: 'JWT RS256 + Redis blacklist' },
                  { label: 'File Upload Security',     value: 'UUID rename + MIME type validation' },
                  { label: 'Independent Verification', value: 'Java CLI FileVerifier.java (JDK 17)' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-cyber-border/40 last:border-0">
                    <span className="text-xs text-cyber-muted">{label}</span>
                    <span className="text-xs font-mono text-cyan-400">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <h2 className="text-4xl font-display font-bold text-cyber-text mb-4 relative">
              Ready to Respond?
            </h2>
            <p className="text-cyber-muted mb-8 relative max-w-xl mx-auto">
              Join enterprises securing their breach response with Breachwyre's AI-native platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
              <button onClick={() => navigate('/login?tab=register')} className="btn-danger py-4 px-8">
                <AlertTriangle size={20} /> Report Incident Now
              </button>
              <button onClick={() => navigate('/login')} className="btn-primary py-4 px-8">
                <Users size={18} /> Expert Login
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-cyber-border/40 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-cyber-text">
              Breach<span className="text-gradient-cyan">wyre</span>
            </span>
          </div>
          <p className="text-xs text-cyber-muted">
            © 2026 Breachwyre. Enterprise Cyber Incident Response Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Globe size={12} />
            <span>Defense-in-Depth Active</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

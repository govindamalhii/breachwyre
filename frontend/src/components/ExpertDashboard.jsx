// ============================================================
// Breachwyre - ExpertDashboard Component
// Real-time cyber expert triage workbench.
// Displays incident queue sorted by severity, with SHA-256
// hash verification, AI classification, and case management.
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Clock, CheckCircle, User, Brain, Hash,
  MessageSquare, Shield, AlertTriangle, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Send,
  FileText, Filter, Loader2, Eye, Lock, CheckSquare
} from 'lucide-react'
import { expertAPI } from '../api'
import { useAuth } from '../AuthContext'
import AIGuidanceWidget from './AIGuidanceWidget'

// ── Severity sort order ────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

// ── Severity Badge ─────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return (
    <span className={map[severity?.toLowerCase()] || 'badge-medium'}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {severity?.toUpperCase() || 'MEDIUM'}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  return <span className={`status-${status || 'open'}`}>
    {status === 'in_progress' ? 'In Progress' : status?.charAt(0).toUpperCase() + status?.slice(1) || 'Open'}
  </span>
}

// ── Hash Verification Badge ────────────────────────────────
function HashBadge({ hash }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="hash-display text-left w-full hover:border-cyber-glow/40 transition-colors group"
      title="Click to copy hash"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs text-cyber-muted">
          <Hash size={10} />
          SHA-256
        </div>
        <span className={`text-xs transition-colors ${copied ? 'text-emerald-400' : 'text-cyber-muted group-hover:text-cyan-400'}`}>
          {copied ? '✓ Copied' : 'Click to copy'}
        </span>
      </div>
      <p className="break-all leading-relaxed">{hash}</p>
    </button>
  )
}

// ── Add Expert Note Form ───────────────────────────────────
function AddNoteForm({ incidentId, onNoteAdded }) {
  const [note, setNote]       = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    setLoading(true)
    try {
      await expertAPI.addNote(incidentId, note.trim())
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      onNoteAdded?.()
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add forensic observations, containment actions taken, or investigation notes..."
        className="textarea-field text-sm"
        rows={3}
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={loading || !note.trim()}
        className="btn-expert text-sm py-2.5"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Adding...</>
          : success
          ? <><CheckCircle size={14} className="text-emerald-400" /> Added!</>
          : <><Send size={14} /> Add Expert Note</>
        }
      </button>
    </form>
  )
}

// ── Case Action Buttons ────────────────────────────────────
function CaseActions({ incident, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status) => {
    setLoading(true)
    try {
      await expertAPI.updateStatus(incident.id, status)
      onRefresh?.()
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {incident.status !== 'in_progress' && incident.status !== 'resolved' && (
        <button
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
          className="btn-expert text-xs py-2 px-4"
        >
          <Activity size={12} /> Take Case
        </button>
      )}
      {incident.status !== 'resolved' && (
        <button
          onClick={() => updateStatus('resolved')}
          disabled={loading}
          className="btn-primary text-xs py-2 px-4"
        >
          <CheckSquare size={12} /> Mark Resolved
        </button>
      )}
      {incident.status === 'resolved' && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <CheckCircle size={12} /> Case Resolved
        </span>
      )}
    </div>
  )
}

// ── Full Case Detail Panel ─────────────────────────────────
function CaseDetailPanel({ caseId, onRefresh }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await expertAPI.getCase(caseId)
      setDetail(res.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-cyber-border rounded-xl" />
      ))}
    </div>
  )

  if (!detail) return (
    <div className="p-6 text-center text-cyber-muted text-sm">Failed to load case details.</div>
  )

  const aiClassification = detail.ai_classifications?.[0] || null

  return (
    <div className="border-t border-cyber-border/60 bg-cyber-darker/40 p-6 space-y-6">
      {/* Case Overview */}
      <div>
        <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3">Case Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Incident Type',  value: detail.incident_type || 'Unknown' },
            { label: 'Reporter Email', value: detail.user_email || '—' },
            { label: 'Filed On',       value: new Date(detail.created_at).toLocaleDateString() },
            { label: 'Evidence Files', value: `${detail.files?.length || 0} files` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-cyber-surface/60 rounded-lg p-3 border border-cyber-border/40">
              <p className="text-xs text-cyber-muted mb-1">{label}</p>
              <p className="text-xs font-medium text-cyber-text truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-2">Incident Description</p>
        <div className="bg-cyber-surface/40 rounded-lg p-4 border border-cyber-border/40">
          <p className="text-sm text-cyber-text leading-relaxed">{detail.description}</p>
        </div>
      </div>

      {/* AI Assessment */}
      <div>
        <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Brain size={12} className="text-violet-400" />
          AI Triage Assessment
        </p>
        <AIGuidanceWidget classification={aiClassification} />
      </div>

      {/* Evidence Files with SHA-256 */}
      {detail.files?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield size={12} className="text-cyan-400" />
            Evidence Files & SHA-256 Fingerprints
          </p>
          <div className="space-y-3">
            {detail.files.map((f) => (
              <div key={f.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-cyan-400" />
                    <span className="text-sm font-medium text-cyber-text">{f.original_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyber-muted">
                    <span className="font-mono">{(f.file_size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{new Date(f.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <HashBadge hash={f.sha256_hash} />
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={10} />
                  Forensic fingerprint preserved at upload — verify with: java FileVerifier &quot;{f.stored_name}&quot; {f.sha256_hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Notes Timeline */}
      <div>
        <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <MessageSquare size={12} className="text-violet-400" />
          Investigation Notes
        </p>
        {detail.expert_notes?.length > 0 ? (
          <div className="space-y-3 mb-4">
            {detail.expert_notes.map((note) => (
              <div key={note.id} className="relative pl-6">
                <div className="absolute left-0 top-3 w-2 h-2 rounded-full bg-violet-500 border-2 border-cyber-darker" />
                <div className="absolute left-0.5 top-5 bottom-0 w-px bg-cyber-border" />
                <div className="bg-cyber-surface/60 rounded-lg p-4 border border-violet-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-violet-400">{note.expert_name}</span>
                    <span className="text-xs text-cyber-muted">{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-cyber-text leading-relaxed">{note.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-cyber-muted mb-4">No investigation notes yet. Be the first to document findings.</p>
        )}

        {/* Add Note Form */}
        <AddNoteForm incidentId={detail.id} onNoteAdded={load} />
      </div>

      {/* Case Actions */}
      <div>
        <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3">Case Actions</p>
        <CaseActions incident={detail} onRefresh={() => { load(); onRefresh?.() }} />
      </div>
    </div>
  )
}

// ── Queue Item Row ─────────────────────────────────────────
function QueueItem({ incident, onRefresh }) {
  const [expanded, setExpanded] = useState(false)

  // Severity-based left border accent
  const borderAccent = {
    critical: 'border-l-red-500',
    high:     'border-l-orange-500',
    medium:   'border-l-amber-500',
    low:      'border-l-emerald-500',
  }[incident.severity_score?.toLowerCase()] || 'border-l-amber-500'

  const aiClassification = incident.ai_classification || null

  return (
    <motion.div
      layout
      className={`glass-card overflow-hidden border-l-4 ${borderAccent}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Row Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-cyber-glow/3 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Priority Number */}
        <div className="w-8 h-8 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-center shrink-0">
          <span className="text-xs font-mono font-bold text-cyber-muted">
            #{incident.id}
          </span>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h3 className="text-sm font-semibold text-cyber-text truncate">{incident.title}</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={incident.severity_score} />
            <StatusBadge status={incident.status} />
            {aiClassification && (
              <span className="text-xs text-violet-400 flex items-center gap-1">
                <Brain size={10} />
                {aiClassification.predicted_category}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-xs text-cyber-muted">
            <User size={10} />
            <span>{incident.user_email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-cyber-muted">
            <Clock size={10} />
            <span>{new Date(incident.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-cyber-muted">
            <FileText size={10} />
            <span>{incident.file_count || 0} files</span>
          </div>
        </div>

        <div className="shrink-0">
          {expanded
            ? <ChevronUp size={14} className="text-cyber-muted" />
            : <ChevronDown size={14} className="text-cyber-muted" />
          }
        </div>
      </div>

      {/* Expanded Case Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <CaseDetailPanel caseId={incident.id} onRefresh={onRefresh} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main ExpertDashboard ───────────────────────────────────
export default function ExpertDashboard() {
  const { user } = useAuth()
  const [queue, setQueue]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [sortBy, setSortBy]   = useState('severity')

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await expertAPI.queue()
      setQueue(res.data?.incidents || res.data || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  // Sort and filter
  const processed = [...queue]
    .filter((i) => {
      if (filter === 'all') return true
      if (filter === 'critical') return i.severity_score === 'critical'
      if (filter === 'unassigned') return !i.assigned_expert_id
      return i.status === filter
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        return (SEVERITY_ORDER[a.severity_score] ?? 2) - (SEVERITY_ORDER[b.severity_score] ?? 2)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

  // Stats
  const stats = {
    total:    queue.length,
    critical: queue.filter((i) => i.severity_score === 'critical').length,
    open:     queue.filter((i) => i.status === 'open').length,
    active:   queue.filter((i) => i.status === 'in_progress').length,
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <Shield size={24} className="text-violet-400" />
            Expert Triage Queue
          </h1>
          <p className="section-subtitle">
            {user?.name} · Sorted by severity · Cryptographic evidence ready for analysis
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="btn-ghost text-sm py-2 px-4 self-start"
          title="Refresh queue"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases',     value: stats.total,    icon: Activity,      color: 'bg-cyan-500/10 text-cyan-400' },
          { label: 'Critical',        value: stats.critical,  icon: AlertTriangle, color: 'bg-red-500/10 text-red-400' },
          { label: 'Awaiting Triage', value: stats.open,      icon: Eye,           color: 'bg-amber-500/10 text-amber-400' },
          { label: 'Investigating',   value: stats.active,    icon: Lock,          color: 'bg-violet-500/10 text-violet-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-cyber-text">{value}</div>
              <div className="text-xs text-cyber-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter */}
        <div className="flex items-center gap-1">
          <Filter size={12} className="text-cyber-muted" />
          <span className="text-xs text-cyber-muted mr-1">Filter:</span>
          {['all', 'critical', 'open', 'in_progress', 'unassigned'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === f
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                  : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
              }`}
            >
              {f === 'in_progress' ? 'Active' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-cyber-muted">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-cyber-surface border border-cyber-border rounded-lg px-3 py-1.5 text-cyber-text"
          >
            <option value="severity">By Severity</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* ── Queue Table ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyber-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-cyber-border rounded" />
                  <div className="h-3 w-1/4 bg-cyber-border rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : processed.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold text-cyber-text mb-2">Queue Clear</h3>
          <p className="text-sm text-cyber-muted">No incidents match the current filter. All clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {processed.map((inc) => (
              <QueueItem key={inc.id} incident={inc} onRefresh={loadQueue} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

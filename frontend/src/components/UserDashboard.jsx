// ============================================================
// Breachwyre - UserDashboard Component
// Live incident status tracker for victims/reporters.
// Shows timeline, AI assessment, evidence hashes, expert notes.
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, CheckCircle, Users, Brain,
  Shield, Hash, MessageSquare, RefreshCw, Plus,
  ChevronRight, ChevronDown, ChevronUp, Eye,
  AlertTriangle, Activity, Lock
} from 'lucide-react'
import { incidentAPI } from '../api'
import { useAuth } from '../AuthContext'
import AIGuidanceWidget from './AIGuidanceWidget'
import PanicButton from './PanicButton'

// ── Status timeline steps ──────────────────────────────────
const TIMELINE_STEPS = [
  { key: 'submitted',  label: 'Submitted',        icon: FileText,  color: 'text-cyan-400'    },
  { key: 'triaged',    label: 'AI Triaged',        icon: Brain,     color: 'text-violet-400'  },
  { key: 'assigned',   label: 'Expert Assigned',   icon: Users,     color: 'text-amber-400'   },
  { key: 'active',     label: 'Under Investigation', icon: Activity, color: 'text-orange-400'  },
  { key: 'resolved',   label: 'Resolved',          icon: CheckCircle, color: 'text-emerald-400' },
]

// Derive timeline progress from status + ai + expert assignment
function getTimelineStep(incident) {
  if (incident.status === 'resolved')     return 4
  if (incident.status === 'in_progress')  return 3
  if (incident.assigned_expert_id)        return 2
  if (incident.ai_classification)         return 1
  return 0
}

// ── Severity Badge ─────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
  }
  return (
    <span className={map[severity?.toLowerCase()] || 'badge-medium'}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity?.toUpperCase() || 'MEDIUM'}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const cls = `status-${status}` || 'status-open'
  const label = status === 'in_progress' ? 'In Progress' : status?.charAt(0).toUpperCase() + status?.slice(1)
  return <span className={cls}>{label}</span>
}

// ── Timeline Component ─────────────────────────────────────
function IncidentTimeline({ incident }) {
  const currentStep = getTimelineStep(incident)

  return (
    <div className="relative">
      <div className="flex items-start gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const StepIcon = step.icon
          const isDone    = i < currentStep
          const isActive  = i === currentStep
          const isPending = i > currentStep

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              {/* Connector line */}
              <div className="w-full flex items-center mb-2">
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${isDone || isActive ? 'bg-cyan-500/50' : 'bg-cyber-border'}`} />
                )}
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2
                  ${isDone    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : ''}
                  ${isActive  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-glow-cyan' : ''}
                  ${isPending ? 'bg-cyber-surface border-cyber-border text-cyber-muted' : ''}
                `}>
                  {isDone
                    ? <CheckCircle size={14} />
                    : <StepIcon size={14} />
                  }
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${isDone ? 'bg-cyan-500/50' : 'bg-cyber-border'}`} />
                )}
              </div>
              {/* Label */}
              <p className={`text-center text-xs font-medium leading-tight ${
                isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-cyber-muted'
              }`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Single Incident Card ───────────────────────────────────
function IncidentCard({ incident, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail]     = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadDetail = async () => {
    if (detail) { setExpanded((v) => !v); return }
    setDetailLoading(true)
    try {
      const res = await incidentAPI.get(incident.id)
      setDetail(res.data)
      setExpanded(true)
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false)
    }
  }

  const aiClassification = detail?.ai_classifications?.[0] || null

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Card Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-cyber-glow/3 transition-colors"
        onClick={loadDetail}
      >
        <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-border flex items-center justify-center shrink-0">
          <FileText size={16} className="text-cyan-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-cyber-text text-sm leading-tight line-clamp-2">
              {incident.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityBadge severity={incident.severity_score} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-cyber-muted">
            <StatusBadge status={incident.status} />
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(incident.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Shield size={10} />
              {incident.file_count || 0} files
            </span>
            {incident.expert_name && (
              <span className="flex items-center gap-1 text-cyan-400">
                <Users size={10} />
                {incident.expert_name}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {detailLoading
            ? <RefreshCw size={14} className="text-cyber-muted animate-spin" />
            : expanded ? <ChevronUp size={14} className="text-cyber-muted" /> : <ChevronDown size={14} className="text-cyber-muted" />
          }
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-cyber-border/60 p-5 space-y-6">
              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-4">Response Timeline</p>
                <IncidentTimeline incident={detail} />
              </div>

              {/* AI Assessment */}
              {aiClassification && (
                <div>
                  <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3">AI Assessment</p>
                  <AIGuidanceWidget classification={aiClassification} />
                </div>
              )}

              {/* Evidence Files */}
              {detail.files?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hash size={12} className="text-cyan-400" />
                    Evidence SHA-256 Fingerprints
                  </p>
                  <div className="space-y-2">
                    {detail.files.map((f) => (
                      <div key={f.id} className="glass-card p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-cyber-text">{f.original_name}</span>
                          <span className="text-xs text-cyber-muted font-mono">
                            {(f.file_size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="hash-display">{f.sha256_hash}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expert Notes */}
              {detail.expert_notes?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-cyber-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare size={12} className="text-violet-400" />
                    Expert Updates
                  </p>
                  <div className="space-y-3">
                    {detail.expert_notes.map((note) => (
                      <div key={note.id} className="bg-cyber-surface/60 rounded-lg p-4 border border-violet-500/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-violet-400">{note.expert_name}</span>
                          <span className="text-xs text-cyber-muted">
                            {new Date(note.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-cyber-text leading-relaxed">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main UserDashboard ─────────────────────────────────────
export default function UserDashboard() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')

  const loadIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await incidentAPI.list()
      setIncidents(res.data?.incidents || res.data || [])
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadIncidents() }, [loadIncidents])

  // Filter incidents
  const filtered = incidents.filter((inc) => {
    if (filter === 'all') return true
    return inc.status === filter
  })

  const stats = {
    total:       incidents.length,
    open:        incidents.filter((i) => i.status === 'open').length,
    in_progress: incidents.filter((i) => i.status === 'in_progress').length,
    resolved:    incidents.filter((i) => i.status === 'resolved').length,
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">My Incidents</h1>
          <p className="section-subtitle">
            Welcome back, {user?.name?.split(' ')[0]}. Track your incident response progress below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadIncidents}
            className="btn-ghost py-2 px-4 text-sm"
            title="Refresh incidents"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <PanicButton />
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Filed',  value: stats.total,       icon: FileText,     color: 'bg-cyan-500/10 text-cyan-400' },
          { label: 'Open',         value: stats.open,         icon: AlertTriangle,color: 'bg-red-500/10 text-red-400' },
          { label: 'In Progress',  value: stats.in_progress,  icon: Activity,     color: 'bg-violet-500/10 text-violet-400' },
          { label: 'Resolved',     value: stats.resolved,     icon: CheckCircle,  color: 'bg-emerald-500/10 text-emerald-400' },
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

      {/* ── Filter Tabs ────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {['all', 'open', 'in_progress', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
              filter === f
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">({stats[f] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Incident List ───────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyber-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-cyber-border rounded" />
                  <div className="h-3 w-1/3 bg-cyber-border rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyber-surface border border-cyber-border flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-cyber-muted" />
          </div>
          <h3 className="text-lg font-display font-semibold text-cyber-text mb-2">
            {filter === 'all' ? 'No incidents yet' : `No ${filter.replace('_', ' ')} incidents`}
          </h3>
          <p className="text-sm text-cyber-muted mb-6">
            {filter === 'all'
              ? 'If you\'ve experienced a cyber incident, report it immediately using the button above.'
              : `You don't have any ${filter.replace('_', ' ')} incidents at this time.`
            }
          </p>
          {filter === 'all' && (
            <div className="flex justify-center">
              <PanicButton />
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} onRefresh={loadIncidents} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Security Footer ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-cyber-muted px-1">
        <Lock size={11} />
        <span>All evidence files are AES-256 encrypted at rest. SHA-256 hashes provide cryptographic chain-of-custody.</span>
      </div>
    </div>
  )
}

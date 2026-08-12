// ============================================================
// Breachwyre - AIGuidanceWidget Component
// Displays AI-generated severity scoring and immediate
// containment recommendations for a given incident.
// ============================================================
import { motion } from 'framer-motion'
import {
  Brain, AlertTriangle, AlertCircle, Info, CheckCircle,
  Shield, Zap, Clock, ChevronRight, Activity
} from 'lucide-react'

// ── Severity configuration map ────────────────────────────
const SEVERITY_CONFIG = {
  critical: {
    label:     'CRITICAL',
    color:     'text-red-400',
    bg:        'bg-red-500/10',
    border:    'border-red-500/30',
    icon:      AlertTriangle,
    iconColor: 'text-red-400',
    badge:     'badge-critical',
    dot:       'bg-red-400',
    pulseColor:'bg-red-400',
    barColor:  'bg-gradient-to-r from-red-600 to-red-400',
  },
  high: {
    label:     'HIGH',
    color:     'text-orange-400',
    bg:        'bg-orange-500/10',
    border:    'border-orange-500/30',
    icon:      AlertCircle,
    iconColor: 'text-orange-400',
    badge:     'badge-high',
    dot:       'bg-orange-400',
    pulseColor:'bg-orange-400',
    barColor:  'bg-gradient-to-r from-orange-600 to-orange-400',
  },
  medium: {
    label:     'MEDIUM',
    color:     'text-amber-400',
    bg:        'bg-amber-500/10',
    border:    'border-amber-500/30',
    icon:      Info,
    iconColor: 'text-amber-400',
    badge:     'badge-medium',
    dot:       'bg-amber-400',
    pulseColor:'bg-amber-400',
    barColor:  'bg-gradient-to-r from-amber-600 to-amber-400',
  },
  low: {
    label:     'LOW',
    color:     'text-emerald-400',
    bg:        'bg-emerald-500/10',
    border:    'border-emerald-500/30',
    icon:      CheckCircle,
    iconColor: 'text-emerald-400',
    badge:     'badge-low',
    dot:       'bg-emerald-400',
    pulseColor:'bg-emerald-400',
    barColor:  'bg-gradient-to-r from-emerald-600 to-emerald-400',
  },
}

// ── Skeleton loading state ─────────────────────────────────
function AIWidgetSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyber-border" />
        <div className="h-4 w-32 bg-cyber-border rounded" />
        <div className="h-6 w-20 bg-cyber-border rounded-full ml-auto" />
      </div>
      <div className="h-2 w-full bg-cyber-border rounded-full" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-cyber-border rounded" />
        <div className="h-3 w-3/4 bg-cyber-border rounded" />
        <div className="h-3 w-5/6 bg-cyber-border rounded" />
      </div>
    </div>
  )
}

// ── Action Item ────────────────────────────────────────────
function ActionItem({ text, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-start gap-3 py-2 border-b border-cyber-border/30 last:border-0"
    >
      <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-bold text-cyan-400">{index + 1}</span>
      </div>
      <p className="text-xs text-cyber-muted leading-relaxed">{text}</p>
    </motion.div>
  )
}

// ── Main AIGuidanceWidget Component ───────────────────────
export default function AIGuidanceWidget({ classification, loading = false, compact = false }) {
  // ── Loading state ──────────────────────────────────────
  if (loading) return <AIWidgetSkeleton />

  // ── No data state ──────────────────────────────────────
  if (!classification) {
    return (
      <div className="glass-card p-5 flex items-center gap-3 text-cyber-muted">
        <Brain size={18} className="text-cyber-muted/50" />
        <span className="text-sm">No AI triage data available yet.</span>
      </div>
    )
  }

  const { severity = 'medium', confidence = 0, recommended_action = '', category = '' } = classification
  const cfg = SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.medium
  const SeverityIcon = cfg.icon

  // Parse recommended action into numbered steps
  const actionSteps = recommended_action
    ? recommended_action
        .split(/[.!]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
    : []

  // Confidence bar width capped at 99%
  const confPct = Math.min(Math.round(confidence), 99)

  // ── Compact view (for tables / lists) ─────────────────
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
        <SeverityIcon size={12} className={cfg.iconColor} />
        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
        <span className="text-xs text-cyber-muted font-mono ml-1">{confPct}%</span>
      </div>
    )
  }

  // ── Full view ──────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card border ${cfg.border} overflow-hidden`}
    >
      {/* Header */}
      <div className={`${cfg.bg} px-5 py-4 border-b ${cfg.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Brain size={16} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyber-text">AI Triage Assessment</p>
              <p className="text-xs text-cyber-muted">{category || 'Cyber Incident'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cfg.pulseColor} animate-ping-slow`} />
            <span className={`text-xs font-bold ${cfg.color} tracking-wider`}>{cfg.label}</span>
          </div>
        </div>

        {/* Confidence Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-cyber-muted flex items-center gap-1">
              <Activity size={10} /> Confidence Score
            </span>
            <span className="text-xs font-mono text-cyber-text">{confPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-cyber-border/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${cfg.barColor}`}
            />
          </div>
        </div>
      </div>

      {/* Action Steps */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-cyan-400" />
          <p className="text-xs font-semibold text-cyber-text uppercase tracking-wider">
            Immediate Containment Actions
          </p>
          <Zap size={12} className="text-cyan-400 ml-auto" />
        </div>

        {actionSteps.length > 0 ? (
          <div>
            {actionSteps.slice(0, 5).map((action, i) => (
              <ActionItem key={i} text={action} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-cyber-muted leading-relaxed">{recommended_action}</p>
        )}

        {/* Timestamp notice */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-cyber-border/30">
          <Clock size={11} className="text-cyber-muted" />
          <p className="text-xs text-cyber-muted">
            Classification generated at incident submission. Expert review may override.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

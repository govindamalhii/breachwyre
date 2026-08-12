// ============================================================
// Breachwyre - IncidentForm Component
// Multi-step incident reporting form with file attachment,
// SHA-256 display, and AI classification preview.
// ============================================================
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Shield, Brain, CheckCircle,
  X, AlertCircle, File, Hash, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react'
import { incidentAPI, aiAPI } from '../api'

// ── Incident type options ──────────────────────────────────
const INCIDENT_TYPES = [
  'Ransomware Attack',
  'Phishing / Social Engineering',
  'Data Breach / Exfiltration',
  'Unauthorized Access',
  'Malware Infection',
  'Business Email Compromise',
  'DDoS Attack',
  'Insider Threat',
  'Credential Theft',
  'Supply Chain Attack',
  'Zero-Day Exploit',
  'Other',
]

// ── Step indicator ─────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-cyber-darker/50 border-b border-cyber-border">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div className={`
            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${i < current  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' : ''}
            ${i === current ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400' : ''}
            ${i > current  ? 'bg-cyber-surface border-2 border-cyber-border text-cyber-muted' : ''}
          `}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${
            i === current ? 'text-cyber-text' : 'text-cyber-muted'
          }`}>{label}</span>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 ${i < current ? 'bg-emerald-500/40' : 'bg-cyber-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── AI Classification Preview ──────────────────────────────
function AIPreviewCard({ classification }) {
  if (!classification) return null
  const { severity, confidence, recommended_action, category } = classification
  const colorMap = {
    critical: 'alert-critical',
    high:     'alert-high',
    medium:   'alert-medium',
    low:      'alert-low',
  }
  const badgeMap = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorMap[severity] || 'alert-medium'} mt-4`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Brain size={16} className="text-cyber-glow" />
        <span className="text-sm font-semibold text-cyber-text">AI Triage Result</span>
        <span className={badgeMap[severity] || 'badge-medium'}>
          {severity?.toUpperCase()}
        </span>
        <span className="ml-auto text-xs text-cyber-muted font-mono">{confidence?.toFixed(0)}% confidence</span>
      </div>
      <p className="text-xs text-cyber-muted">{category}</p>
      <div className="mt-3 pt-3 border-t border-cyber-border/40">
        <p className="text-xs font-semibold text-cyber-text mb-1">Immediate Actions:</p>
        <p className="text-xs text-cyber-muted leading-relaxed">{recommended_action}</p>
      </div>
    </motion.div>
  )
}

// ── File Item Display ──────────────────────────────────────
function FileItem({ file, onRemove, index }) {
  const sizeLabel = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 p-3 bg-cyber-surface/60 rounded-lg border border-cyber-border/50"
    >
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
        <File size={14} className="text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-cyber-text truncate">{file.name}</p>
        <p className="text-xs text-cyber-muted">{sizeLabel}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="w-6 h-6 rounded flex items-center justify-center text-cyber-muted hover:text-red-400 transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

// ── Main IncidentForm Component ────────────────────────────
export default function IncidentForm({ onSuccess }) {
  const [step, setStep]           = useState(0)
  const [loading, setLoading]     = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError]         = useState('')
  const [incidentId, setIncidentId] = useState(null)
  const [files, setFiles]         = useState([])
  const [classification, setClassification] = useState(null)
  const [uploadedHashes, setUploadedHashes] = useState([])
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title:         '',
    description:   '',
    incident_type: INCIDENT_TYPES[0],
  })

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  // ── Step 1: Submit Incident Details ───────────────────
  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      return setError('Please fill in all required fields.')
    }
    setError('')
    setLoading(true)
    try {
      // Create incident
      const res = await incidentAPI.create(form)
      const { id } = res.data
      setIncidentId(id)

      // Trigger AI classification
      setAiLoading(true)
      try {
        const aiRes = await aiAPI.classify({
          title: form.title,
          description: form.description,
          incident_type: form.incident_type,
        })
        setClassification(aiRes.data)
      } catch {
        // Non-fatal: AI classification failure shouldn't block submission
      } finally {
        setAiLoading(false)
      }

      setStep(1)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit incident. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Upload Evidence Files ─────────────────────
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files)
    const total    = files.length + selected.length
    if (total > 5) {
      setError('Maximum 5 evidence files allowed per incident.')
      return
    }
    setFiles((prev) => [...prev, ...selected])
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (!incidentId) return

    if (files.length === 0) {
      // Allow skipping evidence upload
      setStep(2)
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const res = await incidentAPI.uploadFiles(incidentId, formData)
      setUploadedHashes(res.data?.files || [])
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Steps Config ───────────────────────────────────────
  const steps = ['Incident Details', 'Evidence Upload', 'Confirmed']

  return (
    <div>
      <StepIndicator current={step} steps={steps} />

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* ── STEP 0: Incident Details ─────────────────── */}
          {step === 0 && (
            <motion.form
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleStep1}
              className="space-y-5"
              id="incident-details-form"
            >
              {/* Title */}
              <div>
                <label className="input-label">
                  Incident Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="incident-title"
                  type="text"
                  placeholder="e.g., Ransomware attack on accounting servers"
                  value={form.title}
                  onChange={update('title')}
                  className="input-field"
                  required
                  maxLength={255}
                />
              </div>

              {/* Type */}
              <div>
                <label className="input-label">
                  Incident Type <span className="text-red-400">*</span>
                </label>
                <select
                  id="incident-type"
                  value={form.incident_type}
                  onChange={update('incident_type')}
                  className="select-field"
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="input-label">
                  Incident Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="incident-description"
                  placeholder="Describe what happened, when it started, what systems are affected, and any immediate symptoms observed..."
                  value={form.description}
                  onChange={update('description')}
                  className="textarea-field"
                  required
                  rows={5}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                id="incident-submit-step1"
                type="submit"
                disabled={loading}
                className="btn-danger w-full justify-center py-3.5"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <>Submit & Triage <ChevronRight size={16} /></>}
              </button>
            </motion.form>
          )}

          {/* ── STEP 1: Evidence Upload ───────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* AI Classification Result */}
              {aiLoading ? (
                <div className="flex items-center gap-3 p-4 bg-cyber-surface/60 rounded-lg border border-cyan-500/20 mb-4">
                  <Loader2 size={16} className="text-cyan-400 animate-spin" />
                  <span className="text-sm text-cyan-400">AI is analyzing your incident...</span>
                </div>
              ) : (
                <AIPreviewCard classification={classification} />
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="input-label flex items-center gap-2">
                    <Shield size={14} className="text-cyan-400" />
                    Attach Evidence Files
                    <span className="text-xs text-cyber-muted font-normal">(optional, max 5)</span>
                  </label>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyber-border hover:border-cyber-glow/40 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-cyber-glow/3"
                  >
                    <Upload size={28} className="text-cyber-muted mx-auto mb-3" />
                    <p className="text-sm text-cyber-muted">
                      Drop evidence files here or <span className="text-cyan-400">browse</span>
                    </p>
                    <p className="text-xs text-cyber-muted/60 mt-1">
                      PDF, PNG, JPG, TXT, LOG, PCAP, ZIP — max 50MB each
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.log,.pcap,.zip"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* File List */}
                <AnimatePresence>
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((f, i) => (
                        <FileItem key={`${f.name}-${i}`} file={f} index={i} onRemove={removeFile} />
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* SHA-256 notice */}
                <div className="flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                  <Hash size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-cyber-muted">
                    SHA-256 fingerprints are computed server-side for each file before storage,
                    establishing a cryptographic chain-of-custody for forensic integrity.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-ghost flex-1 justify-center py-3">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={handleStep2}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center py-3"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                      : files.length > 0 ? <>Upload & Finalize <ChevronRight size={16} /></> : <>Skip & Finalize <ChevronRight size={16} /></>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Confirmation ─────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-cyber-text mb-2">
                Incident Reported
              </h3>
              <p className="text-sm text-cyber-muted mb-2">
                Incident #{incidentId} has been created and is queued for expert triage.
              </p>
              {classification && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 badge-${classification.severity}`}>
                  <Brain size={14} />
                  AI Severity: {classification.severity?.toUpperCase()}
                </div>
              )}

              {/* Uploaded hashes */}
              {uploadedHashes.length > 0 && (
                <div className="mt-4 text-left space-y-3">
                  <p className="text-xs font-semibold text-cyber-text flex items-center gap-2">
                    <Shield size={12} className="text-cyan-400" />
                    Evidence SHA-256 Fingerprints
                  </p>
                  {uploadedHashes.map((f) => (
                    <div key={f.stored_name} className="hash-display">
                      <p className="text-xs text-cyber-muted mb-1">{f.original_name}</p>
                      <p className="break-all">{f.sha256_hash}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                id="incident-done"
                onClick={onSuccess}
                className="btn-primary mt-6 mx-auto justify-center px-8"
              >
                <FileText size={16} /> View My Incidents
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

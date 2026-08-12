// ============================================================
// Breachwyre - PanicButton Component
// High-impact glowing emergency action button that opens the
// immediate incident reporting modal.
// ============================================================
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Zap } from 'lucide-react'
import IncidentForm from './IncidentForm'

export default function PanicButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* ── The Panic Button ─────────────────────────── */}
      <motion.div
        className="relative inline-flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        {/* Outer ripple rings */}
        <span className="panic-ring bg-red-500/20" style={{ animationDelay: '0s' }} />
        <span className="panic-ring bg-red-500/15" style={{ animationDelay: '0.4s' }} />
        <span className="panic-ring bg-red-500/10" style={{ animationDelay: '0.8s' }} />

        {/* Main Button */}
        <button
          id="panic-button"
          onClick={() => setIsOpen(true)}
          aria-label="Report a cyber incident immediately"
          className={`
            relative z-10 flex items-center gap-3 px-8 py-4 rounded-full
            bg-gradient-to-r from-red-600 to-red-700
            text-white font-bold text-lg tracking-wide
            border-2 border-red-500/60
            shadow-glow-red animate-pulse-glow
            transition-all duration-300
            hover:from-red-500 hover:to-red-600
            hover:border-red-400/80
            focus:outline-none focus:ring-4 focus:ring-red-500/40
          `}
        >
          <AlertTriangle size={22} className="animate-bounce" />
          <span>REPORT INCIDENT</span>
          <Zap size={18} className="opacity-80" />
        </button>
      </motion.div>

      {/* ── Incident Form Modal ───────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1,    opacity: 1, y: 0 }}
              exit={{   scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-cyber-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-cyber-text text-lg">
                      Report Cyber Incident
                    </h2>
                    <p className="text-xs text-cyber-muted">
                      Evidence is cryptographically preserved upon submission
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/40 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Incident Form */}
              <IncidentForm onSuccess={() => setIsOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

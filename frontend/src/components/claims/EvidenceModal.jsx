import { useEffect } from 'react'
import { getVerdictConfig, pct } from '../../lib/verdict'

export function EvidenceModal({ claim, onClose }) {
  const verdict = claim?.verification?.verdict || 'unverifiable'
  const cfg = getVerdictConfig(verdict)
  const confidence = pct(claim?.verification?.confidence_score)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!claim) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ animation: 'fadeUp 200ms ease' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border"
                style={{ color: cfg.color, borderColor: cfg.border, backgroundColor: cfg.bg }}
              >
                {cfg.icon} {cfg.label}
              </span>
              <span className="font-mono text-xs text-muted">
                {confidence}% confidence
              </span>
            </div>
            <p className="font-serif text-[1rem] leading-relaxed text-primary">
              "{claim.claim_text}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-base"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Matched source */}
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Matched Source
            </div>
            {claim.verification?.matched_chunk_text ? (
              <div className="rounded-lg border border-border bg-base p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-accent">
                    📄 {claim.verification.matched_doc_title || 'Unknown document'}
                  </span>
                </div>
                <p className="text-sm text-primary leading-relaxed font-mono">
                  "{claim.verification.matched_chunk_text}"
                </p>
              </div>
            ) : verdict === 'unverifiable' ? (
              <div className="rounded-lg border border-dashed border-unverifiable/40 bg-unverifiable/5 p-4 text-center">
                <p className="text-sm text-[#f4a42e]">No matching source found.</p>
                <p className="text-xs text-muted mt-1">This claim could not be matched to any retrieved document.</p>
              </div>
            ) : (
              <p className="text-sm text-muted">No retrieval data available for this claim.</p>
            )}
          </div>

          {/* Reasoning */}
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Reasoning
            </div>
            <p className="text-sm text-primary leading-relaxed">
              {claim.verification?.reasoning_text || 'No reasoning available.'}
            </p>
          </div>

          {/* Evidence thread visual */}
          {claim.verification?.matched_chunk_text && (
            <div className="flex items-center gap-2">
              <div
                className="h-0.5 flex-1 rounded"
                style={{
                  backgroundColor: cfg.color,
                  animation: 'thread-draw 400ms ease forwards',
                  opacity: 0.5,
                }}
              />
              <span className="text-xs font-mono text-muted">claim → source</span>
              <div
                className="h-0.5 flex-1 rounded"
                style={{ backgroundColor: cfg.color, opacity: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium text-muted hover:text-primary border border-border hover:border-muted transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes thread-draw {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

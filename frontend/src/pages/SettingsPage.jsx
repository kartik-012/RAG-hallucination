import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Card, Button, Spinner, Toast, ErrorBanner } from '../components/ui'
import { getVerdictConfig } from '../lib/verdict'

export function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [strictness, setStrictness] = useState(0.7)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const data = await api.getSettings()
      setSettings(data)
      setStrictness(data.default_strictness_threshold)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateSettings({ default_strictness_threshold: strictness })
      setToast({ message: 'Settings saved. Applies to new queries only.', type: 'success' })
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Live preview chip based on strictness
  const previewVerdict = strictness >= 0.7 ? 'supported' : strictness >= 0.4 ? 'unverifiable' : 'contradicted'
  const cfg = getVerdictConfig(previewVerdict)

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Settings</h1>
        <p className="text-sm text-muted mb-6">Configure verification behavior.</p>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="space-y-6">
            {/* Strictness slider */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-primary mb-4">Strictness Threshold</h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">Confidence required to mark a claim as "Supported"</span>
                  <span className="font-mono text-sm font-bold text-primary">{strictness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={strictness}
                  onChange={e => setStrictness(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>0.0 — Lenient</span>
                  <span>1.0 — Strict</span>
                </div>
              </div>

              {/* Live preview */}
              <div className="p-4 rounded-lg bg-base border border-border">
                <div className="text-xs text-muted mb-2">Live preview — sample claim:</div>
                <span
                  className="font-serif text-[1rem]"
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: cfg.color,
                    textDecorationStyle: previewVerdict === 'unverifiable' ? 'dashed' : 'solid',
                    textUnderlineOffset: '3px',
                    backgroundColor: cfg.bg,
                    borderRadius: '3px',
                    padding: '1px 4px',
                  }}
                >
                  RAG systems reduce hallucinations.
                </span>
                <span
                  className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded border"
                  style={{ color: cfg.color, borderColor: cfg.border, backgroundColor: cfg.bg }}
                >
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              <p className="text-xs text-muted mt-3">
                This won't change results you've already seen — only applies to future queries.
              </p>

              <Button onClick={handleSave} disabled={saving} className="mt-4 w-full">
                {saving ? <><Spinner size="sm" /> Saving...</> : 'Apply Settings'}
              </Button>
            </Card>

            {/* Info card */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-primary mb-3">How Verification Works</h2>
              <div className="space-y-3 text-xs text-muted leading-relaxed">
                <p>Each sentence in the AI's answer is extracted as a claim and run through a local NLI (Natural Language Inference) model — <span className="text-primary font-mono">cross-encoder/nli-deberta-v3-base</span>.</p>
                <p>The NLI model scores each claim against the retrieved source chunks and outputs a confidence score between 0 and 1.</p>
                <p>If the entailment confidence ≥ your strictness threshold → <span className="text-[#52b788] font-medium">Supported</span>.</p>
                <p>If the contradiction confidence ≥ threshold → <span className="text-[#ef4444] font-medium">Contradicted</span>.</p>
                <p>Otherwise → <span className="text-[#f4a42e] font-medium">Unverifiable</span>.</p>
                <p className="text-[11px] text-muted/70">The LLM is never asked to judge its own output. Verification is fully independent.</p>
              </div>
            </Card>

            {/* Last updated */}
            {settings?.updated_at && (
              <p className="text-xs text-muted text-center">
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

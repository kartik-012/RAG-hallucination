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
      setToast({ message: 'Settings saved! Will apply to new queries.', type: 'success' })
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Live preview chip based on strictness
  const previewVerdict = strictness >= 0.7 ? 'supported' : strictness >= 0.4 ? 'unverifiable' : 'contradicted'
  const cfg = getVerdictConfig(previewVerdict)
  const strictnessColor = strictness >= 0.8 ? 'text-[#ef4444]' : strictness >= 0.6 ? 'text-[#f4a42e]' : 'text-[#52b788]'

  return (
    <div className="min-h-screen bg-base">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-primary mb-1.5">Settings</h1>
          <p className="text-sm text-muted">Configure the core parameters of the hallucination auditor.</p>
        </div>

        {error && <ErrorBanner message={error} className="mb-5 animate-fade-up" />}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Strictness Config */}
            <Card className="p-6 md:p-8 animate-fade-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-primary">Global Strictness Threshold</h2>
                  <p className="text-xs text-muted mt-0.5">Confidence required from NLI model to mark a claim as "Supported"</p>
                </div>
              </div>

              <div className="mb-8 p-5 bg-surface/50 border border-border/60 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Threshold Value</span>
                  <span className={`font-mono text-2xl font-bold ${strictnessColor}`}>{strictness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={strictness}
                  onChange={e => setStrictness(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] font-medium text-muted/60 mt-2">
                  <span>0.0 (Lenient)</span>
                  <span>1.0 (Strict)</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Live Preview</h3>
                <div className="p-4 rounded-xl bg-surface border border-border/80 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <span
                      className="font-serif text-[1.05rem] leading-relaxed transition-all"
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: cfg.color,
                        textDecorationStyle: previewVerdict === 'unverifiable' ? 'dashed' : 'solid',
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '3px',
                        backgroundColor: cfg.bg,
                        borderRadius: '3px',
                        padding: '1px 4px',
                      }}
                    >
                      RAG systems can reduce AI hallucinations.
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className="text-xs font-mono font-medium px-2.5 py-1 rounded-md border transition-all"
                      style={{ color: cfg.color, borderColor: cfg.border, backgroundColor: cfg.bg }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted/60 mt-2 text-center">
                  Preview shows how a moderate-confidence entailment might be classified.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <p className="text-[11px] text-muted">
                  Changes apply to future queries only.
                </p>
                <Button onClick={handleSave} disabled={saving} size="md">
                  {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
                </Button>
              </div>
            </Card>

            {/* Documentation / Info */}
            <Card className="p-6 md:p-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
                <span>📚</span> How Verification Works
              </h2>
              <div className="space-y-4 text-sm text-muted leading-relaxed">
                <p>
                  This system operates independently of the LLM generation phase to ensure objective auditing:
                </p>
                <ul className="space-y-3 pl-2">
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <p>The AI's answer is split into individual sentences (claims).</p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <p>Each claim is run through <code className="font-mono text-xs bg-surface border border-border px-1 py-0.5 rounded text-primary">cross-encoder/nli-deberta-v3-base</code> against the retrieved chunks.</p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p>The model outputs probabilities for three states:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <div className="bg-supported/10 border border-supported/20 rounded p-2 text-xs">
                          <span className="font-semibold text-[#52b788] block mb-0.5">Entailment</span>
                          If ≥ strictness threshold → Supported
                        </div>
                        <div className="bg-contradicted/10 border border-contradicted/20 rounded p-2 text-xs">
                          <span className="font-semibold text-[#ef4444] block mb-0.5">Contradiction</span>
                          If ≥ strictness threshold → Contradicted
                        </div>
                        <div className="bg-unverifiable/10 border border-unverifiable/20 rounded p-2 text-xs">
                          <span className="font-semibold text-[#f4a42e] block mb-0.5">Neutral</span>
                          Otherwise → Unverifiable
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Last updated footer */}
            {settings?.updated_at && (
              <p className="text-[10px] font-mono text-muted/50 text-center uppercase tracking-widest pt-4">
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

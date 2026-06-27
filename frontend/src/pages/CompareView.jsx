import { useState } from 'react'
import { api } from '../lib/api'
import { ClaimChip, SummaryStats } from '../components/claims/ClaimChip'
import { EvidenceModal } from '../components/claims/EvidenceModal'
import { Button, Spinner, Card, ErrorBanner } from '../components/ui'

const AVAILABLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
]

export function ComparePanel({ queryId, originalGen, onClose }) {
  const [compareGen, setCompareGen] = useState(null)
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeClaim, setActiveClaim] = useState(null)

  async function handleCompare() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.compareModels(queryId, { model_name: selectedModel })
      // Get the new generation (last one)
      const gens = result.generations || []
      const newGen = gens.find(g => g.model_name === selectedModel && g.id !== originalGen?.id)
        || gens[gens.length - 1]
      setCompareGen(newGen)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const origClaims = originalGen?.claims || []
  const compClaims = compareGen?.claims || []

  const origContradicted = origClaims.filter(c => c.verification?.verdict === 'contradicted').length
  const compContradicted = compClaims.filter(c => c.verification?.verdict === 'contradicted').length

  return (
    <div
      className="fixed inset-0 z-40 bg-base/95 backdrop-blur-sm overflow-y-auto"
      style={{ animation: 'fadeIn 200ms ease' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary">Model Comparison</h2>
          <button onClick={onClose} className="text-muted hover:text-primary px-3 py-1.5 rounded-lg border border-border text-sm">
            ← Back
          </button>
        </div>

        {/* Compare setup */}
        {!compareGen && (
          <Card className="p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted mb-1 block">Compare against model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-base border border-border text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent/60"
                >
                  {AVAILABLE_MODELS.filter(m => m !== originalGen?.model_name).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCompare} disabled={loading} className="mt-5">
                {loading ? <><Spinner size="sm" /> Running...</> : 'Compare'}
              </Button>
            </div>
            {error && <ErrorBanner message={error} className="mt-3" />}
          </Card>
        )}

        {/* Comparative callout */}
        {compareGen && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-surface text-sm text-primary">
            {compContradicted > origContradicted ? (
              <span className="text-[#f4a42e]">
                ⚠ {compareGen.model_name} contradicted {compContradicted - origContradicted} more claim(s) than {originalGen?.model_name}.
              </span>
            ) : compContradicted < origContradicted ? (
              <span className="text-[#52b788]">
                ✓ {compareGen.model_name} contradicted {origContradicted - compContradicted} fewer claim(s) than {originalGen?.model_name}.
              </span>
            ) : (
              <span className="text-muted">Both models had the same number of contradicted claims ({origContradicted}).</span>
            )}
            <button onClick={() => setCompareGen(null)} className="ml-4 text-xs text-muted underline">
              Change model
            </button>
          </div>
        )}

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Original</span>
              <span className="font-mono text-xs text-accent">{originalGen?.model_name}</span>
            </div>
            {origClaims.length > 0 ? (
              <>
                <SummaryStats claims={origClaims} />
                <div className="mt-4 font-serif text-[1rem] leading-[1.9] text-primary">
                  {origClaims.map((claim, i) => (
                    <span key={claim.id}>
                      <ClaimChip claim={claim} isActive={activeClaim?.id === claim.id} onClick={setActiveClaim} />
                      {i < origClaims.length - 1 && ' '}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{originalGen?.answer_text}</p>
            )}
          </Card>

          {/* Compare */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Comparison</span>
              <span className="font-mono text-xs text-accent">{compareGen?.model_name || '—'}</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-muted text-sm py-8 justify-center">
                <Spinner /> Running comparison...
              </div>
            ) : compClaims.length > 0 ? (
              <>
                <SummaryStats claims={compClaims} />
                <div className="mt-4 font-serif text-[1rem] leading-[1.9] text-primary">
                  {compClaims.map((claim, i) => (
                    <span key={claim.id}>
                      <ClaimChip claim={claim} isActive={activeClaim?.id === claim.id} onClick={setActiveClaim} />
                      {i < compClaims.length - 1 && ' '}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted py-8 text-center">
                {compareGen ? compareGen.answer_text : 'Select a model to compare.'}
              </div>
            )}
          </Card>
        </div>
      </div>

      {activeClaim && <EvidenceModal claim={activeClaim} onClose={() => setActiveClaim(null)} />}

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  )
}

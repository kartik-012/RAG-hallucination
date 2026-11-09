import { useState } from 'react'
import { api } from '../lib/api'
import { ClaimChip, SummaryStats } from '../components/claims/ClaimChip'
import { EvidenceModal } from '../components/claims/EvidenceModal'
import { Button, Spinner, Card, ErrorBanner, StatusPill } from '../components/ui'

const AVAILABLE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.5-flash',
]

export function ComparePanel({ queryId, originalGen, onClose }) {
  const [compareGen, setCompareGen] = useState(null)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro')
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
  const isGenerating = compareGen?.status === 'generating' || compareGen?.status === 'verifying'

  return (
    <div
      className="fixed inset-0 z-50 bg-base/80 backdrop-blur-md overflow-y-auto"
      style={{ animation: 'fadeIn 200ms ease' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">Model Comparison</h2>
            <p className="text-sm text-muted">Compare generation quality and hallucination rates across models.</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="px-4 py-2">
            ✕ Close
          </Button>
        </div>

        {/* Compare setup */}
        {!compareGen && (
          <Card className="p-6 mb-6 border-accent/20 shadow-xl shadow-accent/5">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">Compare {originalGen?.model_name} against:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-surface border border-border/80 text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all cursor-pointer font-mono"
                >
                  {AVAILABLE_MODELS.filter(m => m !== originalGen?.model_name).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCompare} disabled={loading} className="w-full md:w-auto px-8 py-3 h-[46px]">
                {loading ? <><Spinner size="sm" /> Running...</> : 'Start Comparison'}
              </Button>
            </div>
            {error && <ErrorBanner message={error} className="mt-4" />}
          </Card>
        )}

        {/* Comparative callout */}
        {compareGen && compareGen.status === 'complete' && (
          <div className="mb-8 animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-transparent opacity-50" />
            <div className={`p-4 rounded-xl border flex items-center justify-between backdrop-blur-md ${
              compContradicted > origContradicted ? 'bg-contradicted/10 border-contradicted/20 text-[#ef4444]' :
              compContradicted < origContradicted ? 'bg-supported/10 border-supported/20 text-[#52b788]' :
              'bg-surface border-border text-muted'
            }`}>
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-xl">
                  {compContradicted > origContradicted ? '⚠' : compContradicted < origContradicted ? '✓' : '⚖'}
                </span>
                <span className="text-sm font-medium">
                  {compContradicted > origContradicted ? (
                    <><strong className="font-mono">{compareGen.model_name}</strong> contradicted {compContradicted - origContradicted} more claim(s) than <strong className="font-mono">{originalGen?.model_name}</strong>.</>
                  ) : compContradicted < origContradicted ? (
                    <><strong className="font-mono">{compareGen.model_name}</strong> contradicted {origContradicted - compContradicted} fewer claim(s) than <strong className="font-mono">{originalGen?.model_name}</strong>.</>
                  ) : (
                    <>Both models had the same number of contradicted claims ({origContradicted}).</>
                  )}
                </span>
              </div>
              <button onClick={() => setCompareGen(null)} className="text-xs underline hover:no-underline font-medium relative z-10">
                Change model
              </button>
            </div>
          </div>
        )}

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <Card className="p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Original Run
              </span>
              <div className="flex items-center gap-2">
                <StatusPill status={originalGen?.status} />
                <span className="font-mono text-[11px] bg-surface border border-border px-1.5 py-0.5 rounded text-primary/80">
                  {originalGen?.model_name}
                </span>
              </div>
            </div>
            {origClaims.length > 0 ? (
              <>
                <SummaryStats claims={origClaims} />
                <div className="mt-5 font-serif text-[1.05rem] leading-[1.9] text-primary bg-surface/30 p-4 rounded-xl border border-border/30">
                  {origClaims.map((claim, i) => (
                    <React.Fragment key={claim.id}>
                      <ClaimChip claim={claim} isActive={activeClaim?.id === claim.id} onClick={setActiveClaim} />
                      {i < origClaims.length - 1 && ' '}
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted italic p-4">{originalGen?.answer_text}</p>
            )}
          </Card>

          {/* Compare */}
          <Card className="p-6 shadow-lg shadow-black/20" style={{
            boxShadow: compareGen && !isGenerating ? '0 0 0 1px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.3)' : undefined
          }}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Comparison Run
              </span>
              <div className="flex items-center gap-2">
                {compareGen && <StatusPill status={compareGen.status} />}
                <span className="font-mono text-[11px] bg-surface border border-border px-1.5 py-0.5 rounded text-primary/80">
                  {compareGen?.model_name || selectedModel}
                </span>
              </div>
            </div>
            
            {loading || isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 bg-surface/20 rounded-xl border border-border/30 border-dashed">
                <Spinner size="lg" />
                <p className="text-xs font-medium text-muted mt-4">Running verification on new generation...</p>
              </div>
            ) : compClaims.length > 0 ? (
              <div className="animate-fade-in">
                <SummaryStats claims={compClaims} />
                <div className="mt-5 font-serif text-[1.05rem] leading-[1.9] text-primary bg-surface/30 p-4 rounded-xl border border-border/30">
                  {compClaims.map((claim, i) => (
                    <React.Fragment key={claim.id}>
                      <ClaimChip claim={claim} isActive={activeClaim?.id === claim.id} onClick={setActiveClaim} />
                      {i < compClaims.length - 1 && ' '}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : compareGen?.status === 'error' ? (
              <ErrorBanner message={compareGen.error_message} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-surface/20 rounded-xl border border-border/30 border-dashed text-center px-4">
                <div className="text-3xl opacity-30 mb-3">⚖</div>
                <p className="text-sm text-muted">
                  {compareGen ? compareGen.answer_text : 'Select a model and click "Start Comparison" to see how it handles this question.'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {activeClaim && <EvidenceModal claim={activeClaim} onClose={() => setActiveClaim(null)} />}
    </div>
  )
}

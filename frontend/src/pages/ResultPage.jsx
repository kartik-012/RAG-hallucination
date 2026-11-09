import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { ClaimChip, ClaimsSkeleton, SummaryStats } from '../components/claims/ClaimChip'
import { EvidenceModal } from '../components/claims/EvidenceModal'
import { Card, Button, Spinner, ErrorBanner, Badge, StatusPill } from '../components/ui'
import { ComparePanel } from './CompareView'

export function ResultPage() {
  const { queryId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeClaim, setActiveClaim] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [activeGenIdx, setActiveGenIdx] = useState(0)

  useEffect(() => {
    fetchData()
  }, [queryId])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getQuery(queryId)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <ResultSkeleton />
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 pt-12">
      <ErrorBanner message={error} onRetry={fetchData} />
    </div>
  )
  if (!data) return null

  const gen = data.generations?.[activeGenIdx]
  const allGens = data.generations || []

  // Compute overall hallucination risk for the badge
  const claims = gen?.claims || []
  const contradicted = claims.filter(c => c.verification?.verdict === 'contradicted').length
  const unverifiable = claims.filter(c => c.verification?.verdict === 'unverifiable').length
  const supported = claims.filter(c => c.verification?.verdict === 'supported').length
  const riskLevel = contradicted > 0 ? 'contradicted' : unverifiable > supported ? 'unverifiable' : 'supported'

  return (
    <div className="min-h-screen bg-base">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-accent/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
          <div className="flex-1">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors mb-3 group">
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              Ask another question
            </Link>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-primary leading-snug max-w-2xl">
                  {data.question_text}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {gen && <StatusPill status={gen.status} />}
                  <span className="text-xs text-muted font-mono">{gen?.model_name}</span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">{new Date(data.created_at).toLocaleString()}</span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted font-mono">strictness: {data.strictness_threshold?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={() => setShowCompare(true)} size="sm">
              ⇄ Compare Models
            </Button>
          </div>
        </div>

        {/* Model tabs if multiple generations */}
        {allGens.length > 1 && (
          <div className="flex gap-2 mb-5">
            {allGens.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveGenIdx(i)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                  i === activeGenIdx
                    ? 'bg-accent/15 border-accent/35 text-accent shadow-sm'
                    : 'bg-surface border-border text-muted hover:text-primary hover:border-muted/50'
                }`}
              >
                {g.model_name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* Main answer with claim chips */}
          <Card className="p-6 animate-fade-up">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-muted uppercase tracking-widest">Answer</span>
              {claims.length > 0 && (
                <Badge verdict={riskLevel} className="ml-1">
                  {riskLevel === 'supported' ? '✓ Verified' : riskLevel === 'contradicted' ? '⚠ Issues found' : '? Uncertain'}
                </Badge>
              )}
            </div>

            {gen?.status === 'generating' || gen?.status === 'verifying' ? (
              <ClaimsSkeleton />
            ) : gen?.status === 'error' ? (
              <div>
                <ErrorBanner message={gen.error_message || 'Verification failed'} onRetry={fetchData} />
                {gen?.answer_text && (
                  <p className="mt-4 font-serif text-primary text-[1.05rem] leading-relaxed">
                    {gen.answer_text}
                  </p>
                )}
              </div>
            ) : (
              <div className="font-serif text-[1.05rem] leading-[1.9] text-primary max-w-[65ch]">
                {claims.length > 0 ? (
                  <>
                    {claims.map((claim, i) => (
                      <React.Fragment key={claim.id}>
                        <ClaimChip claim={claim} isActive={activeClaim?.id === claim.id} onClick={setActiveClaim} />
                        {i < claims.length - 1 && ' '}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <p className="text-muted italic">{gen?.answer_text || 'No answer generated.'}</p>
                )}
              </div>
            )}

            {claims.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/50">
                <p className="text-[11px] text-muted/60 flex items-center gap-1.5">
                  <span>💡</span>
                  Click any sentence to see the matched source document and NLI reasoning
                </p>
              </div>
            )}
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary stats */}
            <Card className="p-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Verification Summary</div>
              {claims.length > 0 ? (
                <SummaryStats claims={claims} />
              ) : (
                <p className="text-xs text-muted">No claims to summarize.</p>
              )}
            </Card>

            {/* Legend */}
            <Card className="p-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Legend</div>
              <div className="space-y-2.5">
                {[
                  { color: '#52b788', dash: false, label: 'Supported', desc: 'Grounded in source' },
                  { color: '#f4a42e', dash: true, label: 'Unverifiable', desc: 'No match found' },
                  { color: '#ef4444', dash: false, label: 'Contradicted', desc: 'Conflicts source' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: l.dash ? 'transparent' : l.color,
                        borderBottom: l.dash ? `2px dashed ${l.color}` : 'none',
                      }}
                    />
                    <span className="text-xs font-semibold" style={{ color: l.color }}>{l.label}</span>
                    <span className="text-[10px] text-muted">— {l.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strictness info */}
            <Card className="p-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
              <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Strictness</div>
              <div className="font-mono text-3xl text-primary font-bold">
                {Math.round((data.strictness_threshold || 0.7) * 100)}%
              </div>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                Minimum NLI confidence required for the "Supported" verdict
              </p>
            </Card>

            {/* Claims breakdown */}
            {claims.length > 0 && (
              <Card className="p-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Claims</div>
                <div className="space-y-1">
                  {claims.map((claim, i) => {
                    const v = claim.verification?.verdict || 'unverifiable'
                    const colors = { supported: '#52b788', unverifiable: '#f4a42e', contradicted: '#ef4444' }
                    return (
                      <button
                        key={claim.id}
                        onClick={() => setActiveClaim(claim)}
                        className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 hover:bg-base ${
                          activeClaim?.id === claim.id ? 'bg-base' : ''
                        }`}
                      >
                        <span className="flex-shrink-0 font-mono text-[10px] text-muted/50 w-4">{i + 1}</span>
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: colors[v] }}
                        />
                        <span className="text-muted truncate leading-snug">{claim.claim_text?.slice(0, 50)}…</span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Evidence modal */}
      {activeClaim && (
        <EvidenceModal claim={activeClaim} onClose={() => setActiveClaim(null)} />
      )}

      {/* Compare panel */}
      {showCompare && (
        <ComparePanel queryId={queryId} originalGen={gen} onClose={() => { setShowCompare(false); fetchData() }} />
      )}
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="h-5 bg-surface rounded-lg w-1/3 skeleton-pulse" />
      <div className="h-7 bg-surface rounded-lg w-2/3 skeleton-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="bg-surface border border-border rounded-xl p-6">
          <ClaimsSkeleton />
        </div>
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4 h-32 skeleton-pulse" />
          <div className="bg-surface border border-border rounded-xl p-4 h-24 skeleton-pulse" />
        </div>
      </div>
    </div>
  )
}

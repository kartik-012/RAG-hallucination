import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { ClaimChip, ClaimsSkeleton, SummaryStats } from '../components/claims/ClaimChip'
import { EvidenceModal } from '../components/claims/EvidenceModal'
import { Card, Button, Spinner, ErrorBanner, Badge } from '../components/ui'
import { ComparePanel } from './CompareView'

export function ResultPage() {
  const { queryId } = useParams()
  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <Link to="/" className="text-xs text-muted hover:text-primary transition-colors mb-2 inline-block">
              ← Ask another question
            </Link>
            <h1 className="text-base font-semibold text-primary leading-snug max-w-2xl">
              {data.question_text}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted font-mono">{gen?.model_name}</span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{new Date(data.created_at).toLocaleString()}</span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted font-mono">strictness: {data.strictness_threshold}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowCompare(true)}>
              Compare Models
            </Button>
          </div>
        </div>

        {/* Model tabs if multiple gens */}
        {allGens.length > 1 && (
          <div className="flex gap-2 mb-4">
            {allGens.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveGenIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  i === activeGenIdx
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-surface border-border text-muted hover:text-primary'
                }`}
              >
                {g.model_name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Main answer with claim chips */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Answer</span>
              {gen?.status === 'error' && (
                <Badge verdict="contradicted">Verification failed</Badge>
              )}
            </div>

            {gen?.status === 'generating' || gen?.status === 'verifying' ? (
              <ClaimsSkeleton />
            ) : gen?.status === 'error' ? (
              <div>
                <ErrorBanner message={gen.error_message || 'Verification failed'} onRetry={fetchData} />
                <p className="mt-4 font-serif text-primary text-[1.05rem] leading-relaxed">
                  {gen?.answer_text}
                </p>
              </div>
            ) : (
              <div className="font-serif text-[1.05rem] leading-[1.9] text-primary max-w-[65ch]">
                {(gen?.claims || []).length > 0 ? (
                  <>
                    {gen.claims.map((claim, i) => (
                      <span key={claim.id}>
                        <ClaimChip
                          claim={claim}
                          isActive={activeClaim?.id === claim.id}
                          onClick={setActiveClaim}
                        />
                        {i < gen.claims.length - 1 && ' '}
                      </span>
                    ))}
                  </>
                ) : (
                  <p className="text-muted">{gen?.answer_text || 'No answer generated.'}</p>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted">
                Click any sentence to see the matched source and reasoning.
              </p>
            </div>
          </Card>

          {/* Sidebar: stats */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Summary</div>
              {gen?.claims?.length > 0 ? (
                <SummaryStats claims={gen.claims} />
              ) : (
                <p className="text-xs text-muted">No claims to summarize.</p>
              )}
            </Card>

            {/* Legend */}
            <Card className="p-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Legend</div>
              <div className="space-y-2">
                {[
                  { color: '#52b788', dash: false, label: 'Supported', desc: 'Found in source' },
                  { color: '#f4a42e', dash: true, label: 'Unverifiable', desc: 'No match found' },
                  { color: '#ef4444', dash: false, label: 'Contradicted', desc: 'Conflicts source' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div
                      className="w-8 h-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: l.dash ? 'transparent' : l.color,
                        borderBottom: l.dash ? `2px dashed ${l.color}` : 'none',
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: l.color }}>{l.label}</span>
                    <span className="text-[10px] text-muted">— {l.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strictness hint */}
            <Card className="p-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Strictness</div>
              <div className="font-mono text-2xl text-primary font-bold mb-1">
                {Math.round(data.strictness_threshold * 100)}%
              </div>
              <p className="text-[10px] text-muted">Confidence threshold for 'supported' verdict.</p>
            </Card>
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
      <div className="h-6 bg-surface rounded w-1/2 skeleton-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <ClaimsSkeleton />
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 h-40 skeleton-pulse" />
      </div>
    </div>
  )
}

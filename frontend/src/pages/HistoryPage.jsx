import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Card, Spinner, EmptyState, ErrorBanner } from '../components/ui'

export function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchHistory() }, [])

  async function fetchHistory() {
    try {
      const data = await api.getHistory()
      setHistory(data.history || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = history.filter(h =>
    h.question_text?.toLowerCase().includes(search.toLowerCase())
  )

  // Compute total verdict counts across all history
  const totalSupported = history.reduce((s, h) => s + (h.supported_count || 0), 0)
  const totalContradicted = history.reduce((s, h) => s + (h.contradicted_count || 0), 0)

  return (
    <div className="min-h-screen bg-base">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-accent/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-1.5">History</h1>
          <p className="text-sm text-muted">Past queries and their verification results.</p>
        </div>

        {/* Stats summary */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface border border-border/60 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-primary">{history.length}</div>
              <div className="text-[11px] text-muted mt-0.5">Total queries</div>
            </div>
            <div className="bg-surface border border-supported/20 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-[#52b788]">{totalSupported}</div>
              <div className="text-[11px] text-muted mt-0.5">Supported claims</div>
            </div>
            <div className="bg-surface border border-contradicted/20 rounded-xl p-3 text-center">
              <div className="font-mono text-xl font-bold text-[#ef4444]">{totalContradicted}</div>
              <div className="text-[11px] text-muted mt-0.5">Contradicted claims</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/50 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries..."
            className="w-full bg-surface border border-border/70 text-primary placeholder:text-muted/50 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-xs text-muted mt-3">Loading history...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🕰"
            title={search ? 'No results match' : 'No queries yet'}
            description={search ? `No questions matching "${search}" found.` : 'Your verification history will appear here once you ask your first question.'}
            action={
              !search && (
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-accent/20"
                >
                  Ask your first question →
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => {
              const total = (h.supported_count || 0) + (h.unverifiable_count || 0) + (h.contradicted_count || 0)
              const hallucinationRisk = total > 0 ? ((h.contradicted_count || 0) / total) : 0
              const riskColor = hallucinationRisk > 0.3 ? '#ef4444' : hallucinationRisk > 0.1 ? '#f4a42e' : '#52b788'

              return (
                <Link key={h.id} to={`/result/${h.id}`}>
                  <Card hover className="p-4 cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary font-medium group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                          {h.question_text}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2">
                          <span className="text-[11px] font-mono text-muted/70 bg-surface border border-border/50 rounded px-1.5 py-0.5">
                            {h.model_name || 'gemini'}
                          </span>
                          <span className="text-[11px] text-muted/60">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          {(h.supported_count || 0) > 0 && (
                            <span className="text-xs font-mono text-[#52b788] bg-supported/8 border border-supported/20 rounded px-1.5 py-0.5">
                              {h.supported_count}✓
                            </span>
                          )}
                          {(h.unverifiable_count || 0) > 0 && (
                            <span className="text-xs font-mono text-[#f4a42e] bg-unverifiable/8 border border-unverifiable/20 rounded px-1.5 py-0.5">
                              {h.unverifiable_count}?
                            </span>
                          )}
                          {(h.contradicted_count || 0) > 0 && (
                            <span className="text-xs font-mono text-[#ef4444] bg-contradicted/8 border border-contradicted/20 rounded px-1.5 py-0.5">
                              {h.contradicted_count}✗
                            </span>
                          )}
                        </div>
                        {total > 0 && (
                          <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.round(((h.supported_count || 0) / total) * 100)}%`,
                                backgroundColor: riskColor,
                              }}
                            />
                          </div>
                        )}
                        <span className="text-muted text-xs group-hover:text-primary transition-colors">→</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-center text-xs text-muted/50 mt-4">
            Showing {filtered.length} of {history.length} queries
          </p>
        )}
      </div>
    </div>
  )
}

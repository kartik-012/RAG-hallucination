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

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">History</h1>
        <p className="text-sm text-muted mb-6">Past queries and their verification results.</p>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by question..."
            className="w-full bg-surface border border-border text-primary placeholder:text-muted text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent/60"
          />
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🕰"
            title="No questions asked yet"
            description="Your verification history will appear here."
            action={
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Ask your first question →
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => (
              <Link key={h.id} to={`/result/${h.id}`}>
                <Card className="p-4 hover:border-accent/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary font-medium truncate">{h.question_text}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-mono text-muted">{h.model_name || 'gemini'}</span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {h.supported_count > 0 && (
                        <span className="text-xs font-mono text-[#52b788]">{h.supported_count}✓</span>
                      )}
                      {h.unverifiable_count > 0 && (
                        <span className="text-xs font-mono text-[#f4a42e]">{h.unverifiable_count}?</span>
                      )}
                      {h.contradicted_count > 0 && (
                        <span className="text-xs font-mono text-[#ef4444]">{h.contradicted_count}✗</span>
                      )}
                      <span className="text-muted text-xs ml-1">→</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

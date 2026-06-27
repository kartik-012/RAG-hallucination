import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Card, Button, Spinner, MetricCard, EmptyState, ErrorBanner } from '../components/ui'
import { PrecisionRecallChart, CategoryBreakdownChart, ConfusionMatrix } from '../components/benchmark/Charts'

export function BenchmarkPage() {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchResults() }, [])

  async function fetchResults() {
    try {
      const data = await api.getBenchmarkResults()
      setBatches(data.batches || [])
      if (data.batches?.length > 0) {
        await loadBatch(data.batches[0].run_batch_id)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadBatch(batchId) {
    try {
      const data = await api.getBenchmarkBatch(batchId)
      setSelectedBatch(data)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleRunBenchmark() {
    setRunning(true)
    setError(null)
    try {
      const data = await api.runBenchmark()
      await fetchResults()
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const runs = selectedBatch?.runs || []

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Benchmark Dashboard</h1>
            <p className="text-sm text-muted">35 curated Q&A pairs with injected hallucinations. Real precision/recall numbers.</p>
          </div>
          <Button onClick={handleRunBenchmark} disabled={running} className="flex-shrink-0">
            {running ? <><Spinner size="sm" /> Running benchmark...</> : '▶ Run Full Benchmark'}
          </Button>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {/* Batch selector */}
        {batches.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {batches.map((b, i) => (
              <button
                key={b.run_batch_id}
                onClick={() => loadBatch(b.run_batch_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex-shrink-0 transition-all ${
                  selectedBatch?.run_batch_id === b.run_batch_id
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'border-border bg-surface text-muted hover:text-primary'
                }`}
              >
                Run {batches.length - i} · {new Date(b.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No benchmark results yet"
            description="Run the benchmark to test the detector's precision and recall on 35 curated Q&A pairs."
            action={
              <Button onClick={handleRunBenchmark} disabled={running}>
                {running ? 'Running...' : 'Run Benchmark'}
              </Button>
            }
          />
        ) : selectedBatch ? (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Precision"
                value={`${(selectedBatch.precision * 100).toFixed(1)}%`}
                sub="TP / (TP + FP)"
                color="text-[#52b788]"
              />
              <MetricCard
                label="Recall"
                value={`${(selectedBatch.recall * 100).toFixed(1)}%`}
                sub="TP / (TP + FN)"
                color="text-[#f4a42e]"
              />
              <MetricCard
                label="Accuracy"
                value={`${(selectedBatch.accuracy * 100).toFixed(1)}%`}
                sub={`${selectedBatch.correct} / ${selectedBatch.total_items} correct`}
                color="text-accent"
              />
              <MetricCard
                label="Items Tested"
                value={selectedBatch.total_items}
                sub="35 total benchmark items"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Precision / Recall Trend</div>
                {batches.length > 1 ? (
                  <PrecisionRecallChart batches={batches} />
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted text-sm">Run more benchmarks to see trend.</div>
                )}
              </Card>
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Accuracy by Category</div>
                <CategoryBreakdownChart runs={runs} />
              </Card>
            </div>

            {/* Confusion matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Confusion Matrix</div>
                <ConfusionMatrix runs={runs} />
              </Card>
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">About This Benchmark</div>
                <div className="text-sm text-muted leading-relaxed space-y-2">
                  <p>35 Q&A pairs covering AI/ML fundamentals, RAG systems, backend, and frontend topics.</p>
                  <p>Half contain deliberately injected hallucinations. The detector should flag those as contradicted or unverifiable.</p>
                  <p className="text-[11px] text-muted/60">NLI model: cross-encoder/nli-deberta-v3-base. Verification is never delegated back to the LLM.</p>
                </div>
              </Card>
            </div>

            {/* Results table */}
            <Card>
              <div className="p-4 border-b border-border">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Run Details</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-4 text-xs text-muted font-medium">Question</th>
                      <th className="text-left py-2 px-4 text-xs text-muted font-medium">Category</th>
                      <th className="text-left py-2 px-4 text-xs text-muted font-medium">Hallucinated</th>
                      <th className="text-left py-2 px-4 text-xs text-muted font-medium">Detector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/benchmark/${r.run_batch_id}/${r.id}`)}
                        className="border-b border-border hover:bg-surface cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 text-primary max-w-xs truncate">{r.question_text}</td>
                        <td className="py-2.5 px-4 text-muted text-xs">{r.category || '—'}</td>
                        <td className="py-2.5 px-4">
                          <span className={`text-xs font-mono ${r.contains_injected_hallucination ? 'text-[#ef4444]' : 'text-[#52b788]'}`}>
                            {r.contains_injected_hallucination ? '✗ Yes' : '✓ No'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-xs font-mono font-semibold ${r.detector_correct ? 'text-[#52b788]' : 'text-[#ef4444]'}`}>
                            {r.detector_correct ? '✓ Correct' : '✗ Wrong'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}

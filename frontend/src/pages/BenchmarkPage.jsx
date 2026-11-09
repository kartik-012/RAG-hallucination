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
      await api.runBenchmark()
      await fetchResults()
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const runs = selectedBatch?.runs || []

  // Calculate F1 if both precision and recall are available
  const f1 = selectedBatch
    ? (selectedBatch.precision + selectedBatch.recall > 0
        ? ((2 * selectedBatch.precision * selectedBatch.recall) / (selectedBatch.precision + selectedBatch.recall))
        : 0)
    : 0

  return (
    <div className="min-h-screen bg-base">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-accent/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1.5">Benchmark Dashboard</h1>
            <p className="text-sm text-muted">
              35 curated Q&amp;A pairs with injected hallucinations — real precision, recall, and accuracy numbers.
            </p>
          </div>
          <Button
            onClick={handleRunBenchmark}
            disabled={running}
            className="flex-shrink-0 mt-1"
          >
            {running ? (
              <><Spinner size="sm" /> Running benchmark...</>
            ) : (
              <>▶ Run Full Benchmark</>
            )}
          </Button>
        </div>

        {running && (
          <div className="mb-6 p-4 rounded-xl border border-accent/25 bg-accent/8 flex items-center gap-3 text-sm text-accent">
            <Spinner size="sm" />
            <div>
              <p className="font-semibold">Benchmark in progress...</p>
              <p className="text-xs text-accent/70 mt-0.5">This may take several minutes. The NLI model needs to verify every claim for all 35 items.</p>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-5" />}

        {/* Batch selector */}
        {batches.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {batches.map((b, i) => (
              <button
                key={b.run_batch_id}
                onClick={() => loadBatch(b.run_batch_id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono border flex-shrink-0 transition-all duration-150 ${
                  selectedBatch?.run_batch_id === b.run_batch_id
                    ? 'bg-accent/15 border-accent/35 text-accent'
                    : 'border-border bg-surface text-muted hover:text-primary hover:border-muted/50'
                }`}
              >
                Run {batches.length - i} · {new Date(b.created_at).toLocaleDateString()}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-xs text-muted mt-3">Loading benchmark data...</p>
            </div>
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No benchmark results yet"
            description="Run the benchmark to test the hallucination detector's precision and recall on 35 curated Q&A pairs with injected hallucinations."
            action={
              <Button onClick={handleRunBenchmark} disabled={running} size="lg">
                {running ? 'Running...' : '▶ Run Benchmark'}
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
                icon="🎯"
              />
              <MetricCard
                label="Recall"
                value={`${(selectedBatch.recall * 100).toFixed(1)}%`}
                sub="TP / (TP + FN)"
                color="text-[#f4a42e]"
                icon="🔁"
              />
              <MetricCard
                label="Accuracy"
                value={`${(selectedBatch.accuracy * 100).toFixed(1)}%`}
                sub={`${selectedBatch.correct}/${selectedBatch.total_items} correct`}
                color="text-accent"
                icon="✓"
              />
              <MetricCard
                label="F1 Score"
                value={`${(f1 * 100).toFixed(1)}%`}
                sub="Harmonic mean P·R"
                color="text-purple-400"
                icon="⚡"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Precision / Recall Trend</div>
                {batches.length > 1 ? (
                  <PrecisionRecallChart batches={batches} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-44 text-center">
                    <div className="text-3xl mb-2 opacity-30">📈</div>
                    <p className="text-sm text-muted">Run more benchmarks to see trends</p>
                  </div>
                )}
              </Card>
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Accuracy by Category</div>
                <CategoryBreakdownChart runs={runs} />
              </Card>
            </div>

            {/* Confusion matrix + info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Confusion Matrix</div>
                <ConfusionMatrix runs={runs} />
              </Card>
              <Card className="p-5">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">About This Benchmark</div>
                <div className="space-y-3 text-xs text-muted leading-relaxed">
                  <div className="flex gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <p>35 Q&amp;A pairs covering AI/ML fundamentals, RAG systems, backend, and frontend topics.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-[#f4a42e] mt-0.5">→</span>
                    <p>Half contain deliberately injected hallucinations. The detector should flag those as contradicted or unverifiable.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-[#52b788] mt-0.5">→</span>
                    <p>NLI model: <span className="font-mono text-primary">cross-encoder/nli-deberta-v3-base</span>. Verification is never delegated back to the LLM.</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent/60" />
                    <span className="font-mono text-[10px] text-muted/70">Batch ID: {selectedBatch.run_batch_id?.slice(0, 12)}...</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Results table */}
            <Card>
              <div className="p-4 border-b border-border/60 flex items-center justify-between">
                <div className="text-xs font-semibold text-muted uppercase tracking-widest">Run Details</div>
                <div className="text-xs text-muted font-mono">{runs.length} items</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-2.5 px-4 text-xs text-muted font-medium">#</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted font-medium">Question</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted font-medium">Category</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted font-medium">Hallucinated?</th>
                      <th className="text-left py-2.5 px-4 text-xs text-muted font-medium">Detector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r, i) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/40 hover:bg-surface/60 cursor-pointer transition-colors"
                        onClick={() => navigate(`/result/${r.generation_id}`)}
                      >
                        <td className="py-2.5 px-4 text-muted text-xs font-mono">{i + 1}</td>
                        <td className="py-2.5 px-4 text-primary max-w-xs truncate text-xs">{r.question_text}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] text-muted bg-surface border border-border/50 rounded px-1.5 py-0.5 font-mono">
                            {r.category || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-xs font-mono font-medium ${r.contains_injected_hallucination ? 'text-[#ef4444]' : 'text-[#52b788]'}`}>
                            {r.contains_injected_hallucination ? '✗ Yes' : '✓ No'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${
                            r.detector_correct
                              ? 'text-[#52b788] bg-supported/10 border-supported/25'
                              : 'text-[#ef4444] bg-contradicted/10 border-contradicted/25'
                          }`}>
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

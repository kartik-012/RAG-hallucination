import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button, Spinner, ErrorBanner, Card } from '../components/ui'

const EXAMPLE_QUESTIONS = [
  'What is retrieval-augmented generation?',
  'How does the attention mechanism work in transformers?',
  'What is ChromaDB and how does it differ from traditional databases?',
  'What are the main causes of hallucination in language models?',
]

const STEPS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Retrieve',
    desc: 'Semantic search finds the most relevant document chunks from your knowledge base',
  },
  {
    step: '02',
    icon: '✨',
    title: 'Generate',
    desc: 'Gemini generates an answer grounded strictly in the retrieved context',
  },
  {
    step: '03',
    icon: '🔬',
    title: 'Verify',
    desc: 'A local NLI model checks every sentence against source — independently from the LLM',
  },
]

export function HomePage() {
  const [question, setQuestion] = useState('')
  const [strictness, setStrictness] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)
  const navigate = useNavigate()

  const MAX = 500
  const invalid = touched && !question.trim()

  async function handleSubmit() {
    setTouched(true)
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.createQuery({ question_text: question.trim(), strictness_threshold: strictness })
      navigate(`/result/${result.id}`)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const strictnessLabel = strictness >= 0.8 ? 'Very Strict' : strictness >= 0.6 ? 'Balanced' : strictness >= 0.4 ? 'Lenient' : 'Very Lenient'
  const strictnessColor = strictness >= 0.8 ? 'text-[#ef4444]' : strictness >= 0.6 ? 'text-[#f4a42e]' : 'text-[#52b788]'

  return (
    <div className="min-h-screen bg-base">
      {/* Background gradient decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-supported/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-24">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/8 border border-accent/15 text-accent text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot" />
            NLI-powered &nbsp;·&nbsp; Sentence-level &nbsp;·&nbsp; Model-agnostic
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
            <span className="text-primary">Ask a question.</span>
            <br />
            <span className="gradient-text">We'll fact-check the answer.</span>
          </h1>

          <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
            Every sentence in the AI's answer is verified claim-by-claim against source documents
            using a <span className="text-primary font-medium">local NLI model</span> — never asking the same LLM to judge itself.
          </p>
        </div>

        {/* Main input card */}
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <Card className="p-6 mb-4 border-border/60 shadow-2xl shadow-black/40">
            <div className="mb-5">
              <div className="relative group">
                <textarea
                  value={question}
                  onChange={(e) => { setQuestion(e.target.value); setTouched(false) }}
                  onKeyDown={handleKey}
                  placeholder="Ask anything answerable from the document library..."
                  rows={4}
                  maxLength={MAX}
                  className={`w-full bg-base border rounded-xl px-4 py-3.5 text-primary placeholder:text-muted/60 text-sm resize-none focus:outline-none transition-all duration-200 ${
                    invalid
                      ? 'border-[#9b2c2c] focus:ring-2 focus:ring-[#9b2c2c]/25'
                      : 'border-border focus:ring-2 focus:ring-accent/20 focus:border-accent/50'
                  }`}
                />
                <span className={`absolute bottom-3 right-3 text-[11px] font-mono tabular-nums transition-colors ${
                  question.length > MAX * 0.9 ? 'text-[#f4a42e]' : 'text-muted/50'
                }`}>
                  {question.length}/{MAX}
                </span>
              </div>
              {invalid && (
                <p className="text-xs text-[#ef4444] mt-1.5 flex items-center gap-1">
                  <span>⚠</span> Please enter a question before verifying.
                </p>
              )}
            </div>

            {/* Strictness slider */}
            <div className="mb-5 p-4 bg-base rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <label className="text-xs font-semibold text-primary">Verification Strictness</label>
                  <p className="text-[11px] text-muted mt-0.5">How confident the NLI model must be to call a claim "Supported"</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-sm font-bold ${strictnessColor}`}>{strictness.toFixed(2)}</span>
                  <p className={`text-[10px] font-medium ${strictnessColor}`}>{strictnessLabel}</p>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={strictness}
                onChange={(e) => setStrictness(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted/60 mt-1">
                <span>0.0 — Lenient (fewer flags)</span>
                <span>1.0 — Strict (more flags)</span>
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={handleSubmit} className="mb-4" />}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Retrieving &amp; generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Answer
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-muted/50 mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-surface border border-border font-mono text-[9px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-surface border border-border font-mono text-[9px]">Enter</kbd> to submit
            </p>
          </Card>
        </div>

        {/* Example questions */}
        <div className="animate-fade-up" style={{ animationDelay: '140ms' }}>
          <p className="text-[11px] text-muted/60 mb-3 text-center uppercase tracking-widest font-medium">Try an example</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); setTouched(false) }}
                className="text-left px-3.5 py-3 rounded-xl border border-border/60 bg-surface/50 hover:border-accent/30 hover:bg-accent/5 text-xs text-muted hover:text-primary transition-all duration-200 group"
              >
                <span className="text-accent/60 mr-1.5 group-hover:text-accent transition-colors">→</span>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-14 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="text-[11px] text-muted/60 mb-4 text-center uppercase tracking-widest font-medium">How it works</p>
          <div className="grid grid-cols-3 gap-3">
            {STEPS.map(({ step, icon, title, desc }) => (
              <div key={step} className="relative bg-surface border border-border/60 rounded-xl p-4 overflow-hidden group hover:border-border transition-all duration-200">
                <div className="absolute top-0 right-0 text-[80px] leading-none opacity-[0.03] font-mono font-bold select-none">
                  {step}
                </div>
                <div className="text-2xl mb-2.5">{icon}</div>
                <div className="text-xs font-mono text-accent/70 mb-1">{step}</div>
                <div className="text-sm font-semibold text-primary mb-1.5">{title}</div>
                <div className="text-[11px] text-muted leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '260ms' }}>
          {[
            { value: '35', label: 'Benchmark items', color: 'text-accent' },
            { value: '3', label: 'Verdict types', color: 'text-[#52b788]' },
            { value: '100%', label: 'Local NLI verify', color: 'text-[#f4a42e]' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center py-4 border border-border/40 rounded-xl bg-surface/30">
              <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-[11px] text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

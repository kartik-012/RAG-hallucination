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

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            NLI-powered • Sentence-level • Model-agnostic
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-4">
            Ask a question.<br />
            <span className="text-muted font-light">We'll show you what's actually true.</span>
          </h1>
          <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
            Every sentence in the AI's answer is verified claim-by-claim against the source documents using a local NLI model — never asking the same LLM to judge itself.
          </p>
        </div>

        {/* Main input card */}
        <Card className="p-6 mb-4">
          <div className="mb-4">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); setTouched(false) }}
                onKeyDown={handleKey}
                placeholder="Ask any question answerable from the document library..."
                rows={4}
                maxLength={MAX}
                className={`w-full bg-base border rounded-lg px-4 py-3 text-primary placeholder:text-muted text-sm resize-none focus:outline-none focus:ring-2 transition-all ${
                  invalid
                    ? 'border-[#9b2c2c] focus:ring-[#9b2c2c]/30'
                    : 'border-border focus:ring-accent/30 focus:border-accent/60'
                }`}
              />
              <span className="absolute bottom-3 right-3 text-xs font-mono text-muted">
                {question.length}/{MAX}
              </span>
            </div>
            {invalid && (
              <p className="text-xs text-[#ef4444] mt-1.5">Please enter a question before verifying.</p>
            )}
          </div>

          {/* Strictness slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">Strictness threshold</label>
              <span className="font-mono text-xs text-primary">{strictness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={strictness}
              onChange={(e) => setStrictness(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>Lenient (fewer flags)</span>
              <span>Strict (more flags)</span>
            </div>
          </div>

          {error && <ErrorBanner message={error} onRetry={handleSubmit} className="mb-4" />}

          <Button onClick={handleSubmit} disabled={loading} className="w-full py-2.5">
            {loading ? (
              <>
                <Spinner size="sm" />
                Retrieving & generating...
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

          <p className="text-center text-[10px] text-muted mt-2">
            Ctrl+Enter to submit
          </p>
        </Card>

        {/* Example questions */}
        <div>
          <p className="text-xs text-muted mb-3 text-center uppercase tracking-wider">Try an example</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); setTouched(false) }}
                className="text-left px-3 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-accent/5 text-xs text-muted hover:text-primary transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { step: '01', title: 'Retrieve', desc: 'Finds top matching document chunks via semantic search' },
            { step: '02', title: 'Generate', desc: 'Gemini answers using only the retrieved context' },
            { step: '03', title: 'Verify', desc: 'Local NLI model checks each claim against the sources' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-surface border border-border rounded-xl p-4">
              <div className="font-mono text-xs text-accent mb-2">{step}</div>
              <div className="text-sm font-semibold text-primary mb-1">{title}</div>
              <div className="text-[11px] text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

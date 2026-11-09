import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Card, Button, Spinner, EmptyState, ErrorBanner, Toast } from '../components/ui'

export function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', source_label: '', trust_weight: 'medium', full_text: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    try {
      const data = await api.listDocuments()
      setDocs(data.documents || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newDoc.title.trim() || !newDoc.full_text.trim()) return
    setAdding(true)
    try {
      await api.addDocument(newDoc)
      setToast({ message: 'Document added and indexed!', type: 'success' })
      setShowAdd(false)
      setNewDoc({ title: '', source_label: '', trust_weight: 'medium', full_text: '' })
      fetchDocs()
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setAdding(false)
    }
  }

  async function handleTrustChange(docId, trust) {
    try {
      await api.updateTrust(docId, trust)
      setDocs(docs.map(d => d.id === docId ? { ...d, trust_weight: trust } : d))
      setToast({ message: 'Trust weight updated', type: 'success' })
    } catch (e) {
      setToast({ message: e.message, type: 'error' })
    }
  }

  const TRUST_COLORS = { high: 'text-[#52b788]', medium: 'text-[#f4a42e]', low: 'text-muted' }

  return (
    <div className="min-h-screen bg-base">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1.5">Document Library</h1>
            <p className="text-sm text-muted">Manage the knowledge base that grounds your AI's answers.</p>
          </div>
          <Button 
            onClick={() => setShowAdd(!showAdd)} 
            variant={showAdd ? 'ghost' : 'primary'}
            className="flex-shrink-0 mt-1"
          >
            {showAdd ? 'Cancel' : '+ Add Document'}
          </Button>
        </div>

        {error && <ErrorBanner message={error} className="mb-5 animate-fade-up" />}

        {showAdd && (
          <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
            <Card className="p-6 mb-8 border-accent/20 shadow-lg shadow-accent/5">
              <h3 className="text-sm font-semibold text-primary mb-5 flex items-center gap-2">
                <span className="text-accent">📄</span> Add New Document
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">Title <span className="text-[#ef4444]">*</span></label>
                    <input
                      value={newDoc.title}
                      onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="e.g. Q3 Earnings Report"
                      className="w-full bg-surface border border-border/70 text-primary text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">Source Label</label>
                    <input
                      value={newDoc.source_label}
                      onChange={e => setNewDoc({ ...newDoc, source_label: e.target.value })}
                      placeholder="e.g. Financials, Wikipedia"
                      className="w-full bg-surface border border-border/70 text-primary text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">Trust Weight</label>
                  <p className="text-[10px] text-muted/70 mb-2">Affects the NLI model's confidence penalty when evaluating claims against this source.</p>
                  <select
                    value={newDoc.trust_weight}
                    onChange={e => setNewDoc({ ...newDoc, trust_weight: e.target.value })}
                    className="w-full md:w-1/2 bg-surface border border-border/70 text-primary text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                  >
                    <option value="high">High (1.2x confidence multiplier)</option>
                    <option value="medium">Medium (1.0x confidence multiplier)</option>
                    <option value="low">Low (0.8x confidence multiplier)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">Content <span className="text-[#ef4444]">*</span></label>
                  <textarea
                    value={newDoc.full_text}
                    onChange={e => setNewDoc({ ...newDoc, full_text: e.target.value })}
                    placeholder="Paste the full document text here. It will be automatically chunked and embedded..."
                    rows={8}
                    className="w-full bg-surface border border-border/70 text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all resize-y"
                  />
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleAdd} 
                    disabled={adding || !newDoc.title.trim() || !newDoc.full_text.trim()}
                    className="w-full md:w-auto"
                  >
                    {adding ? <><Spinner size="sm" /> Chunking & Indexing...</> : 'Add & Index Document'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-xs text-muted mt-3">Loading documents...</p>
            </div>
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon="📄"
            title="Knowledge base is empty"
            description="Run the python seed script (python -m app.db.seed) or add a document manually to get started."
            action={
              <Button onClick={() => setShowAdd(true)}>
                + Add First Document
              </Button>
            }
          />
        ) : (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between px-1 mb-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <span>{docs.length} Documents</span>
              <span>Metadata & Settings</span>
            </div>
            
            {docs.map((doc, idx) => (
              <Card key={doc.id} hover className="p-4 flex items-center justify-between gap-6" style={{ animationDelay: `${100 + (idx * 30)}ms` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-primary truncate" title={doc.title}>{doc.title}</span>
                    {doc.source_label && (
                      <span className="text-[10px] font-mono text-muted bg-surface/50 border border-border/50 rounded px-1.5 py-0.5 flex-shrink-0">
                        {doc.source_label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted/80">
                    <span className="font-mono bg-border/30 px-1.5 py-0.5 rounded text-[10px]">{doc.chunk_count} chunks</span>
                    <span>·</span>
                    <span>Added {new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0 bg-surface/50 px-3 py-2 rounded-lg border border-border/40">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Trust:</span>
                  <select
                    value={doc.trust_weight}
                    onChange={e => handleTrustChange(doc.id, e.target.value)}
                    className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer ${TRUST_COLORS[doc.trust_weight]}`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

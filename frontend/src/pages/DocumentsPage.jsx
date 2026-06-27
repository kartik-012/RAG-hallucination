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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Document Library</h1>
            <p className="text-sm text-muted">The knowledge base the AI answers are grounded in.</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Document'}
          </Button>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {/* Add document form */}
        {showAdd && (
          <Card className="p-5 mb-6">
            <h3 className="text-sm font-semibold text-primary mb-4">Add New Document</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Title *</label>
                  <input
                    value={newDoc.title}
                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Document title"
                    className="w-full bg-base border border-border text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent/60"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Source Label</label>
                  <input
                    value={newDoc.source_label}
                    onChange={e => setNewDoc({ ...newDoc, source_label: e.target.value })}
                    placeholder="e.g. Research Paper"
                    className="w-full bg-base border border-border text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Trust Weight</label>
                <select
                  value={newDoc.trust_weight}
                  onChange={e => setNewDoc({ ...newDoc, trust_weight: e.target.value })}
                  className="bg-base border border-border text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent/60"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Content *</label>
                <textarea
                  value={newDoc.full_text}
                  onChange={e => setNewDoc({ ...newDoc, full_text: e.target.value })}
                  placeholder="Paste document text here..."
                  rows={6}
                  className="w-full bg-base border border-border text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent/60 resize-none"
                />
              </div>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? <><Spinner size="sm" /> Indexing...</> : 'Add & Index Document'}
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No documents yet"
            description="Run the seed script or add a document above to populate the knowledge base."
          />
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary truncate">{doc.title}</span>
                      <span className="text-xs text-muted border border-border rounded px-1.5 py-0.5 flex-shrink-0">{doc.source_label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted">{doc.chunk_count} chunks</span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted">Trust:</span>
                    <select
                      value={doc.trust_weight}
                      onChange={e => handleTrustChange(doc.id, e.target.value)}
                      className={`bg-surface border border-border text-xs rounded px-2 py-1 focus:outline-none font-medium ${TRUST_COLORS[doc.trust_weight]}`}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
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

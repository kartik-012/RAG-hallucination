const BASE = ''

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  health: () => req('GET', '/health'),

  // Query
  createQuery: (data) => req('POST', '/query', data),
  getQuery: (id) => req('GET', `/query/${id}`),
  compareModels: (id, data) => req('POST', `/query/${id}/compare`, data),

  // Benchmark
  runBenchmark: () => req('POST', '/benchmark/run'),
  getBenchmarkResults: () => req('GET', '/benchmark/results'),
  getBenchmarkBatch: (id) => req('GET', `/benchmark/results/${id}`),

  // Documents
  listDocuments: () => req('GET', '/documents'),
  addDocument: (data) => req('POST', '/documents', data),
  updateTrust: (id, trust_weight) =>
    req('PATCH', `/documents/${id}/trust?trust_weight=${trust_weight}`),

  // Settings
  getSettings: () => req('GET', '/settings'),
  updateSettings: (data) => req('PATCH', '/settings', data),

  // History
  getHistory: () => req('GET', '/history'),
}

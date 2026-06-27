import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const DARK_TOOLTIP = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#f4f4f5',
    fontSize: '12px',
  },
  itemStyle: { color: '#f4f4f5' },
}

export function PrecisionRecallChart({ batches }) {
  const data = batches.slice(0, 10).reverse().map((b, i) => ({
    run: `Run ${i + 1}`,
    precision: +(b.precision * 100 || 0).toFixed(1),
    recall: +(b.recall * 100 || 0).toFixed(1),
    accuracy: +(b.accuracy * 100 || 0).toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="run" tick={{ fill: '#71717a', fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
        <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ color: '#71717a', fontSize: 11 }} />
        <Line type="monotone" dataKey="precision" stroke="#52b788" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="recall" stroke="#f4a42e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryBreakdownChart({ runs }) {
  // Group by category
  const categories = {}
  for (const r of runs) {
    const cat = r.category || 'General'
    if (!categories[cat]) categories[cat] = { name: cat, correct: 0, total: 0 }
    categories[cat].total++
    if (r.detector_correct) categories[cat].correct++
  }

  const data = Object.values(categories).map((c) => ({
    name: c.name,
    accuracy: +((c.correct / c.total) * 100).toFixed(1),
    total: c.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
        <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
        <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
        <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ConfusionMatrix({ runs }) {
  // Compute TP, TN, FP, FN
  let tp = 0, tn = 0, fp = 0, fn = 0
  for (const r of runs) {
    const actual = !!r.contains_injected_hallucination
    const predicted = r.detector_correct === actual ? actual : !actual

    // detector_correct = 1 means detector was right
    // if actual=hallucination and correct → TP
    // if actual=clean and correct → TN
    // if actual=clean and wrong → FP (flagged clean as hallucinated)
    // if actual=hallucination and wrong → FN (missed hallucination)
    if (r.detector_correct) {
      if (actual) tp++
      else tn++
    } else {
      if (!actual) fp++
      else fn++
    }
  }

  const cells = [
    { label: 'TP', value: tp, color: 'rgba(45, 106, 79, 0.6)', sub: 'True Positive' },
    { label: 'FN', value: fn, color: 'rgba(155, 44, 44, 0.3)', sub: 'False Negative' },
    { label: 'FP', value: fp, color: 'rgba(155, 44, 44, 0.3)', sub: 'False Positive' },
    { label: 'TN', value: tn, color: 'rgba(45, 106, 79, 0.4)', sub: 'True Negative' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg p-4 text-center"
            style={{ backgroundColor: c.color, border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="font-mono text-2xl font-bold text-primary">{c.value}</div>
            <div className="font-mono text-xs font-semibold text-primary/80 mt-1">{c.label}</div>
            <div className="text-[10px] text-primary/60 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted px-1">
        <span>← Predicted: No</span>
        <span>Predicted: Yes →</span>
      </div>
    </div>
  )
}

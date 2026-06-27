// Generic reusable UI primitives

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-xl ${className}`}>
      {children}
    </div>
  )
}

export function Badge({ verdict, children, className = '' }) {
  const configs = {
    supported: 'bg-supported/20 text-[#52b788] border border-supported/30',
    unverifiable: 'bg-unverifiable/20 text-[#f4a42e] border border-unverifiable/30',
    contradicted: 'bg-contradicted/20 text-[#ef4444] border border-contradicted/30',
    neutral: 'bg-surface text-muted border border-border',
  }
  const cls = configs[verdict] || configs.neutral
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium ${cls} ${className}`}>
      {children}
    </span>
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', className = '', type = 'button' }) {
  const variants = {
    primary: 'bg-accent hover:bg-accent/90 text-white',
    ghost: 'bg-transparent hover:bg-surface text-muted hover:text-primary border border-border',
    danger: 'bg-contradicted/20 hover:bg-contradicted/30 text-[#ef4444] border border-contradicted/30',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <svg className={`animate-spin ${s} text-accent`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function MetricCard({ label, value, sub, color }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className={`font-mono text-3xl font-bold ${color || 'text-primary'}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </Card>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-contradicted/10 border border-contradicted/30 rounded-lg text-sm text-[#ef4444]">
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs underline hover:no-underline text-[#ef4444]">
          Retry
        </button>
      )}
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'bg-supported/20 border-supported/30 text-[#52b788]',
    error: 'bg-contradicted/20 border-contradicted/30 text-[#ef4444]',
    info: 'bg-accent/20 border-accent/30 text-accent',
  }
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}

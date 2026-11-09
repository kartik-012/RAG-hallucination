// Generic reusable UI primitives

export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`bg-surface border border-border rounded-xl transition-all duration-200 ${hover ? 'hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Badge({ verdict, children, className = '' }) {
  const configs = {
    supported: 'bg-supported/15 text-[#52b788] border border-supported/30',
    unverifiable: 'bg-unverifiable/15 text-[#f4a42e] border border-unverifiable/30',
    contradicted: 'bg-contradicted/15 text-[#ef4444] border border-contradicted/30',
    neutral: 'bg-surface text-muted border border-border',
  }
  const cls = configs[verdict] || configs.neutral
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium ${cls} ${className}`}>
      {children}
    </span>
  )
}

export function Button({ children, onClick, disabled, variant = 'primary', className = '', type = 'button', size = 'md' }) {
  const variants = {
    primary: 'bg-accent hover:bg-blue-500 text-white shadow-lg shadow-accent/20 hover:shadow-accent/30',
    ghost: 'bg-transparent hover:bg-surface text-muted hover:text-primary border border-border hover:border-muted',
    danger: 'bg-contradicted/10 hover:bg-contradicted/20 text-[#ef4444] border border-contradicted/30',
    success: 'bg-supported/10 hover:bg-supported/20 text-[#52b788] border border-supported/30',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <svg className={`animate-spin ${s} text-accent`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function MetricCard({ label, value, sub, color, icon }) {
  return (
    <Card className="p-5 relative overflow-hidden group hover:border-border/80 transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className={`font-mono text-3xl font-bold ${color || 'text-primary'}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
    </Card>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-base font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}

export function ErrorBanner({ message, onRetry, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-contradicted/8 border border-contradicted/25 rounded-lg text-sm text-[#ef4444] ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-base">⚠</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs underline hover:no-underline text-[#ef4444] flex-shrink-0 font-medium">
          Retry
        </button>
      )}
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'bg-supported/15 border-supported/30 text-[#52b788]',
    error: 'bg-contradicted/15 border-contradicted/30 text-[#ef4444]',
    info: 'bg-accent/15 border-accent/30 text-accent',
  }
  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium shadow-2xl animate-slide-right ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-1">✕</button>
    </div>
  )
}

export function StatusPill({ status }) {
  const configs = {
    complete: { label: 'Complete', color: 'text-[#52b788]', bg: 'bg-supported/10 border-supported/20', dot: 'bg-[#52b788]' },
    verifying: { label: 'Verifying', color: 'text-[#f4a42e]', bg: 'bg-unverifiable/10 border-unverifiable/20', dot: 'bg-[#f4a42e]' },
    generating: { label: 'Generating', color: 'text-accent', bg: 'bg-accent/10 border-accent/20', dot: 'bg-accent' },
    error: { label: 'Error', color: 'text-[#ef4444]', bg: 'bg-contradicted/10 border-contradicted/20', dot: 'bg-[#ef4444]' },
  }
  const cfg = configs[status] || configs.complete
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} status-dot`} />
      {cfg.label}
    </span>
  )
}

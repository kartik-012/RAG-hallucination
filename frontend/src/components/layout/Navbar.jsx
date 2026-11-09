import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Ask', icon: '✦' },
  { to: '/history', label: 'History', icon: '⏱' },
  { to: '/benchmark', label: 'Benchmark', icon: '📊' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-base/85 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-purple-500/20 border border-accent/25 flex items-center justify-center shadow-lg shadow-accent/10">
            <span className="text-accent text-sm font-mono font-bold">RA</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-primary text-sm tracking-tight leading-none">RAG Auditor</span>
            <span className="text-[10px] text-muted/60 leading-none mt-0.5">Hallucination Detector</span>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ to, label, icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  active
                    ? 'bg-surface text-primary border border-border/80 shadow-sm'
                    : 'text-muted hover:text-primary hover:bg-surface/50'
                }`}
              >
                <span className="text-[11px] opacity-70">{icon}</span>
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

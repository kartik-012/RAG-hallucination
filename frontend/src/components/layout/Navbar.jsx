import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Ask' },
  { to: '/history', label: 'History' },
  { to: '/benchmark', label: 'Benchmark' },
  { to: '/documents', label: 'Documents' },
  { to: '/settings', label: 'Settings' },
]

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-accent text-sm font-mono font-bold">RA</span>
          </div>
          <span className="font-semibold text-primary text-sm tracking-tight">
            RAG Auditor
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-surface text-primary border border-border'
                    : 'text-muted hover:text-primary hover:bg-surface/60'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

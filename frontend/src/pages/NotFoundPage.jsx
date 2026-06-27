import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="font-mono text-6xl text-muted mb-4">404</div>
        <h1 className="text-xl font-semibold text-primary mb-2">Page not found</h1>
        <p className="text-muted text-sm mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

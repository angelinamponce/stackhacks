// Shown when a Sanity request fails, so a section never renders empty without explanation.
const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

export default function LoadError({ what, className = '' }) {
  return (
    <div role="alert" className={`mx-auto max-w-md rounded-2xl border border-accent/30 bg-accent/[0.04] px-5 py-4 text-center ${className}`}>
      <p className="text-sm text-primary">Couldn't load {what} right now.</p>
      {isLocal && (
        <p className="mt-1 text-xs leading-relaxed text-secondary">
          The Sanity request failed. Locally, only <code className="text-accent">http://localhost:5173</code> is on the
          project's CORS allowlist; other ports or 127.0.0.1 are blocked.
        </p>
      )}
      <button type="button" onClick={() => window.location.reload()} className="btn-secondary mt-3 !px-4 !py-1.5 text-xs">
        Try again
      </button>
    </div>
  )
}

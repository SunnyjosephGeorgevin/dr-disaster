/**
 * Displays which link is currently active, using the exact wording style
 * called for in the spec. Input: WebSocket stream (connectivity.link,
 * connectivity.message, connectivity.stale).
 *
 * Deliberately text-first: a labeled badge, not a decorative signal-bars
 * icon, per the "restrained visual language" requirement.
 */
export default function ConnectivityBadge({ connectivity }) {
  if (!connectivity) {
    return (
      <div className="badge">
        <span className="dot" />
        <span>Connecting to stream…</span>
      </div>
    )
  }

  const tone = connectivity.link === 'none' ? 'danger' : connectivity.link === 'lora' ? 'warn' : 'ok'

  return (
    <div className={`badge ${tone}`}>
      <span className="dot" />
      <span>{connectivity.message}</span>
    </div>
  )
}

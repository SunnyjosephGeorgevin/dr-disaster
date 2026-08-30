/** Input: WebSocket stream (mission_status). */
export default function MissionStatus({ status }) {
  const tone = status === 'DEGRADED' ? 'degraded' : 'active'
  return <div className={`mission-badge ${tone}`}>MISSION — {status || '—'}</div>
}

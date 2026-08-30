/**
 * Renders every active degraded-mode reason as its own banner line, e.g.
 * "Thermal sensor unavailable – RGB-only perception active." or the
 * connectivity-driven messages the backend appends automatically
 * (LoRa / no-link). Input: WebSocket stream (degraded_reasons[]).
 *
 * Never hides degraded state — if the array is empty, nothing renders;
 * there is no "dismiss" affordance that could hide a real degradation.
 */
export default function DegradedBanner({ reasons }) {
  if (!reasons || reasons.length === 0) return null

  return (
    <div className="banner-stack">
      {reasons.map((reason, i) => (
        <div className="banner" key={i}>{reason}</div>
      ))}
    </div>
  )
}

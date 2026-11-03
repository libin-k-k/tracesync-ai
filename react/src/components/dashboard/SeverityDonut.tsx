import { severityBreakdown } from '../../data/dashboardDemo'

const total = severityBreakdown.reduce((sum, item) => sum + item.value, 0)

function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polar(cx, cy, radius, endAngle)
  const end = polar(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function SeverityDonut() {
  const cx = 90
  const cy = 90
  const radius = 68
  let cursor = 0

  const segments = severityBreakdown.map((item) => {
    const sweep = (item.value / total) * 360
    const start = cursor
    const end = cursor + sweep
    cursor = end
    return { ...item, start, end }
  })

  return (
    <section className="glass-panel dash-donut-panel" aria-labelledby="severity-title">
      <div className="dash-panel-head">
        <div>
          <h2 className="dash-panel-title" id="severity-title">
            Errors by Severity
          </h2>
          <p className="text-muted dash-panel-subtitle">Distribution this week</p>
        </div>
      </div>

      <div className="dash-donut-body">
        <div className="dash-donut-chart">
          <svg viewBox="0 0 180 180" role="img" aria-label="Severity donut chart">
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--color-divider)"
              strokeWidth="18"
            />
            {segments.map((item) => (
              <path
                key={item.id}
                className={`dash-donut-arc dash-donut-arc-${item.tone}`}
                d={arcPath(cx, cy, radius, item.start, item.end - 0.8)}
                fill="none"
                strokeWidth="18"
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="dash-donut-center">
            <span className="dash-donut-total">{total.toLocaleString()}</span>
            <span className="text-muted">Total Errors</span>
          </div>
        </div>

        <ul className="dash-donut-legend">
          {severityBreakdown.map((item) => (
            <li key={item.id} className="dash-donut-legend-item">
              <span className={`dash-donut-swatch dash-donut-swatch-${item.tone}`} />
              <span className="dash-donut-legend-label">{item.label}</span>
              <span className="dash-donut-legend-value">{item.value.toLocaleString()}</span>
              <span className="text-muted">{item.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

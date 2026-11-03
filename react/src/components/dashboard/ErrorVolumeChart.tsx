import { useMemo, useState } from 'react'
import { volumeHighlight, volumeSeries } from '../../data/dashboardDemo'

const modes = ['Volume', 'Status', 'Severity'] as const

export function ErrorVolumeChart() {
  const [mode, setMode] = useState<(typeof modes)[number]>('Volume')

  const path = useMemo(() => {
    const width = 560
    const height = 220
    const padX = 8
    const padY = 18
    const max = Math.max(...volumeSeries.map((point) => point.value))
    const min = Math.min(...volumeSeries.map((point) => point.value)) * 0.72
    const span = max - min || 1

    const points = volumeSeries.map((point, index) => {
      const x = padX + (index / (volumeSeries.length - 1)) * (width - padX * 2)
      const y = height - padY - ((point.value - min) / span) * (height - padY * 2)
      return { x, y, ...point }
    })

    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ')

    const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`
    const highlight = points[volumeHighlight.index]

    return { width, height, line, area, highlight }
  }, [])

  return (
    <section className="glass-panel dash-chart-panel" aria-labelledby="volume-title">
      <div className="dash-panel-head">
        <div>
          <h2 className="dash-panel-title" id="volume-title">
            Error Volume
          </h2>
          <p className="text-muted dash-panel-subtitle">Last 12 days</p>
        </div>
        <div className="dash-seg" role="tablist" aria-label="Chart mode">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              className={mode === item ? 'dash-seg-btn is-active' : 'dash-seg-btn'}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-chart-frame">
        <svg
          className="dash-volume-svg"
          viewBox={`0 0 ${path.width} ${path.height}`}
          role="img"
          aria-label="Error volume area chart"
        >
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.55" />
              <stop offset="55%" stopColor="var(--color-accent-primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0" />
            </linearGradient>
            <filter id="volumeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="dash-volume-area" d={path.area} fill="url(#volumeFill)" />
          <path
            className="dash-volume-line"
            d={path.line}
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#volumeGlow)"
          />
          <circle
            className="dash-volume-dot"
            cx={path.highlight.x}
            cy={path.highlight.y}
            r="5.5"
            fill="var(--color-accent-primary)"
            stroke="var(--color-bg-base)"
            strokeWidth="3"
          />
        </svg>

        <div className="dash-chart-tooltip anim-fade-in-up">
          <strong>
            {volumeHighlight.label}: {volumeHighlight.value.toLocaleString()} errors
          </strong>
        </div>
      </div>
    </section>
  )
}

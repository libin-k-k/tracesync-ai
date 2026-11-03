import { dashboardKpis } from '../../data/dashboardDemo'
import {
  IconKpiCheck,
  IconKpiSpark,
  IconKpiStack,
  IconKpiWarning,
} from './icons'

const icons = {
  warning: IconKpiWarning,
  stack: IconKpiStack,
  check: IconKpiCheck,
  spark: IconKpiSpark,
} as const

export function KpiStrip() {
  return (
    <section className="kpi-strip" aria-label="Workspace metrics">
      {dashboardKpis.map((item) => {
        const Icon = icons[item.icon]
        return (
          <article key={item.id} className="kpi-card glass">
            <div className="kpi-card-top">
              <span className={`kpi-icon kpi-icon-${item.icon}`} aria-hidden="true">
                <Icon />
              </span>
            </div>
            <p className="kpi-label">{item.label}</p>
            <p className="kpi-value">{item.value}</p>
            <p
              className={
                item.deltaTone === 'up'
                  ? 'kpi-delta is-up'
                  : item.deltaTone === 'down' || item.deltaTone === 'good'
                    ? 'kpi-delta is-good'
                    : 'kpi-delta'
              }
            >
              {item.deltaTone === 'up' ? '↑ ' : item.deltaTone === 'down' ? '↓ ' : ''}
              {item.delta}
            </p>
          </article>
        )
      })}
    </section>
  )
}

import { AiInsightCard } from '../components/dashboard/AiInsightCard'
import { ErrorVolumeChart } from '../components/dashboard/ErrorVolumeChart'
import { KpiStrip } from '../components/dashboard/KpiStrip'
import { SeverityDonut } from '../components/dashboard/SeverityDonut'

export function DashboardPage() {
  return (
    <div className="dash-page dash-overview anim-fade-in-up">
      <KpiStrip />

      <div className="dash-grid-charts">
        <ErrorVolumeChart />
        <SeverityDonut />
      </div>

      <AiInsightCard />
    </div>
  )
}

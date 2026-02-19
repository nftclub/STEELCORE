'use client';

import type { Workout } from '../lib/db';
import {
  getAcuteLoad,
  getChronicLoad,
  getRatio,
  getTrendLabel,
} from '../lib/calculations';

interface Props {
  workouts: Workout[];
}

export default function LoadMetrics({ workouts }: Props) {
  const acute   = getAcuteLoad(workouts);
  const chronic = getChronicLoad(workouts);
  const ratio   = getRatio(acute, chronic);
  const trend   = getTrendLabel(ratio);

  return (
    <div className="sc-metrics-grid">

      <div className="sc-metric">
        <span className="sc-metric-label">Acute</span>
        <span className="sc-metric-value">{acute.toFixed(0)}</span>
        <span className="sc-metric-sub">7-day sum</span>
      </div>

      <div className="sc-metric">
        <span className="sc-metric-label">Chronic</span>
        <span className="sc-metric-value">{chronic.toFixed(0)}</span>
        <span className="sc-metric-sub">28-day avg</span>
      </div>

      <div className="sc-metric">
        <span className="sc-metric-label">Ratio</span>
        <span className="sc-metric-value">{ratio.toFixed(2)}</span>
        <span className="sc-metric-sub">acute / chronic</span>
      </div>

      <div className="sc-metric">
        <span className="sc-metric-label">Trend</span>
        <span className="sc-metric-value is-trend">{trend || '—'}</span>
      </div>

    </div>
  );
}

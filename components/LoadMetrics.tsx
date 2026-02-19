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

// Zone bar: ratio clamped to 0–2.0 range, marker position as percentage
function getZonePosition(ratio: number): number {
  const clamped = Math.min(Math.max(ratio, 0), 2.0);
  return (clamped / 2.0) * 100;
}

function getZoneColor(ratio: number): string {
  if (ratio < 0.8)             return '#4a9eff'; // blue — reduced
  if (ratio <= 1.3)            return '#4caf7d'; // green — stable
  if (ratio <= 1.5)            return '#f0a500'; // amber — elevated
  return '#e05a2b';                               // orange-red — high
}

export default function LoadMetrics({ workouts }: Props) {
  const acute   = getAcuteLoad(workouts);
  const chronic = getChronicLoad(workouts);
  const ratio   = getRatio(acute, chronic);
  const trend   = getTrendLabel(ratio);
  const markerPos = getZonePosition(ratio);
  const zoneColor = getZoneColor(ratio);

  return (
    <>
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
          <span className="sc-metric-value" style={{ color: zoneColor }}>{ratio.toFixed(2)}</span>
          <span className="sc-metric-sub">acute / chronic</span>
        </div>

        <div className="sc-metric">
          <span className="sc-metric-label">Trend</span>
          <span className="sc-metric-value is-trend" style={{ color: zoneColor }}>{trend || '—'}</span>
        </div>

      </div>

      {/* Zone Bar */}
      <div className="sc-zone-wrap">
        {/* Zone segments */}
        <div className="sc-zone-track">
          <div className="sc-zone-seg" style={{ flex: '0.8', background: '#1a3a5c' }} />
          <div className="sc-zone-seg" style={{ flex: '0.5', background: '#1a3d2e' }} />
          <div className="sc-zone-seg" style={{ flex: '0.2', background: '#3d2e10' }} />
          <div className="sc-zone-seg" style={{ flex: '0.5', background: '#3d1a0a' }} />
        </div>

        {/* Marker */}
        <div
          className="sc-zone-marker"
          style={{ left: `${markerPos}%`, borderColor: zoneColor }}
        />

        {/* Labels */}
        <div className="sc-zone-labels">
          <span>0.0</span>
          <span>0.8</span>
          <span>1.3</span>
          <span>1.5</span>
          <span>2.0+</span>
        </div>
      </div>
    </>
  );
}


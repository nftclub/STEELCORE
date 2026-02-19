'use client';

import type { Workout } from '../lib/db';
import { getDailyBreakdown } from '../lib/calculations';

interface Props {
  workouts: Workout[];
}

export default function WeeklyLoadTable({ workouts }: Props) {
  const days   = getDailyBreakdown(workouts);
  const maxLoad = Math.max(...days.map((d) => d.load), 1);

  return (
    <div className="sc-weekly-body">
      {days.map((d) => (
        <div key={d.dateKey} className={`sc-weekly-row ${d.isToday ? 'today' : ''}`}>
          <span className="sc-weekly-day">{d.dayLabel}</span>
          <div className="sc-weekly-bar-wrap">
            <div
              className="sc-weekly-bar"
              style={{ width: `${(d.load / maxLoad) * 100}%` }}
            />
          </div>
          <span className="sc-weekly-load">
            {d.load > 0 ? d.load.toFixed(0) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

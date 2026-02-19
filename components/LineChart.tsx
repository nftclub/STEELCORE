'use client';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import type { Workout } from '../lib/db';

interface Props {
  workouts: Workout[];
}

interface WeekBucket {
  week: string;
  load: number;
}

function buildWeeklyData(workouts: Workout[]): WeekBucket[] {
  const now = Date.now();
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const MS_28 = 28 * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [
    { week: 'Wk 4', load: 0 },
    { week: 'Wk 3', load: 0 },
    { week: 'Wk 2', load: 0 },
    { week: 'Wk 1', load: 0 },
  ];

  workouts.forEach((w) => {
    const age = now - w.date;
    if (age < 0 || age >= MS_28) return;
    const idx = Math.floor(age / MS_WEEK); // 0 = most recent
    buckets[3 - idx].load += w.load;
  });

  return buckets;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #2c2c2c',
        borderRadius: 3,
        padding: '8px 12px',
      }}
    >
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#555',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          color: '#e2e2e2',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {payload[0].value?.toFixed(0)}
      </div>
    </div>
  );
}

export default function LoadLineChart({ workouts }: Props) {
  const data = buildWeeklyData(workouts);

  return (
    <div className="sc-chart-body">
      <ResponsiveContainer width="100%" height={180}>
        <ReLineChart
          data={data}
          margin={{ top: 8, right: 20, left: 0, bottom: 4 }}
        >
          <CartesianGrid stroke="#1e1e1e" vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="week"
            tick={{
              fill: '#3a3a3a',
              fontSize: 10,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.12em',
            }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{
              fill: '#3a3a3a',
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            axisLine={false}
            tickLine={false}
            dx={-4}
            width={36}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} />}
            cursor={{ stroke: '#2c2c2c', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="load"
            stroke="#e05a2b"
            strokeWidth={1.5}
            dot={{ fill: '#e05a2b', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#e05a2b', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

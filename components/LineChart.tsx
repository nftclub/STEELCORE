'use client';

import { useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
  const now     = Date.now();
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const MS_28   = 28 * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [
    { week: 'Wk 4', load: 0 },
    { week: 'Wk 3', load: 0 },
    { week: 'Wk 2', load: 0 },
    { week: 'Wk 1', load: 0 },
  ];

  workouts.forEach((w) => {
    const age = now - w.date;
    if (age < 0 || age >= MS_28) return;
    const idx = Math.floor(age / MS_WEEK);
    buckets[3 - idx].load += w.load;
  });

  return buckets;
}

export default function LoadLineChart({ workouts }: Props) {
  const data        = buildWeeklyData(workouts);
  const captureRef  = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#141414',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Add footer text
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '500 22px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.textAlign = 'right';
        ctx.fillText('Tracked with SteelCore', canvas.width - 28, canvas.height - 18);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'steelcore-load.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'SteelCore Load' });
        } else {
          // Fallback: direct download
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = 'steelcore-load.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="sc-chart-body">

      {/* Share button — top right inside card header handled by wrapper */}
      <div className="sc-chart-toolbar">
        <button
          className="sc-share-btn"
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share chart"
        >
          {sharing ? (
            <span className="sc-share-spinner" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          )}
        </button>
      </div>

      {/* Captured area */}
      <div ref={captureRef} className="sc-chart-capture">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e05a2b" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#e05a2b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="0" />

            <XAxis
              dataKey="week"
              tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              width={36}
            />

            <Tooltip
              contentStyle={{ background: '#161616', border: '1px solid #2c2c2c', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              labelStyle={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#555' }}
              itemStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: '#e2e2e2' }}
              cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }}
              formatter={(value: number) => [value.toFixed(0), 'Load']}
            />

            <Area
              type="monotone"
              dataKey="load"
              stroke="#e05a2b"
              strokeWidth={2.5}
              fill="url(#loadGradient)"
              dot={(props: { cx: number; cy: number; index: number }) => {
                const { cx, cy, index } = props;
                return (
                  <g key={`dot-${index}`}>
                    <circle cx={cx} cy={cy} r={7} fill="#e05a2b" fillOpacity={0.15} />
                    <circle cx={cx} cy={cy} r={3.5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={1.5} />
                  </g>
                );
              }}
              activeDot={(props: { cx: number; cy: number; index: number }) => {
                const { cx, cy, index } = props;
                return (
                  <g key={`active-${index}`}>
                    <circle cx={cx} cy={cy} r={10} fill="#e05a2b" fillOpacity={0.12} />
                    <circle cx={cx} cy={cy} r={5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={2} />
                  </g>
                );
              }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


interface Props {
  workouts: Workout[];
}

interface WeekBucket {
  week: string;
  load: number;
}

function buildWeeklyData(workouts: Workout[]): WeekBucket[] {
  const now     = Date.now();
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const MS_28   = 28 * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [
    { week: 'Wk 4', load: 0 },
    { week: 'Wk 3', load: 0 },
    { week: 'Wk 2', load: 0 },
    { week: 'Wk 1', load: 0 },
  ];

  workouts.forEach((w) => {
    const age = now - w.date;
    if (age < 0 || age >= MS_28) return;
    const idx = Math.floor(age / MS_WEEK);
    buckets[3 - idx].load += w.load;
  });

  return buckets;
}

export default function LoadLineChart({ workouts }: Props) {
  const data = buildWeeklyData(workouts);

  return (
    <div className="sc-chart-body">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>

          <defs>
            <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e05a2b" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#e05a2b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="0" />

          <XAxis
            dataKey="week"
            tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={false}
            tickLine={false}
            dx={-4}
            width={36}
          />

          <Tooltip
            contentStyle={{ background: '#161616', border: '1px solid #2c2c2c', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            labelStyle={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#555' }}
            itemStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: '#e2e2e2' }}
            cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }}
            formatter={(value: number) => [value.toFixed(0), 'Load']}
          />

          <Area
            type="monotone"
            dataKey="load"
            stroke="#e05a2b"
            strokeWidth={2.5}
            fill="url(#loadGradient)"
            dot={(props: { cx: number; cy: number; index: number }) => {
              const { cx, cy, index } = props;
              return (
                <g key={`dot-${index}`}>
                  <circle cx={cx} cy={cy} r={7} fill="#e05a2b" fillOpacity={0.15} />
                  <circle cx={cx} cy={cy} r={3.5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={1.5} />
                </g>
              );
            }}
            activeDot={(props: { cx: number; cy: number; index: number }) => {
              const { cx, cy, index } = props;
              return (
                <g key={`active-${index}`}>
                  <circle cx={cx} cy={cy} r={10} fill="#e05a2b" fillOpacity={0.12} />
                  <circle cx={cx} cy={cy} r={5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={2} />
                </g>
              );
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


interface Props {
  workouts: Workout[];
}

interface WeekBucket {
  week: string;
  load: number;
}

function buildWeeklyData(workouts: Workout[]): WeekBucket[] {
  const now     = Date.now();
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const MS_28   = 28 * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [
    { week: 'Wk 4', load: 0 },
    { week: 'Wk 3', load: 0 },
    { week: 'Wk 2', load: 0 },
    { week: 'Wk 1', load: 0 },
  ];

  workouts.forEach((w) => {
    const age = now - w.date;
    if (age < 0 || age >= MS_28) return;
    const idx = Math.floor(age / MS_WEEK);
    buckets[3 - idx].load += w.load;
  });

  return buckets;
}

export default function LoadLineChart({ workouts }: Props) {
  const data = buildWeeklyData(workouts);

  return (
    <div className="sc-chart-body">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e05a2b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#e05a2b" stopOpacity={0} />
            </linearGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid stroke="#1a1a1a" vertical={false} strokeDasharray="0" />

          <XAxis
            dataKey="week"
            tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fill: '#3a3a3a', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={false}
            tickLine={false}
            dx={-4}
            width={36}
          />

          <Tooltip
            contentStyle={{ background: '#161616', border: '1px solid #2c2c2c', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            labelStyle={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#555' }}
            itemStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: '#e2e2e2' }}
            cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }}
            formatter={(value: number) => [value.toFixed(0), 'Load']}
          />

          {/* Gradient fill area */}
          <Area
            type="monotone"
            dataKey="load"
            stroke="none"
            fill="url(#loadGradient)"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />

          {/* Main line with glow */}
          <Line
            type="monotone"
            dataKey="load"
            stroke="#e05a2b"
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy } = props;
              return (
                <g key={`dot-${cx}-${cy}`}>
                  {/* Glow halo */}
                  <circle cx={cx} cy={cy} r={7} fill="#e05a2b" fillOpacity={0.15} />
                  {/* Inner dot */}
                  <circle cx={cx} cy={cy} r={3.5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={1.5} />
                </g>
              );
            }}
            activeDot={(props) => {
              const { cx, cy } = props;
              return (
                <g key={`active-${cx}-${cy}`}>
                  <circle cx={cx} cy={cy} r={10} fill="#e05a2b" fillOpacity={0.12} />
                  <circle cx={cx} cy={cy} r={5} fill="#e05a2b" stroke="#0c0c0c" strokeWidth={2} />
                </g>
              );
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}



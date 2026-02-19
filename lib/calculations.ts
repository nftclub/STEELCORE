import type { Workout } from './db';

// ── STEP 1: Aggregate entries by calendar date ──────────────────────────────
function toDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function aggregateByDate(workouts: Workout[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of workouts) {
    const key = toDateKey(w.date);
    map.set(key, (map.get(key) ?? 0) + w.load);
  }
  return map;
}

// ── STEP 2: Build continuous daily calendar ──────────────────────────────────
function buildDailyCalendar(
  aggregated: Map<string, number>,
  days: number
): number[] {
  const today    = new Date();
  const result: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d.getTime());
    result.push(aggregated.get(key) ?? 0);
  }

  return result; // index 0 = oldest, last index = today
}

// ── STEP 3: Acute — sum of last 7 days ───────────────────────────────────────
export function getAcuteLoad(workouts: Workout[]): number {
  const aggregated = aggregateByDate(workouts);
  const daily      = buildDailyCalendar(aggregated, 7);
  return daily.reduce((sum, v) => sum + v, 0);
}

// ── STEP 4: Chronic — sum of last 28 days / 4 ────────────────────────────────
export function getChronicLoad(workouts: Workout[]): number {
  const aggregated = aggregateByDate(workouts);
  const daily      = buildDailyCalendar(aggregated, 28);
  const sum        = daily.reduce((sum, v) => sum + v, 0);
  return sum / 4;
}

// ── STEP 5: Ratio ─────────────────────────────────────────────────────────────
export function getRatio(acute: number, chronic: number): number {
  if (chronic === 0) return 0;
  return acute / chronic;
}

export function getTrendLabel(ratio: number): string {
  if (ratio > 1.5) return 'High Load Increase';
  if (ratio >= 0.8 && ratio <= 1.3) return 'Stable Load';
  if (ratio < 0.7) return 'Reduced Load';
  return '';
}

// ── Weekly graph data using ISO week grouping ─────────────────────────────────
export interface WeekBucket {
  week: string;
  load: number;
}

export function buildWeeklyData(workouts: Workout[]): WeekBucket[] {
  const aggregated = aggregateByDate(workouts);
  const now        = Date.now();
  const MS_WEEK    = 7 * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [
    { week: 'Wk 4', load: 0 },
    { week: 'Wk 3', load: 0 },
    { week: 'Wk 2', load: 0 },
    { week: 'Wk 1', load: 0 },
  ];

  for (const [key, load] of aggregated) {
    const [y, m, d]  = key.split('-').map(Number);
    const date       = new Date(y, m - 1, d).getTime();
    const age        = now - date;
    if (age < 0 || age >= 28 * 24 * 60 * 60 * 1000) continue;
    const idx        = Math.floor(age / MS_WEEK); // 0 = most recent week
    buckets[3 - idx].load += load;
  }

  return buckets;
}
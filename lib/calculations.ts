import type { Workout } from './db';

export function getAcuteLoad(workouts: Workout[]): number {
  const now = Date.now();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  return workouts
    .filter((w) => w.date >= cutoff)
    .reduce((sum, w) => sum + w.load, 0);
}

export function getChronicLoad(workouts: Workout[]): number {
  const now = Date.now();
  const cutoff = now - 28 * 24 * 60 * 60 * 1000;
  const sum = workouts
    .filter((w) => w.date >= cutoff)
    .reduce((sum, w) => sum + w.load, 0);
  return sum / 4;
}

export function getRatio(acute: number, chronic: number): number {
  if (chronic === 0) return 1;
  return acute / chronic;
}

export function getTrendLabel(ratio: number): string {
  if (ratio > 1.5) return 'High Load Increase';
  if (ratio >= 0.8 && ratio <= 1.3) return 'Stable Load';
  if (ratio < 0.7) return 'Reduced Load';
  return '';
}
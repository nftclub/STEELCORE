'use client';

import { useState } from 'react';
import { db } from '../lib/db';

const INTENSITY_OPTIONS = [
  { label: 'Very Light', value: 2 },
  { label: 'Light',      value: 4 },
  { label: 'Moderate',   value: 6 },
  { label: 'Hard',       value: 8 },
  { label: 'Maximum',    value: 10 },
] as const;

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface Props {
  onSaved: () => void;
  prefillDuration?: number | null;
}

export default function WorkoutEntry({ onSaved, prefillDuration }: Props) {
  const [duration,  setDuration]  = useState<string>(prefillDuration ? String(prefillDuration) : '');
  const [intensity, setIntensity] = useState<number>(6);
  const [date,      setDate]      = useState<string>(todayString());
  const [saving,    setSaving]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = parseFloat(duration);
    if (!d || d <= 0) return;

    // Convert selected date to timestamp (local midnight)
    const [y, mo, day] = date.split('-').map(Number);
    const timestamp    = new Date(y, mo - 1, day).getTime();

    setSaving(true);
    await db.workouts.add({
      id:        crypto.randomUUID(),
      date:      timestamp,
      duration:  d,
      intensity,
      load:      d * intensity,
    });

    setDuration('');
    setIntensity(6);
    setDate(todayString());
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="sc-form-body">

      <div className="sc-field">
        <label className="sc-field-label">Date</label>
        <input
          type="date"
          required
          value={date}
          max={todayString()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="sc-field">
        <label className="sc-field-label">Duration (min)</label>
        <input
          type="number"
          min="1"
          step="1"
          required
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 45"
        />
      </div>

      <div className="sc-field">
        <label className="sc-field-label">Intensity</label>
        <select
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
        >
          {INTENSITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="sc-btn sc-btn-primary sc-submit"
      >
        {saving ? 'Saving…' : 'Save Workout'}
      </button>

    </form>
  );
}


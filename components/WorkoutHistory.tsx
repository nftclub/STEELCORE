'use client';

import { useState, useRef } from 'react';
import { db } from '../lib/db';
import type { Workout } from '../lib/db';

const INTENSITY_OPTIONS = [
  { label: 'Very Light', value: 2 },
  { label: 'Light',      value: 4 },
  { label: 'Moderate',   value: 6 },
  { label: 'Hard',       value: 8 },
  { label: 'Maximum',    value: 10 },
] as const;

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function intensityLabel(value: number): string {
  return INTENSITY_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
}

function toDateInput(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayString(): string {
  return toDateInput(Date.now());
}

interface Props {
  workouts: Workout[];
  onChanged: () => void;
}

interface EditState {
  id: string;
  date: string;
  duration: string;
  intensity: number;
}

export default function WorkoutHistory({ workouts, onChanged }: Props) {
  const [editState,  setEditState]  = useState<EditState | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [swipedId,   setSwipedId]   = useState<string | null>(null);
  const touchStartX  = useRef<number>(0);

  // Sorted most recent first — stable sort by date desc, then id for same-day
  const sorted = [...workouts].sort((a, b) => {
    if (b.date !== a.date) return b.date - a.date;
    return a.id.localeCompare(b.id);
  });

  function startEdit(w: Workout) {
    setEditState({
      id:        w.id,
      date:      toDateInput(w.date),
      duration:  String(w.duration),
      intensity: w.intensity,
    });
    setSwipedId(null);
  }

  async function saveEdit() {
    if (!editState) return;
    const dur = parseFloat(editState.duration);
    if (!dur || dur <= 0) return;

    const [y, mo, day] = editState.date.split('-').map(Number);
    const timestamp    = new Date(y, mo - 1, day).getTime();

    setSaving(true);
    await db.workouts.update(editState.id, {
      date:      timestamp,
      duration:  dur,
      intensity: editState.intensity,
      load:      dur * editState.intensity, // recalculate once on save
    });
    setSaving(false);
    setEditState(null);
    onChanged(); // triggers full fetchWorkouts → all metrics recalculate from DB
  }

  async function deleteWorkout(id: string) {
    await db.workouts.delete(id);
    setSwipedId(null);
    onChanged(); // triggers full fetchWorkouts → all metrics recalculate from DB
  }

  function onTouchStart(e: React.TouchEvent, id: string) {
    touchStartX.current = e.touches[0].clientX;
    if (swipedId && swipedId !== id) setSwipedId(null);
  }

  function onTouchEnd(e: React.TouchEvent, id: string) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) setSwipedId(id);       // swipe left → reveal delete
    if (diff < -30) setSwipedId(null);    // swipe right → hide
  }

  if (sorted.length === 0) {
    return (
      <div className="sc-history-empty">
        No workouts logged yet.
      </div>
    );
  }

  return (
    <div className="sc-history-list">
      {sorted.map((w) => {
        const isSwiped = swipedId === w.id;
        const isEditing = editState?.id === w.id;

        if (isEditing) {
          return (
            <div key={w.id} className="sc-history-edit">
              <div className="sc-history-edit-fields">
                <div className="sc-he-field">
                  <span className="sc-he-label">Date</span>
                  <input
                    type="date"
                    max={todayString()}
                    value={editState.date}
                    onChange={(e) => setEditState({ ...editState, date: e.target.value })}
                  />
                </div>
                <div className="sc-he-field">
                  <span className="sc-he-label">Duration (min)</span>
                  <input
                    type="number"
                    min="1"
                    value={editState.duration}
                    onChange={(e) => setEditState({ ...editState, duration: e.target.value })}
                  />
                </div>
                <div className="sc-he-field">
                  <span className="sc-he-label">Intensity</span>
                  <select
                    value={editState.intensity}
                    onChange={(e) => setEditState({ ...editState, intensity: Number(e.target.value) })}
                  >
                    {INTENSITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sc-he-load">
                Load: {(parseFloat(editState.duration || '0') * editState.intensity).toFixed(0)}
              </div>
              <div className="sc-he-actions">
                <button className="sc-btn sc-btn-primary sc-he-btn" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="sc-btn sc-btn-ghost sc-he-btn" onClick={() => setEditState(null)}>
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={w.id}
            className={`sc-history-row-wrap ${isSwiped ? 'swiped' : ''}`}
            onTouchStart={(e) => onTouchStart(e, w.id)}
            onTouchEnd={(e) => onTouchEnd(e, w.id)}
          >
            <div className="sc-history-row">
              <div className="sc-history-meta">
                <span className="sc-history-date">{formatDate(w.date)}</span>
                <span className="sc-history-detail">
                  {w.duration} min · {intensityLabel(w.intensity)}
                </span>
              </div>
              <div className="sc-history-right">
                <span className="sc-history-load">{w.load.toFixed(0)}</span>
                <div className="sc-history-actions">
                  <button className="sc-hist-btn" onClick={() => startEdit(w)}>Edit</button>
                  <button className="sc-hist-btn sc-hist-del" onClick={() => deleteWorkout(w.id)}>Del</button>
                </div>
              </div>
            </div>
            {/* Swipe delete reveal */}
            <button className="sc-swipe-delete" onClick={() => deleteWorkout(w.id)}>
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}

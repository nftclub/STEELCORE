'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import type { Workout } from '../lib/db';
import WorkoutEntry  from '../components/WorkoutEntry';
import FireDayTimer  from '../components/FireDayTimer';
import LoadMetrics   from '../components/LoadMetrics';
import LoadLineChart from '../components/LineChart';

async function fetchWorkouts(): Promise<Workout[]> {
  return db.workouts.orderBy('date').reverse().toArray();
}

export default function Page() {
  const [workouts, setWorkouts]           = useState<Workout[]>([]);
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [showInfo, setShowInfo]           = useState(false);
  const swRegistered                      = useRef(false);

  useEffect(() => {
    fetchWorkouts().then(setWorkouts);

    if (!swRegistered.current && 'serviceWorker' in navigator) {
      swRegistered.current = true;
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
  }, []);

  function handleTimerLog(totalSeconds: number) {
    const mins = Math.round(totalSeconds / 60);
    setTimerDuration(mins > 0 ? mins : 1);
  }

  function handleSaved() {
    setTimerDuration(null);
    fetchWorkouts().then(setWorkouts);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:          #0c0c0c;
          --surface:     #141414;
          --surface-hi:  #1a1a1a;
          --border:      #212121;
          --border-hi:   #2c2c2c;
          --text:        #e2e2e2;
          --text-2:      #777777;
          --text-3:      #3a3a3a;
          --accent:      #e05a2b;
          --accent-soft: rgba(224,90,43,0.08);
          --blue:        #4a9eff;
          --font-label:  'Barlow Condensed', sans-serif;
          --font-num:    'IBM Plex Mono', monospace;
          --radius:      4px;
          --ease:        cubic-bezier(0.4,0,0.2,1);
        }

        html, body {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-label);
          -webkit-font-smoothing: antialiased;
        }

        button { font-family: var(--font-label); cursor: pointer; }
        input, select { font-family: var(--font-num); }

        .sc-shell {
          animation: mountIn 400ms cubic-bezier(0.4,0,0.2,1) both;
        }
        @keyframes mountIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header ── */
        .sc-wordmark {
          font-family: var(--font-label);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--text);
        }
        .sc-wordmark em {
          color: var(--accent);
          font-style: normal;
          text-shadow: 0 0 20px rgba(224,90,43,0.4);
        }
        .sc-tagline {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-3);
        }

        /* ── Body ── */
        .sc-body {
          max-width: 460px;
          margin: 0 auto;
          padding: 20px 16px 56px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Card ── */
        .sc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease);
        }
        .sc-card:hover {
          border-color: #2e2e2e;
          box-shadow: 0 0 0 1px rgba(224,90,43,0.06), 0 4px 24px rgba(0,0,0,0.4);
        }
        .sc-card-header {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sc-card-pip {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .sc-card-title {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-2);
        }

        /* ── Metrics ── */
        .sc-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .sc-metric {
          padding: 20px 20px 18px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 5px;
          transition: background 200ms var(--ease);
        }
        .sc-metric:hover { background: rgba(255,255,255,0.015); }
        .sc-metric:nth-child(2n)   { border-right: none; }
        .sc-metric:nth-child(3),
        .sc-metric:nth-child(4)    { border-bottom: none; }
        .sc-metric-label {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-3);
        }
        .sc-metric-value {
          font-family: var(--font-num);
          font-size: 30px;
          font-weight: 700;
          color: var(--text);
          line-height: 1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          transition: color 300ms var(--ease);
        }
        .sc-metric-value.is-trend {
          font-family: var(--font-label);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding-top: 6px;
          color: var(--text-2);
        }
        .sc-metric-sub {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-3);
          margin-top: 1px;
        }

        /* ── Timer ── */
        .sc-timer-body {
          padding: 28px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .sc-timer-phase {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--text-3);
          height: 14px;
          transition: color 200ms var(--ease);
          margin-bottom: 10px;
        }
        .sc-timer-phase.work { color: var(--accent); }
        .sc-timer-phase.rest { color: var(--blue); }
        .sc-timer-clock {
          font-family: var(--font-num);
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          color: var(--text);
          transition: color 200ms var(--ease);
        }
        .sc-timer-clock.rest { color: var(--blue); }
        .sc-round-pips {
          display: flex;
          gap: 7px;
          margin-top: 14px;
          align-items: center;
        }
        .sc-pip {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--border-hi);
          transition: background 240ms var(--ease);
        }
        .sc-pip.done   { background: var(--accent); }
        .sc-pip.active { background: var(--text-2); }
        .sc-timer-controls {
          margin-top: 22px;
          display: flex;
          gap: 8px;
        }

        /* ── Preset buttons ── */
        .sc-preset-row {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
        }
        .sc-preset-btn {
          font-family: var(--font-label);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: var(--radius);
          border: 1px solid var(--border-hi);
          background: transparent;
          color: var(--text-3);
          cursor: pointer;
          transition: all 150ms var(--ease);
        }
        .sc-preset-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--text-2);
        }
        .sc-preset-btn.active {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-soft);
        }
        .sc-preset-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Custom row ── */
        .sc-custom-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .sc-custom-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }
        .sc-custom-field span {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-3);
        }
        .sc-custom-field input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 10px;
          color: var(--text);
          font-family: var(--font-num);
          font-size: 14px;
          text-align: center;
          outline: none;
          width: 100%;
          transition: border-color 160ms var(--ease);
        }
        .sc-custom-field input:focus { border-color: var(--accent); }

        /* ── Buttons ── */
        .sc-btn {
          font-family: var(--font-label);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          border-radius: var(--radius);
          padding: 11px 28px;
          transition: opacity 140ms var(--ease), transform 120ms var(--ease), box-shadow 140ms var(--ease);
        }
        .sc-btn:hover  { opacity: 0.88; transform: translateY(-1px); }
        .sc-btn:active { opacity: 0.7;  transform: translateY(0px) scale(0.98); }
        .sc-btn-primary {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 12px rgba(224,90,43,0.25);
        }
        .sc-btn-primary:hover {
          box-shadow: 0 4px 20px rgba(224,90,43,0.4);
        }
        .sc-btn-ghost {
          background: transparent;
          color: var(--text-2);
          border: 1px solid var(--border-hi);
        }
        .sc-btn-ghost:hover {
          border-color: #3a3a3a;
          color: var(--text);
        }

        /* ── Form ── */
        .sc-form-body {
          padding: 20px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sc-field { display: flex; flex-direction: column; gap: 7px; }
        .sc-field-label {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-3);
        }
        .sc-field input,
        .sc-field select {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 11px 14px;
          color: var(--text);
          font-size: 15px;
          font-weight: 500;
          width: 100%;
          outline: none;
          transition: border-color 160ms var(--ease);
          -webkit-appearance: none;
          appearance: none;
        }
        .sc-field input:focus,
        .sc-field select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(224,90,43,0.08);
        }
        .sc-field input::placeholder { color: var(--text-3); }
        .sc-submit {
          width: 100%;
          padding: 13px;
          font-size: 11px;
          letter-spacing: 0.22em;
        }
        .sc-submit:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Chart ── */
        .sc-chart-body { padding: 16px 8px 12px 0; }
        .sc-chart-toolbar {
          display: flex;
          justify-content: flex-end;
          padding: 0 16px 4px;
        }
        .sc-chart-capture { width: 100%; }
        .sc-share-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text-3);
          cursor: pointer;
          transition: all 150ms var(--ease);
        }
        .sc-share-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .sc-share-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sc-share-spinner {
          width: 10px; height: 10px;
          border: 1.5px solid var(--text-3);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 600ms linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Info button ── */
        .sc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 16px;
          border-bottom: 1px solid var(--border);
        }
        .sc-header-left { display: flex; align-items: center; gap: 14px; }
        .sc-info-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 50%;
          color: var(--text-3);
          font-family: var(--font-label);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 150ms var(--ease);
          flex-shrink: 0;
        }
        .sc-info-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* ── Info modal ── */
        .sc-info-modal {
          background: var(--surface);
          border: 1px solid var(--border-hi);
          border-radius: var(--radius);
          padding: 28px 24px;
          width: min(380px, calc(100vw - 32px));
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: modalUp 200ms var(--ease);
          max-height: 80vh;
          overflow-y: auto;
        }
        .sc-info-section { display: flex; flex-direction: column; gap: 8px; }
        .sc-info-heading {
          font-family: var(--font-label);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .sc-info-text {
          font-family: var(--font-label);
          font-size: 13px;
          font-weight: 400;
          color: var(--text-2);
          line-height: 1.6;
          letter-spacing: 0.02em;
        }
        .sc-info-table { width: 100%; border-collapse: collapse; }
        .sc-info-table td {
          font-family: var(--font-label);
          font-size: 12px;
          color: var(--text-2);
          padding: 4px 0;
          letter-spacing: 0.04em;
        }
        .sc-info-table td:last-child { text-align: right; color: var(--text-3); }
        .sc-info-divider {
          height: 1px;
          background: var(--border);
        }
        .sc-info-note {
          font-family: var(--font-label);
          font-size: 11px;
          color: var(--text-3);
          line-height: 1.5;
          letter-spacing: 0.03em;
        }
        .sc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          backdrop-filter: blur(3px);
          animation: overlayIn 160ms var(--ease);
        }
        @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }
        .sc-modal {
          background: var(--surface);
          border: 1px solid var(--border-hi);
          border-radius: var(--radius);
          padding: 28px 24px;
          width: min(340px, calc(100vw - 32px));
          display: flex;
          flex-direction: column;
          gap: 0;
          animation: modalUp 200ms var(--ease);
        }
        @keyframes modalUp {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .sc-modal-title {
          font-family: var(--font-label);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text);
          margin-bottom: 6px;
        }
        .sc-modal-sub {
          font-family: var(--font-num);
          font-size: 12px;
          color: var(--text-2);
          margin-bottom: 24px;
        }
        .sc-modal-actions { display: flex; gap: 8px; }
        .sc-modal-actions .sc-btn { flex: 1; text-align: center; }
      `}</style>

      <div className="sc-shell">
        <header className="sc-header">
          <div className="sc-header-left">
            <span className="sc-wordmark">Steel<em>Core</em></span>
            <span className="sc-tagline">Load Tracker</span>
          </div>
          <button className="sc-info-btn" onClick={() => setShowInfo(true)} aria-label="About ACWR">?</button>
        </header>

        {showInfo && (
          <div className="sc-overlay" onClick={() => setShowInfo(false)}>
            <div className="sc-info-modal" onClick={(e) => e.stopPropagation()}>

              <div className="sc-info-section">
                <span className="sc-info-heading">What is ACWR?</span>
                <p className="sc-info-text">A ratio that compares your recent training load to your longer-term average to help you understand workload trends.</p>
              </div>

              <div className="sc-info-divider" />

              <div className="sc-info-section">
                <span className="sc-info-heading">How it&apos;s calculated</span>
                <p className="sc-info-text">
                  Load = Duration (min) × Intensity<br />
                  Acute = Total load over the last 7 days<br />
                  Chronic = Rolling 4-week average (28 days ÷ 4)<br />
                  Ratio = Acute ÷ Chronic
                </p>
              </div>

              <div className="sc-info-divider" />

              <div className="sc-info-section">
                <span className="sc-info-heading">Intensity Scale</span>
                <table className="sc-info-table">
                  <tbody>
                    <tr><td>Very Light</td><td>×2</td></tr>
                    <tr><td>Light</td><td>×4</td></tr>
                    <tr><td>Moderate</td><td>×6</td></tr>
                    <tr><td>Hard</td><td>×8</td></tr>
                    <tr><td>Maximum</td><td>×10</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="sc-info-divider" />

              <div className="sc-info-section">
                <span className="sc-info-heading">Ratio Reference</span>
                <table className="sc-info-table">
                  <tbody>
                    <tr><td>Below 0.8</td><td>Reduced Load</td></tr>
                    <tr><td>0.8 – 1.3</td><td>Stable Load</td></tr>
                    <tr><td>1.3 – 1.5</td><td>Elevated Load</td></tr>
                    <tr><td>Above 1.5</td><td>High Load Increase</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="sc-info-divider" />

              <p className="sc-info-note">Intensity is self-reported based on perceived effort. Based on Tim Gabbett&apos;s sports science research. Not medical advice.</p>

              <button className="sc-btn sc-btn-ghost" onClick={() => setShowInfo(false)}>Close</button>
            </div>
          </div>
        )}

        <div className="sc-body">
          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-card-pip" />
              <span className="sc-card-title">Metrics</span>
            </div>
            <LoadMetrics workouts={workouts} />
          </div>

          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-card-pip" />
              <span className="sc-card-title">4-Week Load</span>
            </div>
            <LoadLineChart workouts={workouts} />
          </div>

          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-card-pip" />
              <span className="sc-card-title">Fire Day Timer</span>
            </div>
            <FireDayTimer onLogSession={handleTimerLog} />
          </div>

          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-card-pip" />
              <span className="sc-card-title">Log Workout</span>
            </div>
            <WorkoutEntry onSaved={handleSaved} prefillDuration={timerDuration} />
          </div>
        </div>
      </div>
    </>
  );
}

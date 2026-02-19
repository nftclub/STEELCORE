'use client';

import { useState, useEffect, useRef } from 'react';

type Phase = 'idle' | 'work' | 'rest' | 'done';

interface Preset {
  label: string;
  rounds: number;
  workSecs: number;
  restSecs: number;
  isCustom?: boolean;
  isSingle?: boolean;
}

const PRESETS: Preset[] = [
  { label: '3×3',   rounds: 3,  workSecs: 3 * 60, restSecs: 60 },
  { label: '5×3',   rounds: 5,  workSecs: 3 * 60, restSecs: 60 },
  { label: '3 min', rounds: 1,  workSecs: 3 * 60, restSecs: 0, isSingle: true },
  { label: '5 min', rounds: 1,  workSecs: 5 * 60, restSecs: 0, isSingle: true },
  { label: 'Custom', rounds: 1, workSecs: 5 * 60, restSecs: 60, isCustom: true },
];

interface Props {
  onLogSession: (totalSeconds: number) => void;
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.volume = 1;
  u.rate   = 1.1;
  window.speechSynthesis.speak(u);
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export default function FireDayTimer({ onLogSession }: Props) {
  const [presetIdx,     setPresetIdx]     = useState(1);
  const [phase,         setPhase]         = useState<Phase>('idle');
  const [round,         setRound]         = useState(1);
  const [timeLeft,      setTimeLeft]      = useState(PRESETS[1].workSecs);
  const [showModal,     setShowModal]     = useState(false);
  const [totalElapsed,  setTotalElapsed]  = useState(0);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [customMins,    setCustomMins]    = useState(5);
  const [customRounds,  setCustomRounds]  = useState(3);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef   = useRef(0);
  const phaseRef     = useRef<Phase>('idle');
  const roundRef     = useRef(1);
  const timeLeftRef  = useRef(PRESETS[1].workSecs);
  const presetRef    = useRef<Preset>(PRESETS[1]);

  function clearTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function buildCustomPreset(): Preset {
    return { label: 'Custom', rounds: customRounds, workSecs: customMins * 60, restSecs: 60 };
  }

  function selectPreset(idx: number) {
    if (phase !== 'idle') return;
    setPresetIdx(idx);
    const p = idx === 4 ? buildCustomPreset() : PRESETS[idx];
    presetRef.current   = p;
    timeLeftRef.current = p.workSecs;
    setTimeLeft(p.workSecs);
  }

  function startTimer() {
    const preset = presetIdx === 4 ? buildCustomPreset() : presetRef.current;
    presetRef.current = preset;
    clearTimer();
    phaseRef.current    = 'work';
    roundRef.current    = 1;
    timeLeftRef.current = preset.workSecs;
    elapsedRef.current  = 0;
    setPhase('work');
    setRound(1);
    setTimeLeft(preset.workSecs);
    setTotalElapsed(0);
    setFullscreen(true);
    speak('Work');
    haptic(200);

    intervalRef.current = setInterval(() => {
      elapsedRef.current  += 1;
      timeLeftRef.current -= 1;
      setTotalElapsed(elapsedRef.current);
      setTimeLeft(timeLeftRef.current);

      const tl = timeLeftRef.current;
      if (tl === 3) speak('3');
      if (tl === 2) speak('2');
      if (tl === 1) speak('1');

      if (tl <= 0) {
        haptic([100, 50, 100]);
        if (phaseRef.current === 'work') {
          if (roundRef.current >= preset.rounds) {
            clearTimer();
            phaseRef.current = 'done';
            setPhase('done');
            speak('Session complete');
            haptic([200, 100, 200, 100, 400]);
            setFullscreen(false);
            setShowModal(true);
          } else {
            phaseRef.current    = 'rest';
            timeLeftRef.current = preset.restSecs;
            setPhase('rest');
            setTimeLeft(preset.restSecs);
            speak('Rest');
          }
        } else if (phaseRef.current === 'rest') {
          roundRef.current   += 1;
          phaseRef.current    = 'work';
          timeLeftRef.current = preset.workSecs;
          setRound(roundRef.current);
          setPhase('work');
          setTimeLeft(preset.workSecs);
          speak('Work');
          haptic(150);
        }
      }
    }, 1000);
  }

  function resetTimer() {
    clearTimer();
    window.speechSynthesis?.cancel();
    phaseRef.current    = 'idle';
    roundRef.current    = 1;
    timeLeftRef.current = presetRef.current.workSecs;
    elapsedRef.current  = 0;
    setPhase('idle');
    setRound(1);
    setTimeLeft(presetRef.current.workSecs);
    setTotalElapsed(0);
    setShowModal(false);
    setFullscreen(false);
  }

  function handleLogYes() {
    setShowModal(false);
    onLogSession(elapsedRef.current);
    resetTimer();
  }

  function handleLogNo() {
    setShowModal(false);
    resetTimer();
  }

  useEffect(() => () => { clearTimer(); window.speechSynthesis?.cancel(); }, []);

  const preset     = presetIdx === 4 ? buildCustomPreset() : (presetRef.current ?? PRESETS[1]);
  const mins       = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs       = String(timeLeft % 60).padStart(2, '0');
  const phaseClass = phase === 'work' ? 'work' : phase === 'rest' ? 'rest' : '';
  const phaseLabel = phase === 'work' ? 'WORK' : phase === 'rest' ? 'REST' : phase === 'done' ? 'DONE' : 'READY';
  const isCustom   = presetIdx === 4;

  // Fullscreen overlay
  if (fullscreen) {
    return (
      <>
        <style>{`
          .sc-fs {
            position: fixed; inset: 0; z-index: 300;
            background: #080808;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 0;
            animation: fsIn 220ms cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fsIn { from { opacity:0 } to { opacity:1 } }
          .sc-fs-phase {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 12px; font-weight: 700;
            letter-spacing: 0.28em; text-transform: uppercase;
            color: #3a3a3a; margin-bottom: 12px;
            transition: color 200ms ease;
          }
          .sc-fs-phase.work { color: #e05a2b; }
          .sc-fs-phase.rest { color: #4a9eff; }
          .sc-fs-clock {
            font-family: 'IBM Plex Mono', monospace;
            font-size: clamp(80px, 22vw, 140px);
            font-weight: 700; line-height: 1;
            letter-spacing: -0.03em;
            font-variant-numeric: tabular-nums;
            color: #e2e2e2;
            transition: color 200ms ease;
          }
          .sc-fs-clock.rest { color: #4a9eff; }
          .sc-fs-pips {
            display: flex; gap: 8px; margin-top: 20px;
          }
          .sc-fs-pip {
            width: 8px; height: 8px; border-radius: 50%;
            background: #222;
            transition: background 240ms ease;
          }
          .sc-fs-pip.done   { background: #e05a2b; }
          .sc-fs-pip.active { background: #888; }
          .sc-fs-reset {
            position: absolute; bottom: 40px;
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 11px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            background: transparent; border: 1px solid #222;
            color: #444; border-radius: 4px;
            padding: 10px 28px; cursor: pointer;
            transition: all 150ms ease;
          }
          .sc-fs-reset:hover { border-color: #3a3a3a; color: #888; }
        `}</style>
        <div className="sc-fs">
          <div className={`sc-fs-phase ${phaseClass}`}>{phaseLabel}</div>
          <div className={`sc-fs-clock ${phaseClass}`}>{mins}:{secs}</div>
          <div className="sc-fs-pips">
            {Array.from({ length: preset.rounds }, (_, i) => {
              const pip = i + 1 < round ? 'done' : i + 1 === round ? 'active' : '';
              return <div key={i} className={`sc-fs-pip ${pip}`} />;
            })}
          </div>
          <button className="sc-fs-reset" onClick={resetTimer}>Reset</button>
        </div>

        {showModal && (
          <div className="sc-overlay">
            <div className="sc-modal">
              <p className="sc-modal-title">Log this session?</p>
              <p className="sc-modal-sub">{Math.floor(totalElapsed / 60)}m {totalElapsed % 60}s elapsed</p>
              <div className="sc-modal-actions">
                <button className="sc-btn sc-btn-primary" onClick={handleLogYes}>Log Session</button>
                <button className="sc-btn sc-btn-ghost"   onClick={handleLogNo}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Normal view
  return (
    <>
      <div className="sc-timer-body">
        {/* Preset selector */}
        <div className="sc-preset-row">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              className={`sc-preset-btn ${i === presetIdx ? 'active' : ''}`}
              onClick={() => selectPreset(i)}
              disabled={phase !== 'idle'}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom inputs */}
        {isCustom && phase === 'idle' && (
          <div className="sc-custom-row">
            <label className="sc-custom-field">
              <span>Min</span>
              <input
                type="number" min="1" max="60"
                value={customMins}
                onChange={(e) => setCustomMins(Number(e.target.value))}
              />
            </label>
            <label className="sc-custom-field">
              <span>Rounds</span>
              <input
                type="number" min="1" max="20"
                value={customRounds}
                onChange={(e) => setCustomRounds(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        <div className={`sc-timer-phase ${phaseClass}`}>{phaseLabel}</div>
        <div className={`sc-timer-clock ${phaseClass}`}>{mins}:{secs}</div>

        <div className="sc-round-pips">
          {Array.from({ length: preset.rounds }, (_, i) => {
            const pip = i + 1 < round ? 'done' : i + 1 === round && phase !== 'idle' ? 'active' : '';
            return <div key={i} className={`sc-pip ${pip}`} />;
          })}
        </div>

        <div className="sc-timer-controls">
          {phase === 'idle' && (
            <button className="sc-btn sc-btn-primary" onClick={startTimer}>Start</button>
          )}
          {(phase === 'work' || phase === 'rest') && (
            <button className="sc-btn sc-btn-ghost" onClick={resetTimer}>Reset</button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="sc-overlay">
          <div className="sc-modal">
            <p className="sc-modal-title">Log this session?</p>
            <p className="sc-modal-sub">{Math.floor(totalElapsed / 60)}m {totalElapsed % 60}s elapsed</p>
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-primary" onClick={handleLogYes}>Log Session</button>
              <button className="sc-btn sc-btn-ghost"   onClick={handleLogNo}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



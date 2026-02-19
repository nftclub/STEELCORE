'use client';

import { useState, useEffect, useRef } from 'react';

const ROUNDS    = 5;
const WORK_SECS = 3 * 60;
const REST_SECS = 1 * 60;

type Phase = 'idle' | 'work' | 'rest' | 'done';

interface Props {
  onLogSession: (totalSeconds: number) => void;
}

export default function FireDayTimer({ onLogSession }: Props) {
  const [phase,        setPhase]        = useState<Phase>('idle');
  const [round,        setRound]        = useState(1);
  const [timeLeft,     setTimeLeft]     = useState(WORK_SECS);
  const [showModal,    setShowModal]    = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef    = useRef(0);
  const phaseRef      = useRef<Phase>('idle');
  const roundRef      = useRef(1);
  const timeLeftRef   = useRef(WORK_SECS);

  function clearTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startTimer() {
    clearTimer();
    phaseRef.current    = 'work';
    roundRef.current    = 1;
    timeLeftRef.current = WORK_SECS;
    elapsedRef.current  = 0;
    setPhase('work');
    setRound(1);
    setTimeLeft(WORK_SECS);
    setTotalElapsed(0);

    intervalRef.current = setInterval(() => {
      elapsedRef.current  += 1;
      timeLeftRef.current -= 1;
      setTotalElapsed(elapsedRef.current);
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        if (phaseRef.current === 'work') {
          if (roundRef.current >= ROUNDS) {
            clearTimer();
            phaseRef.current = 'done';
            setPhase('done');
            setShowModal(true);
          } else {
            phaseRef.current    = 'rest';
            timeLeftRef.current = REST_SECS;
            setPhase('rest');
            setTimeLeft(REST_SECS);
          }
        } else if (phaseRef.current === 'rest') {
          roundRef.current   += 1;
          phaseRef.current    = 'work';
          timeLeftRef.current = WORK_SECS;
          setRound(roundRef.current);
          setPhase('work');
          setTimeLeft(WORK_SECS);
        }
      }
    }, 1000);
  }

  function resetTimer() {
    clearTimer();
    phaseRef.current    = 'idle';
    roundRef.current    = 1;
    timeLeftRef.current = WORK_SECS;
    elapsedRef.current  = 0;
    setPhase('idle');
    setRound(1);
    setTimeLeft(WORK_SECS);
    setTotalElapsed(0);
    setShowModal(false);
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

  useEffect(() => () => clearTimer(), []);

  const mins      = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs      = String(timeLeft % 60).padStart(2, '0');
  const phaseClass = phase === 'work' ? 'work' : phase === 'rest' ? 'rest' : '';
  const phaseLabel = phase === 'work' ? 'WORK' : phase === 'rest' ? 'REST' : phase === 'done' ? 'DONE' : 'READY';

  return (
    <>
      <div className="sc-timer-body">
        <div className={`sc-timer-phase ${phaseClass}`}>{phaseLabel}</div>

        <div className={`sc-timer-clock ${phaseClass}`}>{mins}:{secs}</div>

        {/* Round pips */}
        <div className="sc-round-pips">
          {Array.from({ length: ROUNDS }, (_, i) => {
            const pip = i + 1 < round ? 'done' : i + 1 === round && phase !== 'idle' ? 'active' : '';
            return <div key={i} className={`sc-pip ${pip}`} />;
          })}
        </div>

        <div className="sc-timer-controls">
          {phase === 'idle' && (
            <button className="sc-btn sc-btn-primary" onClick={startTimer}>
              Start
            </button>
          )}
          {(phase === 'work' || phase === 'rest') && (
            <button className="sc-btn sc-btn-ghost" onClick={resetTimer}>
              Reset
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="sc-overlay">
          <div className="sc-modal">
            <p className="sc-modal-title">Log this session?</p>
            <p className="sc-modal-sub">
              {Math.floor(totalElapsed / 60)}m {totalElapsed % 60}s elapsed
            </p>
            <div className="sc-modal-actions">
              <button className="sc-btn sc-btn-primary" onClick={handleLogYes}>
                Log Session
              </button>
              <button className="sc-btn sc-btn-ghost" onClick={handleLogNo}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

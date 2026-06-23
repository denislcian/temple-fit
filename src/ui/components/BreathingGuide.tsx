// CAPA 3 · Interfaz — Guía de respiración. El círculo crece al inhalar y
// encoge al exhalar; la animación se hace con una transición CSS cuya duración
// es la de cada fase (así prefers-reduced-motion la neutraliza solo).
import { useEffect, useRef, useState } from 'react';
import { breathStateAt, cycleSeconds, type BreathPattern } from '../../domain/breathing';
import { useAnnounce } from './Announcer';

interface BreathingGuideProps {
  pattern: BreathPattern;
  /** Duración de la sesión en minutos. */
  durationMin: number;
}

const MIN_SCALE = 0.55;
const MAX_SCALE = 1;

function targetScale(kind: string, prevWasExhala: boolean): number {
  if (kind === 'inhala') return MAX_SCALE;
  if (kind === 'exhala') return MIN_SCALE;
  return prevWasExhala ? MIN_SCALE : MAX_SCALE; // mantén: conserva
}

export function BreathingGuide({ pattern, durationMin }: BreathingGuideProps) {
  const announce = useAnnounce();
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(MIN_SCALE);
  const [transition, setTransition] = useState(0);
  const [label, setLabel] = useState('Prepárate');
  const [countdown, setCountdown] = useState(0);
  const [sessionLeft, setSessionLeft] = useState(durationMin * 60);

  const startRef = useRef(0);
  const phaseRef = useRef(-1);

  useEffect(() => {
    if (!running) return;
    const totalSec = durationMin * 60;
    const cycle = cycleSeconds(pattern);
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(totalSec - elapsed));
      setSessionLeft(remaining);
      if (elapsed >= totalSec) {
        stop(true);
        return;
      }
      const state = breathStateAt(pattern, elapsed);
      setCountdown(state.secondsLeft);
      setLabel(state.phase.label);
      if (state.phaseIndex !== phaseRef.current) {
        phaseRef.current = state.phaseIndex;
        const prev = pattern.phases[(state.phaseIndex - 1 + pattern.phases.length) % cycle]!;
        setTransition(state.phase.seconds);
        setScale(targetScale(state.phase.kind, prev.kind === 'exhala'));
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pattern, durationMin]);

  function start() {
    startRef.current = performance.now();
    phaseRef.current = -1;
    setSessionLeft(durationMin * 60);
    setRunning(true);
    announce(`Respiración ${pattern.label} iniciada, ${durationMin} minutos`);
  }

  function stop(completed = false) {
    setRunning(false);
    setScale(MIN_SCALE);
    setTransition(0.4);
    setLabel(completed ? 'Sesión completada' : 'Prepárate');
    setCountdown(0);
    if (completed) announce('Sesión de respiración completada. Buen trabajo.');
  }

  const mm = Math.floor(sessionLeft / 60);
  const ss = String(sessionLeft % 60).padStart(2, '0');

  return (
    <div className="breath">
      <div
        className="breath-stage"
        role="img"
        aria-label={running ? `${label}, ${countdown} segundos` : 'Guía de respiración'}
      >
        <div
          className={`breath-circle ${running ? 'is-running' : ''}`}
          style={{ transform: `scale(${scale})`, transitionDuration: `${transition}s` }}
          aria-hidden="true"
        />
        <div className="breath-readout" aria-hidden="true">
          <span className="breath-phase">{label}</span>
          {running && <span className="breath-count num">{countdown}</span>}
        </div>
      </div>

      <p className="breath-timer num" role={running ? 'timer' : undefined} aria-live="off">
        {mm}:{ss}
      </p>

      <div className="btn-row" style={{ justifyContent: 'center' }}>
        {!running ? (
          <button type="button" className="btn btn--primary" onClick={start}>
            Empezar
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => stop(false)}>
            Detener
          </button>
        )}
      </div>
    </div>
  );
}

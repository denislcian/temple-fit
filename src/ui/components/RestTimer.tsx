// CAPA 3 · Interfaz — Temporizador de descanso accesible.
// No solo visual: anuncia los hitos por lector de pantalla (aria-live) y
// vibra al terminar si el dispositivo lo permite. WCAG 4.1.3.
import { useEffect, useRef, useState } from 'react';

const PRESETS = [60, 90, 120, 180] as const;

/** Evento que dispara TrainView al completar una serie. */
export const SET_DONE_EVENT = 'forjafit:set-done';

const AUTO_KEY = 'forjafit-auto-rest';
const DURATION_KEY = 'forjafit-rest-duration';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RestTimer() {
  const [duration, setDuration] = useState<number>(() => {
    const stored = Number(localStorage.getItem(DURATION_KEY));
    return (PRESETS as readonly number[]).includes(stored) ? stored : 90;
  });
  const [auto, setAuto] = useState(() => localStorage.getItem(AUTO_KEY) !== '0');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const running = remaining !== null && remaining > 0;

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining === 30) setAnnouncement('Quedan 30 segundos de descanso');
    if (remaining === 10) setAnnouncement('Quedan 10 segundos');
    if (remaining === 0) {
      setAnnouncement('Descanso terminado. ¡A por la siguiente serie!');
      if (typeof navigator.vibrate === 'function') navigator.vibrate([200, 100, 200]);
    }
  }, [remaining]);

  function start(seconds: number) {
    setDuration(seconds);
    localStorage.setItem(DURATION_KEY, String(seconds));
    setRemaining(seconds);
    setAnnouncement(`Descanso de ${formatClock(seconds)} iniciado`);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRemaining(null);
    setAnnouncement('Temporizador detenido');
  }

  // Auto-inicio al completar una serie (lo que harías a mano cada vez).
  useEffect(() => {
    if (!auto) return;
    const onSetDone = () => {
      const seconds = Number(localStorage.getItem(DURATION_KEY)) || 90;
      setDuration(seconds);
      setRemaining(seconds);
      setAnnouncement(`Serie completada: descanso de ${formatClock(seconds)} iniciado`);
    };
    window.addEventListener(SET_DONE_EVENT, onSetDone);
    return () => window.removeEventListener(SET_DONE_EVENT, onSetDone);
  }, [auto]);

  function toggleAuto() {
    const next = !auto;
    setAuto(next);
    localStorage.setItem(AUTO_KEY, next ? '1' : '0');
  }

  return (
    <section className="card" aria-label="Temporizador de descanso">
      <h2>Descanso</h2>
      <div className="timer">
        {/* role="timer" expone el tiempo restante a lectores de pantalla cuando
            lo consultan, sin auto-anunciarlo cada segundo (eso lo hace el
            Announcer solo en los hitos). */}
        <span
          className={`display num ${running ? 'running' : ''}`}
          role="timer"
          aria-label={`Descanso: ${formatClock(remaining ?? duration)} restante`}
        >
          {formatClock(remaining ?? duration)}
        </span>
        <div className="btn-row">
          {PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={`btn btn--small ${duration === seconds && running ? 'btn--primary' : ''}`}
              onClick={() => start(seconds)}
            >
              {formatClock(seconds)}
            </button>
          ))}
          {running && (
            <button type="button" className="btn btn--small btn--ghost" onClick={stop}>
              Detener
            </button>
          )}
        </div>
      </div>
      <label className="auto-rest">
        <input type="checkbox" checked={auto} onChange={toggleAuto} />
        Iniciar automáticamente al completar una serie
      </label>
      <div role="status" aria-live="polite" className="visually-hidden">
        {announcement}
      </div>
    </section>
  );
}

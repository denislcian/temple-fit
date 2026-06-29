// CAPA 3 · Interfaz — Temporizador de descanso accesible.
// No solo visual: anuncia los hitos por lector de pantalla (aria-live), vibra y
// suena un chime al terminar, y muestra una cuenta atrás FLOTANTE siempre
// visible mientras descansas (no se pierde de vista al registrar series). WCAG 4.1.3.
import { useEffect, useRef, useState } from 'react';
import { playAlarmChime } from '../audio/soundscapes';

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
  // Total del descanso en curso (con los +30 s incluidos): da la barra de progreso.
  const [total, setTotal] = useState(90);
  const [announcement, setAnnouncement] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const running = remaining !== null && remaining > 0;
  const pct = total > 0 ? Math.min(100, ((remaining ?? 0) / total) * 100) : 100;

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
      playAlarmChime();
    }
  }, [remaining]);

  function start(seconds: number) {
    setDuration(seconds);
    localStorage.setItem(DURATION_KEY, String(seconds));
    setTotal(seconds);
    setRemaining(seconds);
    setAnnouncement(`Descanso de ${formatClock(seconds)} iniciado`);
  }

  /** Suma (o resta) segundos al descanso en curso sin reiniciarlo. */
  function addTime(extra: number) {
    setRemaining((prev) => (prev === null ? prev : Math.max(0, prev + extra)));
    setTotal((t) => Math.max(1, t + extra));
    setAnnouncement(extra >= 0 ? `Más ${extra} segundos de descanso` : 'Descanso recortado');
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
      setTotal(seconds);
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
    <>
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

      {running && (
        <div className="rest-float" role="group" aria-label="Descanso en curso">
          <div className="rest-float__bar" style={{ ['--pct' as string]: `${pct}%` }} />
          <div className="rest-float__body">
            <span className="rest-float__label">Descanso</span>
            <span className="rest-float__time num">{formatClock(remaining ?? 0)}</span>
            <div className="rest-float__actions">
              <button type="button" className="btn btn--small btn--ghost" onClick={() => addTime(30)}>
                +30 s
              </button>
              <button type="button" className="btn btn--small btn--primary" onClick={stop}>
                Saltar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

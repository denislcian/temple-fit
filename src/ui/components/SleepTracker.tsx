// CAPA 3 · Interfaz — Seguimiento del sueño: reloj de noche, alarma y micrófono
// que detecta ruidos y ronquidos analizando el audio EN EL DISPOSITIVO.
import { useCallback, useEffect, useRef, useState } from 'react';
import { addSleepSession } from '../../data/repositories/sleepRepo';
import type { SleepSession } from '../../data/sleepModels';
import { playAlarmChime } from '../audio/soundscapes';
import { useSleepTracker } from '../hooks/useSleepTracker';
import { useWakeLock } from '../hooks/useWakeLock';
import { SleepReport } from './SleepReport';

function timeNow(): string {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Próxima ocurrencia de "HH:MM" en milisegundos (hoy o mañana). */
function nextAlarm(hhmm: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function SleepTracker({ onSaved }: { onSaved: () => void }) {
  const [ringing, setRinging] = useState(false);
  const onAlarm = useCallback(() => setRinging(true), []);
  const tracker = useSleepTracker(onAlarm);
  useWakeLock(tracker.phase === 'tracking');

  const [alarm, setAlarm] = useState('07:30');
  const [finished, setFinished] = useState<SleepSession | null>(null);
  const [clock, setClock] = useState(timeNow());
  const chimeRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Reloj en vivo durante el seguimiento.
  useEffect(() => {
    if (tracker.phase !== 'tracking') return;
    const id = setInterval(() => setClock(timeNow()), 1000);
    return () => clearInterval(id);
  }, [tracker.phase]);

  // Timbre repetido mientras suena la alarma.
  useEffect(() => {
    if (!ringing) return;
    playAlarmChime();
    chimeRef.current = setInterval(playAlarmChime, 3000);
    return () => clearInterval(chimeRef.current);
  }, [ringing]);

  async function finish() {
    clearInterval(chimeRef.current);
    setRinging(false);
    const session = tracker.stop();
    if (session && session.durationMin >= 1) {
      const saved = await addSleepSession(session);
      setFinished(saved);
      onSaved();
    }
  }

  const snore = tracker.events.filter((e) => e.kind === 'ronquido').length;
  const noise = tracker.events.length - snore;
  const mins = Math.floor(tracker.elapsedMs / 60000);

  if (finished) {
    return (
      <div>
        <p className="notice notice--success" role="status">
          Seguimiento guardado. Aquí tienes el resumen de tu noche.
        </p>
        <SleepReport session={finished} />
        <div className="btn-row" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="btn" onClick={() => setFinished(null)}>
            Hecho
          </button>
        </div>
      </div>
    );
  }

  if (tracker.phase === 'tracking') {
    return (
      <div className="sleep-night">
        <span className="sleep-clock num">{clock}</span>
        {ringing ? (
          <p className="sleep-wake">⏰ ¡Buenos días!</p>
        ) : (
          <p className="muted">Alarma a las {alarm} · pantalla encendida</p>
        )}

        <div className="sleep-meter" aria-hidden="true">
          <div className="sleep-meter-fill" style={{ width: `${tracker.level}%` }} />
        </div>

        <div className="sleep-live num" role="status">
          {mins} min escuchando · {snore} ronquidos · {noise} ruidos
        </div>

        <button type="button" className="btn btn--primary" onClick={finish}>
          {ringing ? 'Parar alarma y ver informe' : 'Terminar y ver informe'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {tracker.phase === 'error' && tracker.error && (
        <p className="notice notice--error" role="alert">
          {tracker.error}
        </p>
      )}
      <div className="field-row">
        <div className="field">
          <label htmlFor="alarm-time">Hora de la alarma</label>
          <input
            id="alarm-time"
            className="input"
            type="time"
            value={alarm}
            onChange={(e) => setAlarm(e.target.value)}
          />
        </div>
      </div>
      <p className="hint">
        Deja el teléfono cerca, boca arriba. El micrófono escucha la noche y detecta ruidos y
        ronquidos, y guarda un clip corto de los más sonoros para que puedas oírlos.{' '}
        <strong>Todo se procesa en tu dispositivo; nada se sube a ningún sitio.</strong>
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={() => tracker.start(nextAlarm(alarm))}>
          🌙 Empezar la noche
        </button>
      </div>
    </div>
  );
}

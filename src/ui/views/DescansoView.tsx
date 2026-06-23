// CAPA 3 · Interfaz — Descanso: sonidos para dormir (Web Audio procedural) y
// respiración guiada. Sin ficheros, sin red: todo se genera en el dispositivo.
import { useCallback, useState } from 'react';
import { getAllSleepSessions } from '../../data/repositories/sleepRepo';
import { MUSIC_TRACKS, SOUNDSCAPES, trackUrl } from '../audio/soundscapes';
import { BREATH_PATTERNS } from '../../domain/breathing';
import { BreathingGuide } from '../components/BreathingGuide';
import { SelectField } from '../components/Field';
import { SleepReport } from '../components/SleepReport';
import { SleepTracker } from '../components/SleepTracker';
import { useAsyncData } from '../hooks/useAsyncData';
import { useSoundscape } from '../hooks/useSoundscape';
import { formatShortDate } from '../utils/format';

const SLEEP_TIMERS = [15, 30, 60];
const SESSION_MINUTES = [1, 3, 5, 10];

export function DescansoView() {
  const sound = useSoundscape();
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0]!.id);
  const [sessionMin, setSessionMin] = useState(3);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0]!;
  const { data: nights, reload: reloadNights } = useAsyncData(
    useCallback(() => getAllSleepSessions(), []),
  );

  return (
    <>
      <span className="kicker">Recupérate y duerme mejor</span>
      <h1 id="view-title" tabIndex={-1}>
        Descanso
      </h1>

      <section className="card" aria-labelledby="sleep-heading">
        <h2 id="sleep-heading">Seguimiento del sueño</h2>
        <p className="muted">
          Un reloj de noche con alarma que, además, escucha y detecta tus ruidos y ronquidos.
        </p>
        <SleepTracker onSaved={reloadNights} />

        {nights && nights.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3>Tus noches</h3>
            {nights.map((n) => (
              <details key={n.id} className="night-row">
                <summary className="btn btn--small btn--ghost">
                  {formatShortDate(n.startedAt)} · {Math.floor(n.durationMin / 60)}h{' '}
                  {n.durationMin % 60}m · {n.snoreCount} ronquidos
                </summary>
                <SleepReport session={n} />
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="sounds-heading">
        <h2 id="sounds-heading">Sonidos y música para dormir</h2>
        <p className="muted">
          Paisajes sonoros que se generan en tu dispositivo (infinitos, sin descargar nada) y pistas
          de relajación. Suena una cosa a la vez; el volumen y el apagado valen para todo.
        </p>

        {!sound.supported && (
          <p className="notice notice--error" role="status">
            Tu navegador no permite generar audio. Prueba con otro navegador.
          </p>
        )}

        <div className="sound-grid">
          {SOUNDSCAPES.map((s) => {
            const active = sound.current === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`sound-card ${active ? 'is-active' : ''}`}
                aria-pressed={active}
                onClick={() => sound.toggle(s.id)}
                disabled={!sound.supported}
              >
                <span className="sound-emoji" aria-hidden="true">
                  {s.hint}
                </span>
                <span className="sound-label">{s.label}</span>
                <span className="sound-desc">{s.description}</span>
                <span className="sound-state" aria-hidden="true">
                  {active ? '❚❚ Sonando' : '▶ Reproducir'}
                </span>
              </button>
            );
          })}
        </div>

        <h3 style={{ marginTop: '1.25rem' }}>Música de relajación</h3>
        <div className="sound-grid">
          {MUSIC_TRACKS.map((t) => {
            const active = sound.current === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`sound-card ${active ? 'is-active' : ''}`}
                aria-pressed={active}
                onClick={() => sound.toggleTrack(t.id, trackUrl(t.file))}
                disabled={!sound.supported}
              >
                <span className="sound-emoji" aria-hidden="true">
                  🎵
                </span>
                <span className="sound-label">{t.label}</span>
                <span className="sound-state" aria-hidden="true">
                  {active ? '❚❚ Sonando' : '▶ Reproducir'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="vol">Volumen</label>
          <input
            id="vol"
            className="range"
            type="range"
            min={0}
            max={100}
            value={Math.round(sound.volume * 100)}
            onChange={(e) => sound.setVolume(Number(e.target.value) / 100)}
          />
        </div>

        <div className="btn-row" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className="muted" style={{ alignSelf: 'center' }}>
            Apagado automático:
          </span>
          {SLEEP_TIMERS.map((m) => (
            <button
              key={m}
              type="button"
              className={`btn btn--small ${sound.sleepMin === m ? 'btn--primary' : 'btn--ghost'}`}
              aria-pressed={sound.sleepMin === m}
              disabled={!sound.current}
              onClick={() => sound.startSleepTimer(m)}
            >
              {m} min
            </button>
          ))}
          {sound.sleepMin > 0 && (
            <button type="button" className="btn btn--small btn--ghost" onClick={sound.cancelSleepTimer}>
              Cancelar
            </button>
          )}
        </div>
        {sound.sleepMin > 0 && (
          <p className="muted" role="status">
            El sonido se irá apagando durante los próximos {sound.sleepMin} minutos.
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="breath-heading">
        <h2 id="breath-heading">Respiración guiada</h2>
        <p className="muted">{pattern.description}</p>

        <div className="field-row">
          <SelectField label="Ejercicio" value={patternId} onChange={setPatternId}>
            {BREATH_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Duración"
            value={String(sessionMin)}
            onChange={(v) => setSessionMin(Number(v))}
          >
            {SESSION_MINUTES.map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? 'minuto' : 'minutos'}
              </option>
            ))}
          </SelectField>
        </div>

        {/* key reinicia la guía al cambiar de ejercicio o duración. */}
        <BreathingGuide key={`${patternId}-${sessionMin}`} pattern={pattern} durationMin={sessionMin} />
      </section>
    </>
  );
}

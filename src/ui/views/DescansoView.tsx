// CAPA 3 · Interfaz — Descanso: sonidos para dormir (Web Audio procedural) y
// respiración guiada. Sin ficheros, sin red: todo se genera en el dispositivo.
import { useState } from 'react';
import { SOUNDSCAPES } from '../audio/soundscapes';
import { BREATH_PATTERNS } from '../../domain/breathing';
import { BreathingGuide } from '../components/BreathingGuide';
import { SelectField } from '../components/Field';
import { useSoundscape } from '../hooks/useSoundscape';

const SLEEP_TIMERS = [15, 30, 60];
const SESSION_MINUTES = [1, 3, 5, 10];

export function DescansoView() {
  const sound = useSoundscape();
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0]!.id);
  const [sessionMin, setSessionMin] = useState(3);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0]!;

  return (
    <>
      <span className="kicker">Recupérate y duerme mejor</span>
      <h1 id="view-title" tabIndex={-1}>
        Descanso
      </h1>

      <section className="card" aria-labelledby="sounds-heading">
        <h2 id="sounds-heading">Sonidos para dormir</h2>
        <p className="muted">
          Paisajes sonoros que se generan en tu dispositivo: suenan infinitos, sin descargar nada y
          sin conexión.
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

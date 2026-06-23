// CAPA 3 · Interfaz — Informe de una noche: resumen, gráfica de ruido y los
// momentos más sonoros.
import type { SleepSession } from '../../data/sleepModels';
import { sleepVerdict, summarizeNight } from '../../domain/sleepAnalysis';
import { formatShortDate } from '../utils/format';

function clock(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Reduce la curva de ruido a ~60 barras como máximo. */
function buckets(levels: number[], max = 60): number[] {
  if (levels.length <= max) return levels;
  const size = Math.ceil(levels.length / max);
  const out: number[] = [];
  for (let i = 0; i < levels.length; i += size) {
    out.push(Math.max(0, ...levels.slice(i, i + size)));
  }
  return out;
}

export function SleepReport({ session }: { session: SleepSession }) {
  const summary = summarizeNight(session.events);
  const bars = buckets(session.levels);
  const h = Math.floor(session.durationMin / 60);
  const m = session.durationMin % 60;

  return (
    <div className="sleep-report">
      <div className="stat-grid">
        <div className="stat">
          <span className="value num">
            {h}h {m}m
          </span>
          <span className="label">de seguimiento</span>
        </div>
        <div className="stat">
          <span className="value num">{session.snoreCount}</span>
          <span className="label">{session.snoreCount === 1 ? 'ronquido' : 'ronquidos'}</span>
        </div>
        <div className="stat">
          <span className="value num">{session.noiseCount}</span>
          <span className="label">{session.noiseCount === 1 ? 'otro ruido' : 'otros ruidos'}</span>
        </div>
      </div>

      <p className="chart-summary">{sleepVerdict(summary, session.durationMin)}</p>

      {bars.length > 0 && (
        <div
          className="noise-graph"
          role="img"
          aria-label={`Curva de ruido de la noche: ${summary.restlessMinutes} minutos con ruido de ${session.durationMin}.`}
        >
          {bars.map((lvl, i) => (
            <span key={i} className="noise-bar" style={{ height: `${Math.max(3, lvl)}%` }} />
          ))}
        </div>
      )}

      {summary.loudest.length > 0 && (
        <>
          <h3>Momentos más sonoros</h3>
          <ul className="item-list">
            {summary.loudest.slice(0, 6).map((e, i) => (
              <li key={i}>
                <div style={{ flex: 1 }}>
                  <span className="title">
                    {e.kind === 'ronquido' ? '😴 Ronquido' : '🔊 Ruido'}
                  </span>
                  <br />
                  <span className="meta num">
                    a las {clock(e.atMs)} de iniciar · {Math.round(e.durationMs / 100) / 10}s ·
                    intensidad {e.peak}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="hint">
        Registrado el {formatShortDate(session.startedAt)}. El audio se analizó en tu dispositivo y
        no se guardó.
      </p>
    </div>
  );
}

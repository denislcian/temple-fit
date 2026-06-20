// CAPA 3 · Interfaz — Calculadora de 1RM (repetición máxima estimada).
// Convierte una serie (peso × reps) en tu 1RM estimado y una tabla de
// porcentajes de trabajo. La lógica pura vive en src/domain/oneRepMax.ts.
import { useState } from 'react';
import { brzycki1RM, epley1RM, estimate1RM } from '../../domain/oneRepMax';
import { formatKg, parseReps, parseWeight } from '../utils/format';
import { TextField } from './Field';

// Porcentaje del 1RM → repeticiones aproximadas que sueles poder hacer.
const PERCENT_TABLE: Array<{ pct: number; reps: string }> = [
  { pct: 100, reps: '1' },
  { pct: 95, reps: '2' },
  { pct: 90, reps: '4' },
  { pct: 85, reps: '6' },
  { pct: 80, reps: '8' },
  { pct: 75, reps: '10' },
  { pct: 70, reps: '12' },
  { pct: 65, reps: '15' },
  { pct: 60, reps: '20' },
];

export function OneRepMaxCalculator({ initialWeight = '' }: { initialWeight?: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState('');

  const w = parseWeight(weight);
  const r = parseReps(reps);
  const valid = w !== null && w > 0 && r !== null && r >= 1 && r < 37;
  const oneRm = valid ? estimate1RM(w, r) : null;

  return (
    <>
      <div className="field-row">
        <TextField label="Peso (kg)" mode="decimal" value={weight} onChange={setWeight} />
        <TextField
          label="Repeticiones"
          mode="int"
          value={reps}
          onChange={setReps}
          hint="Hasta 36 reps"
        />
      </div>

      {oneRm !== null && w !== null && r !== null ? (
        <>
          <p className="chart-summary">
            Tu <strong>1RM estimado</strong> es{' '}
            <strong className="num text-accent">{formatKg(oneRm)}</strong>. Media de Epley (
            <span className="num">{formatKg(epley1RM(w, r))}</span>) y Brzycki (
            <span className="num">{formatKg(brzycki1RM(w, r))}</span>).
          </p>

          <section aria-label="Porcentajes de trabajo">
            <h3>Pesos por porcentaje</h3>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">% 1RM</th>
                  <th scope="col">Peso</th>
                  <th scope="col">Reps aprox.</th>
                </tr>
              </thead>
              <tbody>
                {PERCENT_TABLE.map((row) => (
                  <tr key={row.pct}>
                    <td className="num">{row.pct}%</td>
                    <td className="num">{formatKg(Math.round(((oneRm * row.pct) / 100) * 2) / 2)}</td>
                    <td className="num">{row.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">
              Las repeticiones por porcentaje son una guía general; varían con el ejercicio y la
              persona.
            </p>
          </section>
        </>
      ) : (
        <p className="muted">
          Escribe el peso y las repeticiones de una serie exigente (entre 1 y 36 reps) para estimar
          tu máximo.
        </p>
      )}
    </>
  );
}

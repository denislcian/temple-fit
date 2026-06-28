// CAPA 3 · Interfaz — Objetivo de peso con fecha estimada (estilo Cal AI).
// La proyección la calcula projectWeightGoal (dominio puro); aquí solo se
// recogen el peso objetivo y el ritmo, y se muestra el resultado.
import { useState } from 'react';
import { loadWeightGoal, saveWeightGoal } from '../../data/profile';
import { projectWeightGoal } from '../../domain/weightGoal';
import { formatDate, localDateISO, parseWeight } from '../utils/format';
import { useAnnounce } from './Announcer';
import { SelectField, TextField } from './Field';

const RATES = ['0.25', '0.5', '0.75', '1'] as const;

export function WeightGoalCard({ currentKg }: { currentKg: number | undefined }) {
  const announce = useAnnounce();
  const stored = loadWeightGoal();
  const [target, setTarget] = useState(stored ? String(stored.targetKg).replace('.', ',') : '');
  const [rate, setRate] = useState(stored ? String(stored.weeklyRateKg) : '0.5');
  const [error, setError] = useState<string | undefined>();

  const targetKg = parseWeight(target);

  function save() {
    if (targetKg === null || targetKg <= 0) {
      setError('Indica tu peso objetivo, p. ej. 75');
      return;
    }
    setError(undefined);
    saveWeightGoal({ targetKg, weeklyRateKg: Number(rate) });
    announce('Objetivo de peso guardado');
  }

  const projection =
    currentKg !== undefined && targetKg !== null && targetKg > 0
      ? projectWeightGoal(currentKg, targetKg, Number(rate), localDateISO())
      : null;

  return (
    <section className="card" aria-labelledby="goal-heading">
      <h2 id="goal-heading">Objetivo de peso</h2>
      {currentKg === undefined ? (
        <p className="muted">Registra tu peso arriba para estimar cuándo llegarás a tu objetivo.</p>
      ) : (
        <>
          <p className="muted num">Tu peso actual registrado: {currentKg} kg.</p>
          <TextField
            label="Peso objetivo"
            suffix="kg"
            mode="decimal"
            value={target}
            onChange={(v) => {
              setTarget(v);
              setError(undefined);
            }}
            error={error}
          />
          <SelectField label="Ritmo" value={rate} onChange={setRate}>
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r.replace('.', ',')} kg por semana
              </option>
            ))}
          </SelectField>
          <div className="btn-row">
            <button type="button" className="btn" onClick={save}>
              Guardar objetivo
            </button>
          </div>

          {projection && projection.direction !== 'mantener' && (
            <div className="weight-goal-result" role="status">
              <p className="num" style={{ margin: 0 }}>
                A {projection.weeklyRateKg.toLocaleString('es-ES')} kg/semana,{' '}
                {projection.direction === 'perder' ? 'perderás' : 'ganarás'}{' '}
                <strong>{projection.totalKg} kg</strong> y llegarás a {targetKg} kg el{' '}
                <strong>{formatDate(`${projection.targetDate}T12:00:00`)}</strong> (
                {projection.totalDays} días). Implica un{' '}
                {projection.direction === 'perder' ? 'déficit' : 'superávit'} de{' '}
                {projection.dailyKcal} kcal/día.
              </p>
              {projection.warning && <p className="hint" style={{ marginTop: '0.4rem' }}>⚠ {projection.warning}</p>}
            </div>
          )}
          {projection && projection.direction === 'mantener' && (
            <p className="weight-goal-result num" role="status" style={{ margin: '0.75rem 0 0' }}>
              Ya estás en tu peso objetivo. 🎯
            </p>
          )}
        </>
      )}
    </section>
  );
}

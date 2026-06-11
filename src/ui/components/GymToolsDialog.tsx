// CAPA 3 · Interfaz — Barra y calentamiento.
// Qué discos poner en la barra para tu peso objetivo y series de
// aproximación sugeridas. La lógica vive en src/domain/gymTools.ts.
import { useState } from 'react';
import { DEFAULT_BAR_KG, platesFor, warmupSets } from '../../domain/gymTools';
import { formatKg, parseWeight } from '../utils/format';
import { AppDialog } from './AppDialog';
import { SelectField, TextField } from './Field';

interface GymToolsDialogProps {
  open: boolean;
  initialWeight: string;
  exerciseName?: string | undefined;
  onClose: () => void;
}

export function GymToolsDialog({ open, initialWeight, exerciseName, onClose }: GymToolsDialogProps) {
  const [weight, setWeight] = useState(initialWeight);
  const [bar, setBar] = useState(String(DEFAULT_BAR_KG));

  const target = parseWeight(weight);
  const barKg = Number(bar);
  const plates = target !== null && target > 0 ? platesFor(target, barKg) : null;
  const warmup = target !== null && target > 0 ? warmupSets(target, barKg) : [];

  return (
    <AppDialog
      open={open}
      title={exerciseName ? `Barra y calentamiento · ${exerciseName}` : 'Barra y calentamiento'}
      onClose={onClose}
    >
      <TextField
        label="Peso de trabajo (kg)"
        mode="decimal"
        value={weight}
        onChange={setWeight}
        hint="Discos estándar por lado: 25 / 20 / 15 / 10 / 5 / 2,5 / 1,25"
      />
      <SelectField label="Barra" value={bar} onChange={setBar}>
        <option value="20">Olímpica · 20 kg</option>
        <option value="15">Media · 15 kg</option>
        <option value="10">Técnica · 10 kg</option>
      </SelectField>

      {plates && (
        <section aria-label="Montaje de la barra">
          <h3>En cada lado</h3>
          {plates.perSide.length > 0 ? (
            <p className="num" style={{ fontSize: '1.2rem' }}>
              {plates.perSide.map((p) => formatKg(p)).join('  ·  ')}
            </p>
          ) : (
            <p className="muted">Solo la barra ({formatKg(barKg)}).</p>
          )}
          {plates.residualKg > 0 ? (
            <p className="chart-summary num">
              Con discos estándar te quedas en {formatKg(plates.achievedKg)} (faltan{' '}
              {formatKg(plates.residualKg)} para el objetivo).
            </p>
          ) : (
            <p className="chart-summary num">Total exacto: {formatKg(plates.achievedKg)}.</p>
          )}
        </section>
      )}

      {warmup.length > 0 && (
        <section aria-label="Calentamiento sugerido">
          <h3>Aproximación sugerida</h3>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Serie</th>
                <th scope="col">Peso</th>
                <th scope="col">Reps</th>
              </tr>
            </thead>
            <tbody>
              {warmup.map((w, i) => (
                <tr key={i}>
                  <td>{w.pct === 0 ? 'Barra vacía' : `${w.pct}%`}</td>
                  <td className="num">{formatKg(w.weightKg)}</td>
                  <td className="num">{w.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="btn-row" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </AppDialog>
  );
}

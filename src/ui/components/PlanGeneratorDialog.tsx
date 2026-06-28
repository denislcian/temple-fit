// CAPA 3 · Interfaz — Generador de plan de entrenamiento según objetivos.
// El algoritmo vive en src/domain/routineGenerator.ts (puro y testeado);
// este diálogo solo recoge opciones, muestra la vista previa y guarda.
import { useState } from 'react';
import type { Exercise } from '../../data/models';
import { addRoutine } from '../../data/repositories/routineRepo';
import {
  generatePlan,
  type EquipmentProfile,
  type GeneratedPlan,
  type GeneratorOptions,
  type Goal,
  type Level,
} from '../../domain/routineGenerator';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';
import { SelectField } from './Field';

interface PlanGeneratorDialogProps {
  open: boolean;
  exercises: Exercise[];
  onSaved: () => Promise<void>;
  onClose: () => void;
}

export function PlanGeneratorDialog({
  open,
  exercises,
  onSaved,
  onClose,
}: PlanGeneratorDialogProps) {
  const announce = useAnnounce();
  const [goal, setGoal] = useState<Goal>('hipertrofia');
  const [days, setDays] = useState('3');
  const [equipment, setEquipment] = useState<EquipmentProfile>('gimnasio');
  const [level, setLevel] = useState<Level>('principiante');
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  function generate() {
    const options: GeneratorOptions = {
      goal,
      daysPerWeek: Number(days) as GeneratorOptions['daysPerWeek'],
      equipment,
      level,
    };
    const result = generatePlan(options, exercises);
    setPlan(result);
    announce(`Plan generado: ${result.days.length} días de entrenamiento`);
  }

  async function savePlan() {
    if (!plan) return;
    for (const day of plan.days) {
      await addRoutine({
        name: `${plan.title} — ${day.name}`,
        exerciseIds: day.exerciseIds,
        notes: day.notes,
      });
    }
    announce(`Plan guardado: ${plan.days.length} rutinas nuevas`);
    setPlan(null);
    await onSaved();
    onClose();
  }

  return (
    <AppDialog open={open} title="Generar plan según tu objetivo" onClose={onClose}>
      <fieldset className="form-section">
        <legend>Configura tu plan</legend>
        <SelectField label="Objetivo" value={goal} onChange={(v) => setGoal(v as Goal)}>
        <option value="fuerza">Fuerza (pesos altos, pocas repeticiones)</option>
        <option value="hipertrofia">Hipertrofia (ganar músculo)</option>
        <option value="definicion">Definición (perder grasa manteniendo músculo)</option>
      </SelectField>
      <SelectField label="Días de entrenamiento por semana" value={days} onChange={setDays}>
        <option value="2">2 días</option>
        <option value="3">3 días</option>
        <option value="4">4 días</option>
        <option value="5">5 días</option>
      </SelectField>
      <SelectField
        label="Material disponible"
        value={equipment}
        onChange={(v) => setEquipment(v as EquipmentProfile)}
      >
        <option value="gimnasio">Gimnasio completo</option>
        <option value="mancuernas">Mancuernas y kettlebell en casa</option>
        <option value="casa">Solo peso corporal y bandas</option>
      </SelectField>
      <SelectField label="Nivel" value={level} onChange={(v) => setLevel(v as Level)}>
        <option value="principiante">Principiante (menos de 1 año entrenando)</option>
        <option value="intermedio">Intermedio</option>
      </SelectField>
      </fieldset>

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={generate}>
          {plan ? 'Volver a generar' : 'Generar plan'}
        </button>
      </div>

      {plan && (
        <section aria-label="Vista previa del plan" style={{ marginTop: '1rem' }}>
          <p className="chart-summary">{plan.summary}</p>
          {plan.days.map((day) => (
            <div key={day.name} className="card">
              <h3>{day.name}</h3>
              <p className="muted">{day.notes}</p>
              <ul>
                {day.exerciseIds.map((id) => (
                  <li key={id}>{nameById.get(id) ?? id}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={savePlan}>
              Guardar plan ({plan.days.length} rutinas)
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </section>
      )}
    </AppDialog>
  );
}

// CAPA 3 · Interfaz — Generador de menú diario a partir de tus objetivos.
// El algoritmo (sistema lineal 3×3 por comida) vive en src/domain.
import { useState } from 'react';
import { MEAL_LABELS } from '../../data/nutritionModels';
import { addDiaryEntryAbsolute, searchFoods } from '../../data/repositories/nutritionRepo';
import { generateDiet, type DietPlan } from '../../domain/dietGenerator';
import type { MacroTargets } from '../../domain/nutritionTargets';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';

interface DietDialogProps {
  open: boolean;
  date: string;
  targets: MacroTargets;
  onAdded: () => Promise<void>;
  onClose: () => void;
}

export function DietDialog({ open, date, targets, onAdded, onClose }: DietDialogProps) {
  const announce = useAnnounce();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [variant, setVariant] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function generate(nextVariant: number) {
    try {
      const foods = await searchFoods('', 500);
      const result = generateDiet(targets, foods, nextVariant);
      setPlan(result);
      setVariant(nextVariant);
      setError(null);
      announce('Menú del día generado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el menú');
    }
  }

  async function addAll() {
    if (!plan) return;
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        await addDiaryEntryAbsolute({
          date,
          meal: meal.meal,
          foodName: item.foodName,
          foodId: item.foodId,
          grams: item.grams,
          macros: { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG },
        });
      }
    }
    announce('Menú completo añadido al diario');
    setPlan(null);
    await onAdded();
    onClose();
  }

  return (
    <AppDialog open={open} title="Generar menú del día" onClose={onClose}>
      <p className="muted">
        Compone un día completo con alimentos reales para acercarse a tus objetivos:{' '}
        <span className="num">
          {targets.kcal} kcal · P {targets.proteinG} g · C {targets.carbsG} g · G {targets.fatG} g
        </span>
        . Las cantidades son orientativas, no consejo médico.
      </p>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={() => generate(plan ? variant + 1 : 0)}>
          {plan ? 'Otra propuesta' : 'Generar menú'}
        </button>
      </div>

      {plan && (
        <section aria-label="Menú propuesto" style={{ marginTop: '1rem' }}>
          {plan.meals.map((meal) => (
            <div key={meal.meal} className="card">
              <h3>{MEAL_LABELS[meal.meal]}</h3>
              <ul>
                {meal.items.map((item) => (
                  <li key={item.foodId} className="num">
                    {item.foodName} — {item.grams} g ({item.kcal} kcal)
                  </li>
                ))}
              </ul>
              <p className="meta num">
                {meal.totals.kcal} kcal · P {meal.totals.proteinG} · C {meal.totals.carbsG} · G {meal.totals.fatG}
              </p>
            </div>
          ))}
          <p className="chart-summary num">
            Total del menú: {plan.totals.kcal} kcal · P {plan.totals.proteinG} g · C {plan.totals.carbsG} g · G{' '}
            {plan.totals.fatG} g
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={addAll}>
              Añadir todo al diario
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </section>
      )}
    </AppDialog>
  );
}

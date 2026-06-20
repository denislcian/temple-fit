// CAPA 3 · Interfaz — Nutrición: diario de calorías y macros.
// Lo que MyFitnessPal cobra (escáner, objetivos, sin anuncios), aquí gratis
// y con tus datos en tu dispositivo.
import { useCallback, useMemo, useState } from 'react';
import { WATER_GOAL_GLASSES } from '../../data/bodyModels';
import type { Meal } from '../../data/nutritionModels';
import { MEAL_LABELS, MEALS } from '../../data/nutritionModels';
import { loadProfile } from '../../data/profile';
import { getWater, setWater } from '../../data/repositories/bodyRepo';
import {
  addDiaryEntryAbsolute,
  dayTotals,
  getDiary,
  removeDiaryEntry,
} from '../../data/repositories/nutritionRepo';
import { macroTargets } from '../../domain/nutritionTargets';
import { useAnnounce } from '../components/Announcer';
import { AddFoodDialog } from '../components/AddFoodDialog';
import { DietDialog } from '../components/DietDialog';
import { useAsyncData } from '../hooks/useAsyncData';
import { addDays, formatDate, localDateISO } from '../utils/format';

function MacroBar({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100));
  const over = value > target * 1.05;
  return (
    <div className="macro-row">
      <span className="macro-label">
        {label}: <strong className="num">{Math.round(value)}</strong>
        <span className="muted num">
          {' '}
          / {target} {unit}
        </span>
      </span>
      <div className="macro-bar" aria-hidden="true">
        <div className={`fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function NutritionView() {
  const announce = useAnnounce();
  const [date, setDate] = useState(localDateISO());
  const [addingTo, setAddingTo] = useState<Meal | null>(null);
  const [dietOpen, setDietOpen] = useState(false);

  const profile = loadProfile();
  const targets = profile ? macroTargets(profile) : null;

  const loadEntries = useCallback(() => getDiary(date), [date]);
  const { data: entries, reload } = useAsyncData(loadEntries);
  const loadWater = useCallback(() => getWater(date), [date]);
  const { data: waterGlasses, reload: reloadWater } = useAsyncData(loadWater);

  const totals = useMemo(() => dayTotals(entries ?? []), [entries]);
  const isToday = date === localDateISO();

  async function changeWater(delta: number) {
    const value = await setWater(date, (waterGlasses ?? 0) + delta);
    await reloadWater();
    announce(`${value} de ${WATER_GOAL_GLASSES} vasos de agua`);
  }

  async function copyYesterday() {
    const yesterday = await getDiary(addDays(date, -1));
    if (yesterday.length === 0) {
      announce('El día anterior no tiene registros que copiar');
      return;
    }
    for (const e of yesterday) {
      await addDiaryEntryAbsolute({
        date,
        meal: e.meal,
        foodName: e.foodName,
        ...(e.foodId ? { foodId: e.foodId } : {}),
        grams: e.grams,
        macros: { kcal: e.kcal, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG },
      });
    }
    await reload();
    announce(`${yesterday.length} alimentos copiados del día anterior`);
  }

  return (
    <>
      <span className="kicker">Combustible para la forja</span>
      <h1 id="view-title" tabIndex={-1}>
        Nutrición
      </h1>

      {!profile && (
        <div className="card card--accent">
          <h2>Primero, tu perfil</h2>
          <p>
            Para calcular tus objetivos de calorías y macros necesito tus datos corporales y tu
            objetivo. Se guardan solo en este dispositivo.
          </p>
          <a className="btn btn--primary" href="#/ajustes">
            Completar mi perfil en Ajustes
          </a>
        </div>
      )}

      <div className="card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{isToday ? 'Hoy' : formatDate(`${date}T12:00:00`)}</h2>
          <div className="btn-row">
            <button type="button" className="btn btn--small" onClick={() => setDate(addDays(date, -1))}>
              ← Día anterior
            </button>
            {!isToday && (
              <button type="button" className="btn btn--small" onClick={() => setDate(localDateISO())}>
                Hoy
              </button>
            )}
            <button
              type="button"
              className="btn btn--small"
              onClick={() => setDate(addDays(date, 1))}
              disabled={isToday}
            >
              Día siguiente →
            </button>
          </div>
        </div>

        {targets ? (
          <div style={{ marginTop: '0.75rem' }}>
            <MacroBar label="Calorías" value={totals.kcal} target={targets.kcal} unit="kcal" />
            <MacroBar label="Proteína" value={totals.proteinG} target={targets.proteinG} unit="g" />
            <MacroBar label="Carbohidratos" value={totals.carbsG} target={targets.carbsG} unit="g" />
            <MacroBar label="Grasa" value={totals.fatG} target={targets.fatG} unit="g" />
          </div>
        ) : (
          <p className="muted num" style={{ marginTop: '0.75rem' }}>
            Consumido: {totals.kcal} kcal · P {totals.proteinG} g · C {totals.carbsG} g · G {totals.fatG} g
          </p>
        )}

        <div className="btn-row" style={{ marginTop: '0.75rem' }}>
          {targets && (
            <button type="button" className="btn" onClick={() => setDietOpen(true)}>
              ✦ Generar menú del día
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={copyYesterday}>
            ⧉ Copiar el día anterior
          </button>
        </div>

        <div className="water" role="group" aria-label="Hidratación del día">
          <button
            type="button"
            className="btn btn--small water-btn"
            onClick={() => changeWater(-1)}
            disabled={(waterGlasses ?? 0) === 0}
            aria-label="Quitar un vaso de agua"
          >
            −
          </button>
          <span className="water-cups" aria-hidden="true">
            {Array.from({ length: WATER_GOAL_GLASSES }, (_, i) => (
              <span key={i} className={`cup ${i < (waterGlasses ?? 0) ? 'full' : ''}`}>
                💧
              </span>
            ))}
          </span>
          <span className="num">
            {waterGlasses ?? 0} de {WATER_GOAL_GLASSES} vasos
            {(waterGlasses ?? 0) > WATER_GOAL_GLASSES ? ' ¡y extra!' : ''}
          </span>
          <button
            type="button"
            className="btn btn--small water-btn water-btn--add"
            onClick={() => changeWater(1)}
            aria-label="Añadir un vaso de agua"
          >
            +
          </button>
        </div>
      </div>

      {MEALS.map((meal) => {
        const mealEntries = (entries ?? []).filter((e) => e.meal === meal);
        const mealKcal = mealEntries.reduce((a, e) => a + e.kcal, 0);
        return (
          <section key={meal} className="card" aria-label={MEAL_LABELS[meal]}>
            <div className="btn-row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>
                {MEAL_LABELS[meal]} <span className="muted num">· {Math.round(mealKcal)} kcal</span>
              </h2>
              <button type="button" className="btn btn--small btn--primary" onClick={() => setAddingTo(meal)}>
                + Añadir<span className="visually-hidden"> alimento a {MEAL_LABELS[meal]}</span>
              </button>
            </div>
            <ul className="item-list">
              {mealEntries.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <span className="title">{entry.foodName}</span>
                    <br />
                    <span className="meta num">
                      {entry.grams} g · {entry.kcal} kcal · P {entry.proteinG} · C {entry.carbsG} · G {entry.fatG}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={async () => {
                      await removeDiaryEntry(entry.id);
                      await reload();
                      announce(`${entry.foodName} eliminado del diario`);
                    }}
                  >
                    <span aria-hidden="true">✕</span>
                    <span className="visually-hidden">Eliminar {entry.foodName}</span>
                  </button>
                </li>
              ))}
              {mealEntries.length === 0 && <li className="muted">Sin registros todavía.</li>}
            </ul>
          </section>
        );
      })}

      {addingTo && (
        <AddFoodDialog
          open={addingTo !== null}
          date={date}
          meal={addingTo}
          onAdded={reload}
          onClose={() => setAddingTo(null)}
        />
      )}

      {targets && (
        <DietDialog
          open={dietOpen}
          date={date}
          targets={targets}
          onAdded={reload}
          onClose={() => setDietOpen(false)}
        />
      )}
    </>
  );
}

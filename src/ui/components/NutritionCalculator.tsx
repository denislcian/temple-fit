// CAPA 3 · Interfaz — Calculadora nutricional. Recoge datos, calcula con el
// motor puro (src/domain/nutritionCalc.ts) y muestra cada resultado con su
// FUENTE científica citada (src/data/formulaReferences.ts). Sin cajas negras.
import { useMemo, useState } from 'react';
import { FORMULA_REFERENCES } from '../../data/formulaReferences';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  bmi,
  bmiCategory,
  bmrMifflin,
  bodyFatCategory,
  bodyFatNavy,
  calorieTarget,
  macroSplit,
  proteinRange,
  tdee,
  waterMl,
  type Activity,
  type Goal,
  type Sex,
} from '../../domain/nutritionCalc';
import { SelectField, TextField } from './Field';

function parseNum(value: string): number | null {
  const n = Number(value.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Enlace corto a la fuente científica de un cálculo. */
function Source({ id, label }: { id: string; label: string }) {
  const ref = FORMULA_REFERENCES[id];
  if (!ref) return null;
  return (
    <a className="source-link" href={ref.url} target="_blank" rel="noopener noreferrer">
      Fuente: {label}
    </a>
  );
}

const USED_REFS = ['mifflin', 'issn-protein', 'efsa-water', 'navy-bodyfat', 'who-bmi', 'ace-bodyfat'];

export function NutritionCalculator() {
  const [sex, setSex] = useState<Sex>('hombre');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<Activity>('moderado');
  const [goal, setGoal] = useState<Goal>('mantenimiento');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');

  const result = useMemo(() => {
    const a = parseNum(age);
    const h = parseNum(height);
    const kg = parseNum(weight);
    if (a === null || h === null || kg === null) return null;

    const bmr = bmrMifflin(sex, kg, h, Math.round(a));
    const tdeeValue = tdee(bmr, activity);
    const calories = calorieTarget(tdeeValue, goal);
    const protein = proteinRange(kg, goal);
    const proteinTarget = Math.round((protein.minG + protein.maxG) / 2);
    return {
      bmr,
      tdee: tdeeValue,
      calories,
      protein,
      water: waterMl(kg),
      bmiValue: bmi(kg, h),
      macros: macroSplit(calories, proteinTarget, kg),
    };
  }, [sex, age, height, weight, activity, goal]);

  const fat = useMemo(() => {
    const h = parseNum(height);
    const n = parseNum(neck);
    const w = parseNum(waist);
    const hp = parseNum(hip);
    if (h === null || n === null || w === null) return undefined;
    const bf = bodyFatNavy(sex, h, n, w, hp ?? undefined);
    return bf === null ? null : { bf, category: bodyFatCategory(sex, bf) };
  }, [sex, height, neck, waist, hip]);

  return (
    <>
      <div className="field-row">
        <SelectField label="Sexo" value={sex} onChange={(v) => setSex(v as Sex)}>
          <option value="hombre">Hombre</option>
          <option value="mujer">Mujer</option>
        </SelectField>
        <TextField label="Edad" suffix="años" mode="int" value={age} onChange={setAge} />
      </div>
      <div className="field-row">
        <TextField label="Altura" suffix="cm" mode="int" value={height} onChange={setHeight} />
        <TextField label="Peso corporal" suffix="kg" mode="decimal" value={weight} onChange={setWeight} />
      </div>
      <SelectField label="Nivel de actividad" value={activity} onChange={(v) => setActivity(v as Activity)}>
        {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
          <option key={a} value={a}>
            {ACTIVITY_LABELS[a]}
          </option>
        ))}
      </SelectField>
      <SelectField label="Objetivo" value={goal} onChange={(v) => setGoal(v as Goal)}>
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
          <option key={g} value={g}>
            {GOAL_LABELS[g]}
          </option>
        ))}
      </SelectField>

      {result ? (
        <>
          <div className="calc-hero">
            <span className="calc-hero__value num">{result.calories.toLocaleString('es-ES')}</span>
            <span className="calc-hero__label">kcal/día objetivo</span>
            <span className="calc-hero__sub num">
              Basal {result.bmr.toLocaleString('es-ES')} · gasto total{' '}
              {result.tdee.toLocaleString('es-ES')} kcal
            </span>
            <Source id="mifflin" label="Mifflin-St Jeor, 1990" />
          </div>

          <div className="stat-grid">
            <div className="stat">
              <span className="value num">
                {result.protein.minG}-{result.protein.maxG}
              </span>
              <span className="label">g de proteína/día</span>
            </div>
            <div className="stat">
              <span className="value num">{(result.water / 1000).toFixed(1).replace('.', ',')} L</span>
              <span className="label">de agua/día</span>
            </div>
            <div className="stat">
              <span className="value num">{String(result.bmiValue).replace('.', ',')}</span>
              <span className="label">IMC · {bmiCategory(result.bmiValue)}</span>
            </div>
          </div>

          <h3>Reparto de macros (a las kcal objetivo)</h3>
          <div className="macro-split">
            <div className="macro-split__item">
              <span className="num">{result.macros.proteinG} g</span>
              <span>Proteína</span>
            </div>
            <div className="macro-split__item">
              <span className="num">{result.macros.carbsG} g</span>
              <span>Hidratos</span>
            </div>
            <div className="macro-split__item">
              <span className="num">{result.macros.fatG} g</span>
              <span>Grasa</span>
            </div>
          </div>
          <p className="hint">
            Proteína por <Source id="issn-protein" label="ISSN, 2017" />; agua por{' '}
            <Source id="efsa-water" label="EFSA, 2010" />; IMC por <Source id="who-bmi" label="OMS" />.
          </p>

          <section className="calc-bodyfat" aria-labelledby="bf-heading">
            <h3 id="bf-heading">% de grasa corporal (opcional)</h3>
            <p className="hint">
              Mide en cm con una cinta: cuello bajo la nuez y cintura a la altura del ombligo
              {sex === 'mujer' ? ' (y la cadera en su punto más ancho)' : ''}.
            </p>
            <div className="field-row">
              <TextField label="Cuello" suffix="cm" mode="decimal" value={neck} onChange={setNeck} />
              <TextField label="Cintura" suffix="cm" mode="decimal" value={waist} onChange={setWaist} />
            </div>
            {sex === 'mujer' && (
              <TextField label="Cadera" suffix="cm" mode="decimal" value={hip} onChange={setHip} />
            )}
            {fat && (
              <>
                <div className="calc-hero calc-hero--bf">
                  <span className="calc-hero__value num">
                    {String(fat.bf).replace('.', ',')}%
                  </span>
                  <span className="calc-hero__label">grasa corporal · {fat.category}</span>
                  <Source id="navy-bodyfat" label="Marina EE. UU. (Hodgdon-Beckett, 1984)" />
                </div>
                <p className="hint">
                  Rangos por <Source id="ace-bodyfat" label="American Council on Exercise" />. Es una
                  estimación por circunferencias (±3-4 %), no una medición DEXA.
                </p>
              </>
            )}
            {fat === null && (
              <p className="muted">Revisa las medidas: la cintura debe superar al cuello.</p>
            )}
          </section>

          <details className="calc-refs">
            <summary>Referencias científicas</summary>
            <ul className="item-list">
              {USED_REFS.map((id) => {
                const ref = FORMULA_REFERENCES[id];
                if (!ref) return null;
                return (
                  <li key={id}>
                    <div>
                      <span className="title">{ref.what}</span>
                      <br />
                      <span className="meta">
                        {ref.authors} ({ref.year}). {ref.title}. <em>{ref.source}</em>.
                      </span>
                    </div>
                    <a
                      className="btn btn--small btn--ghost"
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      ) : (
        <p className="muted">
          Rellena edad, altura y peso para ver tus calorías, proteína, agua, IMC y macros, cada uno
          con su fuente científica.
        </p>
      )}
    </>
  );
}

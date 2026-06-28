// CAPA 3 · Interfaz — Perfil del usuario (datos corporales y objetivo).
// Alimenta los objetivos de calorías/macros de Nutrición y el nombre con el
// que publicas en Comunidad. Todo se guarda solo en este dispositivo.
import { useMemo, useState } from 'react';
import { loadProfile, saveProfile, type UserProfile } from '../../data/profile';
import {
  ACTIVITY_LABELS,
  macroTargets,
  NUTRITION_GOAL_LABELS,
  tdee,
  type ActivityLevel,
  type NutritionGoal,
  type Sex,
} from '../../domain/nutritionTargets';
import { parseReps, parseWeight } from '../utils/format';
import { useAnnounce } from './Announcer';
import { SelectField, TextField } from './Field';

interface FormState {
  displayName: string;
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
  goal: NutritionGoal;
}

function toForm(profile: UserProfile | null): FormState {
  return {
    displayName: profile?.displayName ?? '',
    sex: profile?.sex ?? 'hombre',
    age: profile ? String(profile.age) : '',
    heightCm: profile ? String(profile.heightCm) : '',
    weightKg: profile ? String(profile.weightKg) : '',
    activity: profile?.activity ?? 'moderado',
    goal: profile?.goal ?? 'mantenimiento',
  };
}

export function ProfileCard({ onSaved }: { onSaved?: () => void }) {
  const announce = useAnnounce();
  const [form, setForm] = useState<FormState>(() => toForm(loadProfile()));
  const [errors, setErrors] = useState<Partial<Record<'age' | 'heightCm' | 'weightKg', string>>>({});
  const [saved, setSaved] = useState(false);

  const parsed = useMemo(() => {
    const age = parseReps(form.age);
    const heightCm = parseWeight(form.heightCm);
    const weightKg = parseWeight(form.weightKg);
    if (age === null || heightCm === null || !heightCm || weightKg === null || !weightKg) {
      return null;
    }
    const profile: UserProfile = {
      displayName: form.displayName.trim() || 'Atleta anónimo',
      sex: form.sex,
      age,
      heightCm,
      weightKg,
      activity: form.activity,
      goal: form.goal,
    };
    return { profile, tdee: tdee(profile), targets: macroTargets(profile) };
  }, [form]);

  function update(changes: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors({});
    setSaved(false);
  }

  function save() {
    if (!parsed) {
      setErrors({
        age: parseReps(form.age) === null ? 'Edad en años, p. ej. 28' : undefined,
        heightCm: !parseWeight(form.heightCm) ? 'Altura en cm, p. ej. 178' : undefined,
        weightKg: !parseWeight(form.weightKg) ? 'Peso en kg, p. ej. 76,5' : undefined,
      });
      announce('Revisa los datos del perfil antes de guardar');
      return;
    }
    saveProfile(parsed.profile);
    setSaved(true);
    announce('Perfil guardado');
    onSaved?.();
  }

  return (
    <section className="card" aria-labelledby="profile-heading">
      <h2 id="profile-heading">Tu perfil</h2>
      <p className="muted">
        Con estos datos se calculan tus objetivos de calorías y macros (fórmula de Mifflin-St
        Jeor). Se guardan solo en este dispositivo.
      </p>

      <TextField
        label="Nombre para la comunidad"
        value={form.displayName}
        onChange={(displayName) => update({ displayName })}
        hint="Con este nombre firman tus publicaciones."
        autoComplete="nickname"
      />
      <SelectField label="Sexo" value={form.sex} onChange={(v) => update({ sex: v as Sex })}>
        <option value="hombre">Hombre</option>
        <option value="mujer">Mujer</option>
      </SelectField>
      <TextField
        label="Edad"
        suffix="años"
        mode="int"
        value={form.age}
        onChange={(age) => update({ age })}
        error={errors.age}
      />
      <TextField
        label="Altura"
        suffix="cm"
        mode="decimal"
        value={form.heightCm}
        onChange={(heightCm) => update({ heightCm })}
        error={errors.heightCm}
      />
      <TextField
        label="Peso"
        suffix="kg"
        mode="decimal"
        value={form.weightKg}
        onChange={(weightKg) => update({ weightKg })}
        error={errors.weightKg}
      />
      <SelectField
        label="Nivel de actividad"
        value={form.activity}
        onChange={(v) => update({ activity: v as ActivityLevel })}
      >
        {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Objetivo"
        value={form.goal}
        onChange={(v) => update({ goal: v as NutritionGoal })}
      >
        {Object.entries(NUTRITION_GOAL_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      {parsed && (
        <div className="stat-grid" aria-label="Objetivos diarios calculados">
          <div className="stat">
            <span className="value num">{parsed.targets.kcal}</span>
            <span className="label">kcal/día objetivo</span>
          </div>
          <div className="stat">
            <span className="value num">{parsed.targets.proteinG} g</span>
            <span className="label">proteína</span>
          </div>
          <div className="stat">
            <span className="value num">{parsed.targets.carbsG} g</span>
            <span className="label">carbohidratos</span>
          </div>
          <div className="stat">
            <span className="value num">{parsed.targets.fatG} g</span>
            <span className="label">grasa</span>
          </div>
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={save}>
          Guardar perfil
        </button>
        {saved && (
          <span className="notice notice--success" role="status" style={{ margin: 0 }}>
            Perfil guardado
          </span>
        )}
      </div>
    </section>
  );
}

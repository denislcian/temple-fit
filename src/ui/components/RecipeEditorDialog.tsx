// CAPA 3 · Interfaz — Crear una receta propia (con macros, pasos y vídeo).
// Al guardarla queda en "Mis recetas" y puede publicarse en la comunidad para
// que otras personas la guarden.
import { useState } from 'react';
import { addUserRecipe } from '../../data/repositories/userRecipeRepo';
import {
  CATEGORY_LABELS,
  RECIPE_CATEGORIES,
  type RecipeCategory,
  type RecipeIngredient,
  type SharedRecipePayload,
} from '../../data/recipeModels';
import { parseYouTubeId } from '../../domain/youtube';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';
import { SelectField, TextAreaField, TextField } from './Field';

interface RecipeEditorDialogProps {
  open: boolean;
  onSaved: () => void | Promise<void>;
  onClose: () => void;
}

/** "Ingrediente — cantidad" por línea (el guion largo o corto separan). */
function parseIngredients(text: string): RecipeIngredient[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+[—–-]\s+/);
      return parts.length >= 2
        ? { item: parts[0]!.trim(), amount: parts.slice(1).join(' - ').trim() }
        : { item: line, amount: '' };
    });
}

export function RecipeEditorDialog({ open, onSaved, onClose }: RecipeEditorDialogProps) {
  const announce = useAnnounce();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('comida');
  const [minutes, setMinutes] = useState('20');
  const [servings, setServings] = useState('2');
  const [servingG, setServingG] = useState('300');
  const [kcal, setKcal] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsedIngredients = parseIngredients(ingredients);
    const parsedSteps = steps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!name.trim()) return setError('Ponle nombre a la receta.');
    if (parsedIngredients.length === 0) return setError('Añade al menos un ingrediente.');
    if (parsedSteps.length === 0) return setError('Describe al menos un paso.');
    const kcalN = Number(kcal.replace(',', '.'));
    if (!Number.isFinite(kcalN) || kcalN <= 0) {
      return setError('Indica las kcal por ración (número mayor que 0).');
    }
    if (ytUrl.trim() && !parseYouTubeId(ytUrl)) {
      return setError('El enlace de vídeo no parece de YouTube.');
    }

    const num = (v: string) => {
      const n = Number(v.replace(',', '.'));
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
    };

    const recipe: SharedRecipePayload = {
      name: name.trim(),
      emoji: '',
      description: description.trim() || 'Receta de la comunidad TMPL.',
      difficulty: 'facil',
      tip: '',
      category,
      tags: [],
      minutes: Math.max(1, Math.round(num(minutes))),
      servings: Math.max(1, Math.round(num(servings))),
      servingG: Math.max(1, Math.round(num(servingG))),
      kcal: Math.round(kcalN),
      proteinG: num(proteinG),
      carbsG: num(carbsG),
      fatG: num(fatG),
      ingredients: parsedIngredients,
      steps: parsedSteps,
      ...(ytUrl.trim() ? { ytUrl: ytUrl.trim() } : {}),
    };

    setBusy(true);
    setError('');
    await addUserRecipe(recipe, 'propia');
    setBusy(false);
    announce(`Receta "${recipe.name}" guardada en Mis recetas`);
    await onSaved();
    onClose();
  }

  return (
    <AppDialog open={open} title="Crear receta" onClose={onClose}>
      <TextField label="Nombre" value={name} onChange={setName} required />
      <div className="field-row">
        <SelectField label="Momento" value={category} onChange={(v) => setCategory(v as RecipeCategory)}>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </SelectField>
        <TextField label="Minutos" mode="int" value={minutes} onChange={setMinutes} />
      </div>
      <div className="field-row">
        <TextField label="Raciones" mode="int" value={servings} onChange={setServings} />
        <TextField label="Gramos por ración" mode="int" value={servingG} onChange={setServingG} />
      </div>

      <h3>Macros por ración</h3>
      <div className="field-row">
        <TextField label="kcal" mode="int" value={kcal} onChange={setKcal} required />
        <TextField label="Proteína (g)" mode="decimal" value={proteinG} onChange={setProteinG} />
      </div>
      <div className="field-row">
        <TextField label="Carbohidratos (g)" mode="decimal" value={carbsG} onChange={setCarbsG} />
        <TextField label="Grasa (g)" mode="decimal" value={fatG} onChange={setFatG} />
      </div>

      <TextAreaField
        label="Ingredientes (uno por línea)"
        value={ingredients}
        onChange={setIngredients}
        hint="Formato: Ingrediente — cantidad. Ej.: Pechuga de pollo — 300 g"
      />
      <TextAreaField
        label="Pasos (uno por línea)"
        value={steps}
        onChange={setSteps}
        hint="Escribe cada paso en su propia línea, en orden."
      />
      <TextField
        label="Vídeo de YouTube (opcional)"
        value={ytUrl}
        onChange={setYtUrl}
        hint="Pega el enlace del vídeo si existe; se mostrará en el detalle."
      />
      <TextAreaField
        label="Descripción (opcional)"
        value={description}
        onChange={setDescription}
        hint="Origen de la receta, por qué merece la pena…"
      />

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar receta'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
      </div>
    </AppDialog>
  );
}

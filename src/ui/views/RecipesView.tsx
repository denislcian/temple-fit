// CAPA 3 · Interfaz — Recetas: catálogo filtrable con ingredientes, pasos y
// macros. Se integra con la nutrición ("Añadir al diario").
import { useMemo, useState } from 'react';
import type { Meal } from '../../data/nutritionModels';
import { addDiaryEntryAbsolute } from '../../data/repositories/nutritionRepo';
import { RECIPE_CATALOG } from '../../data/recipeCatalog';
import { RECIPE_PHOTO_CREDITS } from '../../data/recipePhotoCredits';
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  RECIPE_CATEGORIES,
  RECIPE_TAGS,
  TAG_LABELS,
  type Recipe,
  type RecipeCategory,
  type RecipeTag,
} from '../../data/recipeModels';
import { useAnnounce } from '../components/Announcer';
import { AppDialog } from '../components/AppDialog';
import { SelectField, TextField } from '../components/Field';
import { localDateISO } from '../utils/format';

const MAX_TIMES = [10, 15, 30];

// Fotos reales bundleadas (bancos con licencia libre / CC0). Vite las procesa y
// hashea; al ser .webp entran en el precache de la PWA, así que se ven sin
// conexión. Si una receta aún no tiene foto, la tarjeta cae a su emoji.
const RECIPE_IMAGES = import.meta.glob('../../assets/recipes/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function recipeImage(id: string): string | undefined {
  const entry = Object.entries(RECIPE_IMAGES).find(([path]) => path.endsWith(`/${id}.webp`));
  return entry?.[1];
}

/** Cada categoría de receta se registra en la comida equivalente del diario. */
function mealFor(category: RecipeCategory): Meal {
  return category === 'postre' ? 'snack' : category;
}

export function RecipesView() {
  const announce = useAnnounce();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [maxMin, setMaxMin] = useState('');
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return RECIPE_CATALOG.filter(
      (r) =>
        (!category || r.category === (category as RecipeCategory)) &&
        (!tag || r.tags.includes(tag as RecipeTag)) &&
        (!maxMin || r.minutes <= Number(maxMin)) &&
        (!q ||
          r.name.toLocaleLowerCase('es').includes(q) ||
          r.ingredients.some((i) => i.item.toLocaleLowerCase('es').includes(q))),
    );
  }, [query, category, tag, maxMin]);

  async function addToDiary(recipe: Recipe) {
    await addDiaryEntryAbsolute({
      date: localDateISO(),
      meal: mealFor(recipe.category),
      foodName: `${recipe.name} (1 ración)`,
      grams: recipe.servingG,
      macros: {
        kcal: recipe.kcal,
        proteinG: recipe.proteinG,
        carbsG: recipe.carbsG,
        fatG: recipe.fatG,
      },
    });
    setNotice(`${recipe.name} añadida a tu diario de hoy (${CATEGORY_LABELS[recipe.category]}).`);
    announce(`${recipe.name} añadida al diario`);
    setDetail(null);
  }

  return (
    <>
      <span className="kicker">Come bien, sin complicarte</span>
      <h1 id="view-title" tabIndex={-1}>
        Recetas
      </h1>

      {notice && (
        <p className="notice notice--success" role="status">
          {notice}
        </p>
      )}

      <div className="card">
        <TextField label="Buscar por nombre o ingrediente" value={query} onChange={setQuery} />
        <div className="field-row">
          <SelectField label="Momento" value={category} onChange={setCategory}>
            <option value="">Cualquiera</option>
            {RECIPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Etiqueta" value={tag} onChange={setTag}>
            <option value="">Todas</option>
            {RECIPE_TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABELS[t]}
              </option>
            ))}
          </SelectField>
        </div>
        <SelectField label="Tiempo máximo" value={maxMin} onChange={setMaxMin}>
          <option value="">Sin límite</option>
          {MAX_TIMES.map((m) => (
            <option key={m} value={m}>
              ≤ {m} min
            </option>
          ))}
        </SelectField>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {filtered.length} recetas en la lista
      </p>

      {filtered.length === 0 ? (
        <p className="muted">Ninguna receta coincide con esos filtros. Prueba a quitar alguno.</p>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => {
            const img = recipeImage(r.id);
            return (
              <button key={r.id} type="button" className="recipe-card" onClick={() => setDetail(r)}>
                <span className={`recipe-hero${img ? ' recipe-hero--photo' : ''}`} aria-hidden="true">
                  {img ? <img src={img} alt="" loading="lazy" /> : r.emoji}
                </span>
                <span className="recipe-body">
                  <span className="title">{r.name}</span>
                  <span className="meta num">
                    {CATEGORY_LABELS[r.category]} · {r.minutes} min · {r.kcal} kcal · {r.proteinG} g P
                  </span>
                  <span className="recipe-tags">
                    {r.tags.slice(0, 3).map((t) => (
                      <span key={t} className="pr-badge badge--steel">
                        {TAG_LABELS[t]}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {detail && (
        <AppDialog open title={detail.name} onClose={() => setDetail(null)}>
          <div className="recipe-detail">
            {(() => {
              const img = recipeImage(detail.id);
              return (
                <span
                  className={`recipe-hero recipe-hero--big${img ? ' recipe-hero--photo' : ''}`}
                  aria-hidden="true"
                >
                  {img ? <img src={img} alt="" /> : detail.emoji}
                </span>
              );
            })()}

            <p className="recipe-description">{detail.description}</p>

            <p className="meta-line num">
              {detail.minutes} min · {detail.servings}{' '}
              {detail.servings === 1 ? 'ración' : 'raciones'} ·{' '}
              <span className="recipe-difficulty">{DIFFICULTY_LABELS[detail.difficulty]}</span>
            </p>

            <div className="stat-grid">
              <div className="stat">
                <span className="value num">{detail.kcal}</span>
                <span className="label">kcal / ración</span>
              </div>
              <div className="stat">
                <span className="value num">{detail.proteinG} g</span>
                <span className="label">proteína</span>
              </div>
              <div className="stat">
                <span className="value num">{detail.carbsG} g</span>
                <span className="label">carbohidratos</span>
              </div>
              <div className="stat">
                <span className="value num">{detail.fatG} g</span>
                <span className="label">grasa</span>
              </div>
            </div>

            <h3>Ingredientes</h3>
            <ul className="item-list">
              {detail.ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="title">{ing.item}</span>
                  <span className="meta num">{ing.amount}</span>
                </li>
              ))}
            </ul>

            <h3>Preparación</h3>
            <ol className="recipe-steps">
              {detail.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>

            <p className="recipe-tip">
              <span className="recipe-tip__label" aria-hidden="true">
                Truco
              </span>
              <span className="visually-hidden">Truco del chef: </span>
              {detail.tip}
            </p>

            <div className="btn-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn--primary" onClick={() => addToDiary(detail)}>
                + Añadir al diario
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>

            {(() => {
              const credit = recipeImage(detail.id) ? RECIPE_PHOTO_CREDITS[detail.id] : undefined;
              if (!credit) return null;
              return (
                <p className="recipe-credit">
                  Foto: {credit.author} ·{' '}
                  <a href={credit.source} target="_blank" rel="noopener noreferrer">
                    {credit.license}
                  </a>{' '}
                  · Wikimedia Commons
                </p>
              );
            })()}
          </div>
        </AppDialog>
      )}
    </>
  );
}

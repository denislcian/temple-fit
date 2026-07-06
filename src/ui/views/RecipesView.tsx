// CAPA 3 · Interfaz — Recetas: catálogo filtrable con ingredientes, pasos y
// macros, más las recetas del usuario (propias y guardadas de la comunidad).
// Se integra con la nutrición ("Añadir al diario").
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meal } from '../../data/nutritionModels';
import { addDiaryEntryAbsolute } from '../../data/repositories/nutritionRepo';
import { getAllUserRecipes, removeUserRecipe } from '../../data/repositories/userRecipeRepo';
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
  type UserRecipe,
} from '../../data/recipeModels';
import { parseYouTubeId, youTubeEmbedUrl } from '../../domain/youtube';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
import { UtensilsIcon } from '../components/icons';
import { RecipeEditorDialog } from '../components/RecipeEditorDialog';
import { SelectField, TextField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';
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

/** ¿Es una receta del usuario (propia o guardada de la comunidad)? */
function isUserRecipe(r: Recipe): r is UserRecipe {
  return 'origin' in r;
}

export function RecipesView({ recipeId }: { recipeId?: string } = {}) {
  const announce = useAnnounce();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [maxMin, setMaxMin] = useState('');
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<UserRecipe | null>(null);
  // El vídeo de YouTube solo se carga al pulsar (privacidad: nada de terceros
  // hasta que el usuario lo pide). Se resetea al abrir otra receta.
  const [videoOn, setVideoOn] = useState(false);

  const { data: userRecipes, reload } = useAsyncData(useCallback(() => getAllUserRecipes(), []));

  // Las recetas del usuario van primero: son las suyas.
  const allRecipes = useMemo<Recipe[]>(
    () => [...(userRecipes ?? []), ...RECIPE_CATALOG],
    [userRecipes],
  );

  function openDetail(recipe: Recipe) {
    setVideoOn(false);
    setDetail(recipe);
  }

  // Enlace profundo #/recetas/<id> (p. ej. "Ver la receta completa" desde el
  // feed). Se consume una sola vez por id: al recargar la lista (crear/borrar
  // recetas) no debe volver a abrirse sola.
  const consumedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    if (!recipeId || consumedDeepLink.current === recipeId) return;
    const found = allRecipes.find((r) => r.id === recipeId);
    if (found) {
      consumedDeepLink.current = recipeId;
      setVideoOn(false);
      setDetail(found);
    }
  }, [recipeId, allRecipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return allRecipes.filter(
      (r) =>
        (!category || r.category === (category as RecipeCategory)) &&
        (!tag || r.tags.includes(tag as RecipeTag)) &&
        (!maxMin || r.minutes <= Number(maxMin)) &&
        (!q ||
          r.name.toLocaleLowerCase('es').includes(q) ||
          r.ingredients.some((i) => i.item.toLocaleLowerCase('es').includes(q))),
    );
  }, [allRecipes, query, category, tag, maxMin]);

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

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn--primary" onClick={() => setEditorOpen(true)}>
          + Crear receta
        </button>
      </div>

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
        <div className="empty-block" role="status">
          <span className="empty-block__icon" aria-hidden="true">{UtensilsIcon}</span>
          <p>Ninguna receta coincide con esos filtros. Prueba a quitar alguno.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => {
            const img = recipeImage(r.id);
            const origin = isUserRecipe(r)
              ? r.origin === 'propia'
                ? 'Tu receta'
                : `De ${r.author ?? 'la comunidad'}`
              : null;
            return (
              <button key={r.id} type="button" className="recipe-card" onClick={() => openDetail(r)}>
                <span className={`recipe-hero${img ? ' recipe-hero--photo' : ''}`} aria-hidden="true">
                  {img ? <img src={img} alt="" loading="lazy" /> : <span className="recipe-hero__ph">{UtensilsIcon}</span>}
                </span>
                <span className="recipe-body">
                  <span className="title">{r.name}</span>
                  <span className="meta num">
                    {CATEGORY_LABELS[r.category]} · {r.minutes} min · {r.kcal} kcal · {r.proteinG} g P
                  </span>
                  <span className="recipe-tags">
                    {origin && <span className="pr-badge badge--own">{origin}</span>}
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
                  {img ? <img src={img} alt="" /> : <span className="recipe-hero__ph">{UtensilsIcon}</span>}
                </span>
              );
            })()}

            <p className="recipe-description">{detail.description}</p>

            <p className="meta-line num">
              {detail.minutes} min · {detail.servings}{' '}
              {detail.servings === 1 ? 'ración' : 'raciones'} ·{' '}
              <span className="recipe-difficulty">{DIFFICULTY_LABELS[detail.difficulty]}</span>
              {isUserRecipe(detail) &&
                (detail.origin === 'propia'
                  ? ' · Tu receta'
                  : ` · Guardada de ${detail.author ?? 'la comunidad'}`)}
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

            {(() => {
              const ytId = detail.ytUrl ? parseYouTubeId(detail.ytUrl) : null;
              if (!ytId) return null;
              return videoOn ? (
                <div className="recipe-video">
                  <iframe
                    src={youTubeEmbedUrl(ytId)}
                    title={`Vídeo de la receta ${detail.name}`}
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button type="button" className="btn" onClick={() => setVideoOn(true)}>
                  Ver el vídeo (se carga desde YouTube)
                </button>
              );
            })()}

            {detail.tip && (
              <p className="recipe-tip">
                <span className="recipe-tip__label" aria-hidden="true">
                  Truco
                </span>
                <span className="visually-hidden">Truco del chef: </span>
                {detail.tip}
              </p>
            )}

            <div className="btn-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn--primary" onClick={() => addToDiary(detail)}>
                + Añadir al diario
              </button>
              {isUserRecipe(detail) && (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => setToDelete(detail)}
                >
                  Eliminar
                </button>
              )}
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

      <RecipeEditorDialog
        open={editorOpen}
        onSaved={async () => {
          await reload();
          setNotice('Receta guardada en tu lista. Puedes publicarla desde Comunidad.');
        }}
        onClose={() => setEditorOpen(false)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={`¿Eliminar la receta "${toDelete?.name ?? ''}"?`}
        description="Solo se borra de tu lista. Lo ya añadido al diario no cambia."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          if (toDelete) {
            await removeUserRecipe(toDelete.id);
            await reload();
            announce(`Receta ${toDelete.name} eliminada`);
            setDetail(null);
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

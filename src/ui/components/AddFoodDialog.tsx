// CAPA 3 · Interfaz — Añadir alimento al diario.
// Cinco caminos, de más fiable a más cómodo:
//   1. Buscar (catálogo local + tus alimentos + caché de OFF) — offline
//   2. Online: Open Food Facts por nombre o código de barras — gratis, sin key
//   3. Describir por texto o VOZ con IA (Gemini, clave del usuario)
//   4. Foto del plato o de la etiqueta nutricional con IA
//   5. Manual (crea un alimento personalizado) — siempre disponible
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FoodItem, Meal } from '../../data/nutritionModels';
import { MEAL_LABELS } from '../../data/nutritionModels';
import { getOffByBarcode, searchOffByName, type OffProduct } from '../../data/offApi';
import { loadGeminiKey } from '../../data/profile';
import {
  addDiaryEntry,
  addDiaryEntryAbsolute,
  getFoodByBarcode,
  saveFood,
  searchFoods,
} from '../../data/repositories/nutritionRepo';
import {
  analyzeFoodPhoto,
  analyzeFoodText,
  analyzeNutritionLabel,
  fileToBase64,
  type PhotoAnalysis,
} from '../../data/vision';
import { foodNutriScore } from '../../domain/nutriScore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseWeight } from '../utils/format';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';
import { TextField } from './Field';
import { NutriBadge } from './NutriBadge';

type Mode = 'buscar' | 'describir' | 'foto' | 'manual';

type Micros = Partial<Pick<FoodItem, 'sugarsG' | 'satFatG' | 'saltG' | 'fiberG'>>;

interface SelectedFood {
  name: string;
  foodId?: string;
  per100: FoodItem | (Omit<FoodItem, 'id' | 'name' | 'source'> & Micros);
}

interface AddFoodDialogProps {
  open: boolean;
  date: string;
  meal: Meal;
  onAdded: () => Promise<void>;
  onClose: () => void;
}

const GEMINI_HELP = (
  <div className="card card--accent">
    <p>
      El análisis con IA usa la API gratuita de Google Gemini con <strong>tu propia clave</strong>{' '}
      (se guarda solo en este dispositivo). Créala gratis en{' '}
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
        aistudio.google.com/apikey
      </a>{' '}
      y pégala en <a href="#/ajustes">Ajustes</a>.
    </p>
  </div>
);

export function AddFoodDialog({ open, date, meal, onAdded, onClose }: AddFoodDialogProps) {
  const announce = useAnnounce();
  const [mode, setMode] = useState<Mode>('buscar');
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodItem[]>([]);
  const [offResults, setOffResults] = useState<OffProduct[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [selected, setSelected] = useState<SelectedFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [manual, setManual] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [description, setDescription] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const labelInput = useRef<HTMLInputElement>(null);
  const geminiKey = loadGeminiKey();

  const appendTranscript = useCallback((text: string) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const speech = useSpeechRecognition(appendTranscript);

  // Búsqueda local en vivo.
  useEffect(() => {
    if (!open || mode !== 'buscar') return;
    let cancelled = false;
    searchFoods(query, 12).then((results) => {
      if (!cancelled) setLocalResults(results);
    });
    return () => {
      cancelled = true;
    };
  }, [open, mode, query]);

  const reset = useCallback(() => {
    setSelected(null);
    setOffResults(null);
    setError(null);
    setAnalysis(null);
    setGrams('100');
  }, []);

  function close() {
    reset();
    setQuery('');
    setBarcode('');
    setDescription('');
    onClose();
  }

  function switchMode(next: Mode) {
    setMode(next);
    reset();
  }

  async function searchOnline() {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const results = await searchOffByName(query);
      setOffResults(results);
      announce(`${results.length} resultados de Open Food Facts`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar online');
    } finally {
      setBusy(false);
    }
  }

  async function lookupBarcode() {
    const code = barcode.trim();
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      const cached = await getFoodByBarcode(code);
      if (cached) {
        setSelected({ name: cached.name, foodId: cached.id, per100: cached });
        return;
      }
      const product = await getOffByBarcode(code);
      if (!product) {
        setError(`No se encontró ningún producto con el código ${code}`);
        return;
      }
      await pickOffProduct(product);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar el código');
    } finally {
      setBusy(false);
    }
  }

  async function pickOffProduct(product: OffProduct) {
    // Se guardan también los micros (azúcares, grasa sat., sal, fibra) para
    // poder calcular el Nutri-Score.
    const saved = await saveFood({
      name: product.name,
      kcal: product.kcal,
      proteinG: product.proteinG,
      carbsG: product.carbsG,
      fatG: product.fatG,
      source: 'off',
      barcode: product.barcode,
      ...(product.sugarsG !== undefined ? { sugarsG: product.sugarsG } : {}),
      ...(product.satFatG !== undefined ? { satFatG: product.satFatG } : {}),
      ...(product.saltG !== undefined ? { saltG: product.saltG } : {}),
      ...(product.fiberG !== undefined ? { fiberG: product.fiberG } : {}),
    });
    setSelected({ name: saved.name, foodId: saved.id, per100: saved });
  }

  async function runAnalysis(fn: () => Promise<PhotoAnalysis>, label: string) {
    setBusy(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await fn();
      setAnalysis(result);
      announce(
        result.items.length > 0
          ? `${label}: ${result.items.length} alimentos, ${result.total.kcal} calorías estimadas`
          : 'No se reconoció comida',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al analizar');
    } finally {
      setBusy(false);
    }
  }

  async function analyzeLabel(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const label = await analyzeNutritionLabel(geminiKey, base64, mimeType);
      const saved = await saveFood({
        name: label.name,
        kcal: label.kcal,
        proteinG: label.proteinG,
        carbsG: label.carbsG,
        fatG: label.fatG,
        source: 'personalizado',
        ...(label.sugarsG !== undefined ? { sugarsG: label.sugarsG } : {}),
        ...(label.satFatG !== undefined ? { satFatG: label.satFatG } : {}),
        ...(label.saltG !== undefined ? { saltG: label.saltG } : {}),
        ...(label.fiberG !== undefined ? { fiberG: label.fiberG } : {}),
      });
      setSelected({ name: saved.name, foodId: saved.id, per100: saved });
      announce(`Etiqueta leída: ${saved.name}, ${saved.kcal} kcal por 100 g`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al leer la etiqueta');
    } finally {
      setBusy(false);
    }
  }

  async function addAnalysis() {
    if (!analysis) return;
    for (const item of analysis.items) {
      await addDiaryEntryAbsolute({
        date,
        meal,
        foodName: `${item.name} (IA)`,
        grams: item.grams,
        macros: { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG },
      });
    }
    announce(`${analysis.items.length} alimentos añadidos al ${MEAL_LABELS[meal].toLowerCase()}`);
    await onAdded();
    close();
  }

  function selectManual() {
    const kcal = parseWeight(manual.kcal);
    const protein = parseWeight(manual.protein);
    const carbs = parseWeight(manual.carbs);
    const fat = parseWeight(manual.fat);
    if (!manual.name.trim() || kcal === null || protein === null || carbs === null || fat === null) {
      setError('Completa el nombre y los cuatro valores por 100 g (puedes usar 0)');
      return;
    }
    setError(null);
    saveFood({
      name: manual.name.trim(),
      kcal,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      source: 'personalizado',
    }).then((saved) => {
      setSelected({ name: saved.name, foodId: saved.id, per100: saved });
      announce(`Alimento ${saved.name} guardado en tu biblioteca`);
    });
  }

  async function addSelected() {
    if (!selected) return;
    const g = parseWeight(grams);
    if (g === null || g <= 0) {
      setError('Indica los gramos consumidos, p. ej. 150');
      return;
    }
    await addDiaryEntry({
      date,
      meal,
      foodName: selected.name,
      ...(selected.foodId ? { foodId: selected.foodId } : {}),
      grams: g,
      per100: selected.per100,
    });
    announce(`${selected.name} añadido al ${MEAL_LABELS[meal].toLowerCase()}`);
    await onAdded();
    close();
  }

  const gramsNum = parseWeight(grams);
  const preview =
    selected && gramsNum !== null && gramsNum > 0
      ? {
          kcal: Math.round((selected.per100.kcal * gramsNum) / 100),
          p: Math.round((selected.per100.proteinG * gramsNum) / 10) / 10,
        }
      : null;
  const selectedScore = selected ? foodNutriScore(selected.per100) : null;

  function renderAnalysis() {
    if (!analysis) return null;
    return (
      <section aria-label="Resultado del análisis" style={{ marginTop: '1rem' }}>
        {analysis.description && <p className="chart-summary">{analysis.description}</p>}
        <ul className="item-list">
          {analysis.items.map((item, i) => (
            <li key={i}>
              <div>
                <span className="title">{item.name}</span>
                <br />
                <span className="meta num">
                  ~{item.grams} g · {item.kcal} kcal · P {item.proteinG} · C {item.carbsG} · G {item.fatG}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {analysis.items.length > 0 && (
          <div className="btn-row" style={{ marginTop: '0.75rem' }}>
            <p className="num" style={{ margin: 0 }}>
              <strong>Total: {analysis.total.kcal} kcal</strong> · P {analysis.total.proteinG} · C{' '}
              {analysis.total.carbsG} · G {analysis.total.fatG}
            </p>
            <button type="button" className="btn btn--primary" onClick={addAnalysis}>
              Añadir todo al diario
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <AppDialog open={open} title={`Añadir a ${MEAL_LABELS[meal].toLowerCase()}`} onClose={close}>
      <div className="btn-row" role="group" aria-label="Forma de añadir el alimento">
        {(
          [
            ['buscar', 'Buscar'],
            ['describir', 'Describir'],
            ['foto', 'Foto'],
            ['manual', 'Manual'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`btn btn--small ${mode === value ? 'btn--primary' : ''}`}
            aria-pressed={mode === value}
            onClick={() => switchMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {/* ── Modo buscar ── */}
      {mode === 'buscar' && !selected && (
        <>
          <TextField label="Buscar alimento" value={query} onChange={setQuery} hint="Catálogo en español + tus alimentos guardados" />
          <ul className="item-list">
            {localResults.map((food) => {
              const score = foodNutriScore(food);
              return (
                <li key={food.id}>
                  {score && <NutriBadge score={score} />}
                  <div style={{ flex: 1 }}>
                    <span className="title">{food.name}</span>
                    <br />
                    <span className="meta num">
                      {food.kcal} kcal · P {food.proteinG} · C {food.carbsG} · G {food.fatG} (100 g)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => setSelected({ name: food.name, foodId: food.id, per100: food })}
                  >
                    Elegir<span className="visually-hidden"> {food.name}</span>
                  </button>
                </li>
              );
            })}
            {localResults.length === 0 && <li>Nada en tu biblioteca local con ese nombre.</li>}
          </ul>

          <div className="btn-row" style={{ margin: '0.75rem 0' }}>
            <button type="button" className="btn btn--small" onClick={searchOnline} disabled={busy || !query.trim()}>
              {busy ? 'Buscando…' : 'Buscar online (Open Food Facts)'}
            </button>
          </div>

          {offResults && (
            <>
              <h3>Resultados online</h3>
              <ul className="item-list">
                {offResults.map((product) => {
                  const score = foodNutriScore(product);
                  return (
                    <li key={product.barcode}>
                      {score && <NutriBadge score={score} />}
                      <div style={{ flex: 1 }}>
                        <span className="title">{product.name}</span>
                        <br />
                        <span className="meta num">
                          {product.kcal} kcal · P {product.proteinG} · C {product.carbsG} · G {product.fatG} (100 g)
                        </span>
                      </div>
                      <button type="button" className="btn btn--small" onClick={() => pickOffProduct(product)}>
                        Elegir<span className="visually-hidden"> {product.name}</span>
                      </button>
                    </li>
                  );
                })}
                {offResults.length === 0 && <li>Sin resultados online para esa búsqueda.</li>}
              </ul>
              <p className="hint">Datos de Open Food Facts (licencia ODbL). Se guardan en tu biblioteca local.</p>
            </>
          )}

          <h3>Código de barras</h3>
          <TextField label="Código EAN del producto" mode="int" value={barcode} onChange={setBarcode} hint="Escríbelo o escanéalo con la cámara si tu navegador lo permite" />
          <div className="btn-row">
            <button type="button" className="btn btn--small" onClick={lookupBarcode} disabled={busy || !barcode.trim()}>
              Buscar código
            </button>
          </div>
        </>
      )}

      {/* ── Modo describir (texto + voz) ── */}
      {mode === 'describir' && !selected && (
        <>
          {!geminiKey ? (
            GEMINI_HELP
          ) : (
            <>
              <p className="hint">
                Escribe (o dicta) lo que comiste, p. ej. «dos huevos y una tostada con aguacate». La
                IA lo desglosa en macros. Es una estimación: revísala antes de añadir.
              </p>
              <div className="field">
                <label htmlFor="food-desc">¿Qué has comido?</label>
                <textarea
                  id="food-desc"
                  className="input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="dos huevos y una tostada con aguacate"
                />
              </div>
              <div className="btn-row">
                {speech.supported && (
                  <button
                    type="button"
                    className={`btn btn--small ${speech.listening ? 'btn--primary' : ''}`}
                    onClick={speech.toggle}
                    aria-pressed={speech.listening}
                  >
                    {speech.listening ? '● Escuchando… (toca para parar)' : '🎤 Dictar'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy || !description.trim()}
                  onClick={() => runAnalysis(() => analyzeFoodText(geminiKey, description), 'Análisis listo')}
                >
                  {busy ? 'Analizando…' : 'Analizar con IA'}
                </button>
              </div>
              {renderAnalysis()}
            </>
          )}
        </>
      )}

      {/* ── Modo foto (plato o etiqueta) ── */}
      {mode === 'foto' && !selected && (
        <>
          {!geminiKey ? (
            GEMINI_HELP
          ) : (
            <>
              <p className="hint">
                Foto del <strong>plato</strong> para estimar la comida, o foto de la{' '}
                <strong>etiqueta nutricional</strong> de un producto envasado para leer sus valores.
              </p>
              <div className="btn-row">
                <button type="button" className="btn" onClick={() => photoInput.current?.click()} disabled={busy}>
                  {busy ? 'Analizando…' : '📷 Foto del plato'}
                </button>
                <button type="button" className="btn" onClick={() => labelInput.current?.click()} disabled={busy}>
                  🏷️ Foto de la etiqueta
                </button>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="visually-hidden"
                  aria-label="Foto del plato"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) runAnalysis(() => fileToBase64(file).then(({ base64, mimeType }) => analyzeFoodPhoto(geminiKey, base64, mimeType)), 'Análisis listo');
                    e.target.value = '';
                  }}
                />
                <input
                  ref={labelInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="visually-hidden"
                  aria-label="Foto de la etiqueta nutricional"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) analyzeLabel(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {renderAnalysis()}
            </>
          )}
        </>
      )}

      {/* ── Modo manual ── */}
      {mode === 'manual' && !selected && (
        <>
          <TextField label="Nombre del alimento" value={manual.name} onChange={(name) => setManual({ ...manual, name })} required />
          <TextField label="Calorías por 100 g" mode="decimal" value={manual.kcal} onChange={(kcal) => setManual({ ...manual, kcal })} />
          <TextField label="Proteínas por 100 g" mode="decimal" value={manual.protein} onChange={(protein) => setManual({ ...manual, protein })} />
          <TextField label="Carbohidratos por 100 g" mode="decimal" value={manual.carbs} onChange={(carbs) => setManual({ ...manual, carbs })} />
          <TextField label="Grasas por 100 g" mode="decimal" value={manual.fat} onChange={(fat) => setManual({ ...manual, fat })} />
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={selectManual}>
              Guardar y elegir
            </button>
          </div>
        </>
      )}

      {/* ── Alimento elegido: gramos y confirmación ── */}
      {selected && (
        <section aria-label="Cantidad consumida" style={{ marginTop: '1rem' }}>
          <p>
            {selectedScore && <NutriBadge score={selectedScore} size="lg" />} <strong>{selected.name}</strong>{' '}
            <button type="button" className="btn btn--small btn--ghost" onClick={reset}>
              Cambiar
            </button>
          </p>
          <TextField label="Gramos consumidos" mode="decimal" value={grams} onChange={setGrams} />
          {preview && (
            <p className="chart-summary num">
              Eso son ~{preview.kcal} kcal y {preview.p} g de proteína.
            </p>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={addSelected}>
              Añadir al {MEAL_LABELS[meal].toLowerCase()}
            </button>
            <button type="button" className="btn btn--ghost" onClick={close}>
              Cancelar
            </button>
          </div>
        </section>
      )}
    </AppDialog>
  );
}

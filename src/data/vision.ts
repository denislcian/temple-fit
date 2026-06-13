// CAPA 1 · Datos — Análisis de comida con IA (Google Gemini, free tier).
// Tres entradas que comparten el mismo modelo y parser: FOTO del plato,
// DESCRIPCIÓN por texto y foto de la ETIQUETA nutricional.
// La clave de API la pone el usuario en Ajustes y se guarda SOLO en su
// dispositivo (localStorage) — nunca en el repositorio. Si no hay clave o no
// hay red, la app degrada con elegancia: búsqueda online o registro manual.
import type { MacroAmounts } from './nutritionModels';

export interface PhotoAnalysis {
  description: string;
  items: Array<{ name: string; grams: number } & MacroAmounts>;
  total: MacroAmounts;
}

/** Valores por 100 g extraídos de una etiqueta nutricional (con micros). */
export interface LabelAnalysis extends MacroAmounts {
  name: string;
  sugarsG?: number;
  satFatG?: number;
  saltG?: number;
  fiberG?: number;
}

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

/** Llama a Gemini con las partes dadas y devuelve el texto JSON de la respuesta. */
async function callGemini(apiKey: string, parts: Part[]): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('Falta la clave de API de Gemini. Añádela en Ajustes.');
  }
  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
      }),
    });
  } catch {
    throw new Error('Sin conexión: el análisis con IA necesita internet');
  }

  if (response.status === 400 || response.status === 403) {
    throw new Error('La clave de API de Gemini no es válida. Revísala en Ajustes.');
  }
  if (response.status === 429) {
    throw new Error('Has agotado la cuota gratuita de Gemini por ahora. Prueba más tarde o regístralo a mano.');
  }
  if (!response.ok) {
    throw new Error(`El servicio de análisis respondió con un error (${response.status})`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('El servicio no devolvió ningún análisis');
  return text;
}

interface GeminiItem {
  nombre?: string;
  gramos?: number;
  kcal?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

const num = (v: number | undefined, decimals = 1) => {
  const m = 10 ** decimals;
  return Math.max(0, Math.round((v ?? 0) * m) / m);
};

function parseAnalysis(raw: string): PhotoAnalysis {
  let parsed: { descripcion?: string; alimentos?: GeminiItem[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('No se pudo interpretar la respuesta del análisis');
  }

  const items = (parsed.alimentos ?? [])
    .filter((i) => typeof i.nombre === 'string' && typeof i.kcal === 'number')
    .map((i) => ({
      name: i.nombre!,
      grams: Math.max(0, Math.round(i.gramos ?? 0)),
      kcal: num(i.kcal, 0),
      proteinG: num(i.proteinas),
      carbsG: num(i.carbohidratos),
      fatG: num(i.grasas),
    }));

  return {
    description: parsed.descripcion ?? '',
    items,
    total: {
      kcal: items.reduce((a, i) => a + i.kcal, 0),
      proteinG: num(items.reduce((a, i) => a + i.proteinG, 0)),
      carbsG: num(items.reduce((a, i) => a + i.carbsG, 0)),
      fatG: num(items.reduce((a, i) => a + i.fatG, 0)),
    },
  };
}

const ITEMS_SHAPE = `{"descripcion":"resumen en una frase","alimentos":[{"nombre":"...","gramos":0,"kcal":0,"proteinas":0,"carbohidratos":0,"grasas":0}]}
Los macros de cada alimento son TOTALES para los gramos estimados (no por 100 g). Usa nombres en español.`;

/** Analiza la FOTO de un plato y estima alimentos, gramos y macros. */
export async function analyzeFoodPhoto(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<PhotoAnalysis> {
  const text = await callGemini(apiKey, [
    {
      text: `Eres un nutricionista. Analiza la foto de comida. Responde SOLO con JSON válido: ${ITEMS_SHAPE}
Si la imagen no contiene comida, devuelve {"descripcion":"No se reconoce comida en la imagen","alimentos":[]}.`,
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ]);
  return parseAnalysis(text);
}

/** Analiza una DESCRIPCIÓN por texto ("dos huevos y una tostada con aguacate"). */
export async function analyzeFoodText(apiKey: string, description: string): Promise<PhotoAnalysis> {
  const text = await callGemini(apiKey, [
    {
      text: `Eres un nutricionista. El usuario describe lo que ha comido. Estima los alimentos y sus macros. Responde SOLO con JSON válido: ${ITEMS_SHAPE}
Si no se describe comida, devuelve {"descripcion":"No se reconoce comida","alimentos":[]}.

Descripción del usuario: "${description.replace(/"/g, "'")}"`,
    },
  ]);
  return parseAnalysis(text);
}

/** Analiza la foto de una ETIQUETA nutricional y extrae los valores por 100 g. */
export async function analyzeNutritionLabel(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<LabelAnalysis> {
  const raw = await callGemini(apiKey, [
    {
      text: `Eres un asistente que lee etiquetas nutricionales. Extrae los valores POR 100 g (o por 100 ml). Responde SOLO con JSON válido:
{"nombre":"nombre del producto si se ve, o ''","kcal":0,"proteinas":0,"carbohidratos":0,"azucares":0,"grasas":0,"saturadas":0,"sal":0,"fibra":0}
Todos los valores por 100 g. Si un valor no aparece en la etiqueta, ponlo a 0. Si la imagen no es una etiqueta nutricional, devuelve {"nombre":"","kcal":0,"proteinas":0,"carbohidratos":0,"azucares":0,"grasas":0,"saturadas":0,"sal":0,"fibra":0}.`,
    },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ]);

  let p: Record<string, unknown>;
  try {
    p = JSON.parse(raw);
  } catch {
    throw new Error('No se pudo leer la etiqueta');
  }
  const n = (k: string, d = 1) => num(typeof p[k] === 'number' ? (p[k] as number) : 0, d);
  return {
    name: typeof p.nombre === 'string' && p.nombre ? p.nombre : 'Producto (etiqueta)',
    kcal: n('kcal', 0),
    proteinG: n('proteinas'),
    carbsG: n('carbohidratos'),
    fatG: n('grasas'),
    sugarsG: n('azucares'),
    satFatG: n('saturadas'),
    saltG: n('sal', 2),
    fiberG: n('fibra'),
  };
}

/** Convierte un File de un input a base64 (sin el prefijo data:). */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(',') + 1);
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

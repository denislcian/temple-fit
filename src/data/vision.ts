// CAPA 1 · Datos — Escáner de macros por foto (Google Gemini, free tier).
// La clave de API la pone el usuario en Ajustes y se guarda SOLO en su
// dispositivo (localStorage) — nunca en el repositorio. Si no hay clave o no
// hay red, la app degrada con elegancia: búsqueda online o registro manual.
import type { MacroAmounts } from './nutritionModels';

export interface PhotoAnalysis {
  description: string;
  items: Array<{ name: string; grams: number } & MacroAmounts>;
  total: MacroAmounts;
}

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Eres un nutricionista. Analiza la foto de comida y estima los alimentos visibles con sus gramos y macros. Responde SOLO con JSON válido con esta forma exacta:
{"descripcion":"resumen del plato en una frase","alimentos":[{"nombre":"...","gramos":0,"kcal":0,"proteinas":0,"carbohidratos":0,"grasas":0}]}
Los macros de cada alimento son TOTALES para los gramos estimados (no por 100 g). Usa nombres en español. Si la imagen no contiene comida, devuelve {"descripcion":"No se reconoce comida en la imagen","alimentos":[]}.`;

interface GeminiItem {
  nombre?: string;
  gramos?: number;
  kcal?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

export async function analyzeFoodPhoto(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<PhotoAnalysis> {
  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
      }),
    });
  } catch {
    throw new Error('Sin conexión: el análisis por foto necesita internet');
  }

  if (response.status === 400 || response.status === 403) {
    throw new Error('La clave de API de Gemini no es válida. Revísala en Ajustes.');
  }
  if (response.status === 429) {
    throw new Error('Has agotado la cuota gratuita de Gemini por ahora. Prueba más tarde o registra el alimento a mano.');
  }
  if (!response.ok) {
    throw new Error(`El servicio de análisis respondió con un error (${response.status})`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('El servicio no devolvió ningún análisis');

  let parsed: { descripcion?: string; alimentos?: GeminiItem[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('No se pudo interpretar la respuesta del análisis');
  }

  const items = (parsed.alimentos ?? [])
    .filter((i) => typeof i.nombre === 'string' && typeof i.kcal === 'number')
    .map((i) => ({
      name: i.nombre!,
      grams: Math.max(0, Math.round(i.gramos ?? 0)),
      kcal: Math.max(0, Math.round(i.kcal ?? 0)),
      proteinG: Math.max(0, Math.round((i.proteinas ?? 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((i.carbohidratos ?? 0) * 10) / 10),
      fatG: Math.max(0, Math.round((i.grasas ?? 0) * 10) / 10),
    }));

  return {
    description: parsed.descripcion ?? '',
    items,
    total: {
      kcal: items.reduce((a, i) => a + i.kcal, 0),
      proteinG: Math.round(items.reduce((a, i) => a + i.proteinG, 0) * 10) / 10,
      carbsG: Math.round(items.reduce((a, i) => a + i.carbsG, 0) * 10) / 10,
      fatG: Math.round(items.reduce((a, i) => a + i.fatG, 0) * 10) / 10,
    },
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

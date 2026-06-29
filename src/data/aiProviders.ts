// CAPA 1 · Datos — Proveedores de IA gratis para el coach (texto).
// Todos se llaman DIRECTAMENTE desde el navegador con la clave del usuario
// (verificado: permiten CORS). La clave vive solo en el dispositivo. El escáner
// de comida (vision.ts) sigue en Gemini porque necesita imágenes.
// Fuente de proveedores/límites: github.com/cheahjs/free-llm-api-resources.

import { ON_DEVICE_MODEL } from './onDeviceLLM';

export type AIProviderId = 'ondevice' | 'gemini' | 'groq' | 'openrouter' | 'cerebras';

export interface AIProvider {
  id: AIProviderId;
  label: string;
  /** Modelo gratuito por defecto (pueden cambiar; revisar si fallan). */
  model: string;
  /** Dónde sacar una clave gratis. */
  keyUrl: string;
  /** Privacidad: 'alta' = no entrena con tus datos. */
  privacy: 'alta' | 'media';
  /** Nota corta de límites/privacidad para la UI. */
  note: string;
}

export const AI_PROVIDERS: Record<AIProviderId, AIProvider> = {
  ondevice: {
    id: 'ondevice',
    label: 'En tu dispositivo (sin clave)',
    model: ON_DEVICE_MODEL,
    keyUrl: '',
    privacy: 'alta',
    note: 'Sin clave ni cuenta: el modelo corre dentro de tu móvil/PC. Descarga única (~1,6 GB) y luego funciona offline. Nada sale del dispositivo. Necesita un navegador moderno (WebGPU).',
  },
  groq: {
    id: 'groq',
    label: 'Groq (recomendado)',
    model: 'llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    privacy: 'alta',
    note: 'Rápido y generoso (miles de consultas/día). No entrena con tus datos. Clave gratis sin tarjeta.',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    keyUrl: 'https://openrouter.ai/keys',
    privacy: 'alta',
    note: 'No entrena con tus datos y permite desactivar retención. ~50 consultas/día gratis.',
  },
  cerebras: {
    id: 'cerebras',
    label: 'Cerebras',
    model: 'llama-3.3-70b',
    keyUrl: 'https://cloud.cerebras.ai/',
    privacy: 'alta',
    note: 'Muy rápido, límites amplios. No entrena con tus datos. Clave gratis.',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    model: 'gemini-2.5-flash',
    keyUrl: 'https://aistudio.google.com/apikey',
    privacy: 'media',
    note: 'Es la que usa el escáner de comida. Fuera de la UE/UK puede usar tus textos para entrenar.',
  },
};

export const AI_PROVIDER_IDS: AIProviderId[] = [
  'ondevice',
  'groq',
  'openrouter',
  'cerebras',
  'gemini',
];

interface CallOptions {
  temperature?: number;
  /** Pide JSON (Gemini lo fuerza; en los demás se pide por prompt). */
  json?: boolean;
}

function mapError(status: number): string {
  if (status === 401 || status === 403) return 'La clave de API no es válida. Revísala en Ajustes.';
  if (status === 429) return 'Has agotado la cuota gratuita por ahora. El coach básico sigue disponible.';
  return `El servicio de IA respondió con un error (${status}).`;
}

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

type RemoteOpenAIProvider = 'groq' | 'openrouter' | 'cerebras';

const OPENAI_ENDPOINT: Record<RemoteOpenAIProvider, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
};

/** Llama al proveedor elegido con un prompt de texto y devuelve la respuesta. */
export async function callLLM(
  providerId: AIProviderId,
  apiKey: string,
  prompt: string,
  opts: CallOptions = {},
): Promise<string> {
  if (!apiKey.trim()) throw new Error('Falta la clave de API. Añádela en Ajustes.');
  const provider = AI_PROVIDERS[providerId];

  if (providerId === 'gemini') {
    let res: Response;
    try {
      res = await fetch(`${GEMINI_ENDPOINT(provider.model)}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: opts.temperature ?? 0.4,
            ...(opts.json ? { response_mime_type: 'application/json' } : {}),
          },
        }),
      });
    } catch {
      throw new Error('Sin conexión: el coach con IA necesita internet.');
    }
    if (!res.ok) throw new Error(mapError(res.status));
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('El servicio de IA no devolvió respuesta.');
    return text;
  }

  if (providerId === 'ondevice') {
    // La IA local se ejecuta con WebLLM (onDeviceLLM.ts), no por aquí.
    throw new Error('La IA en el dispositivo se ejecuta en local, no por la red.');
  }

  // OpenAI-compatible (Groq, OpenRouter, Cerebras).
  let res: Response;
  try {
    res = await fetch(OPENAI_ENDPOINT[providerId], {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter pide identificar la app (opcional pero recomendado).
        ...(providerId === 'openrouter'
          ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'TMPL' }
          : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: opts.temperature ?? 0.4,
      }),
    });
  } catch {
    throw new Error('Sin conexión: el coach con IA necesita internet.');
  }
  if (!res.ok) throw new Error(mapError(res.status));
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('El servicio de IA no devolvió respuesta.');
  return text;
}

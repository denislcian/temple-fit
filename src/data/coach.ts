// CAPA 1 · Datos — Coach con IA (Google Gemini, free tier). OPCIONAL.
// Reusa el patrón de vision.ts: la clave la pone el usuario en Ajustes y vive
// solo en su dispositivo. Si no hay clave o no hay red, la app usa el coach
// determinista (coachRules) — esta capa solo REDACTA, nunca decide los números.
// Solo se envían datos AGREGADOS (RPE medio, sueño medio…), nunca la sesión cruda.
import { buildCoachPrompt, type CoachAIPayload } from '../domain/coach/coachPrompts';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface CoachMessage {
  mensaje: string;
  foco?: string;
}

/** Genera el mensaje cercano del coach a partir del análisis determinista. */
export async function generateCoachMessage(
  apiKey: string,
  payload: CoachAIPayload,
): Promise<CoachMessage> {
  if (!apiKey.trim()) {
    throw new Error('Falta la clave de API de Gemini. Añádela en Ajustes.');
  }

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildCoachPrompt(payload) }] }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.4 },
      }),
    });
  } catch {
    throw new Error('Sin conexión: el coach con IA necesita internet (puedes usar el coach básico).');
  }

  if (response.status === 400 || response.status === 403) {
    throw new Error('La clave de API de Gemini no es válida. Revísala en Ajustes.');
  }
  if (response.status === 429) {
    throw new Error('Has agotado la cuota gratuita de Gemini por ahora. El coach básico sigue disponible.');
  }
  if (!response.ok) {
    throw new Error(`El coach con IA respondió con un error (${response.status}).`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('El coach con IA no devolvió respuesta.');

  let parsed: { mensaje?: unknown; foco?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    // Si no vino como JSON, usa el texto plano como mensaje.
    return { mensaje: text.trim() };
  }
  const mensaje = typeof parsed.mensaje === 'string' ? parsed.mensaje.trim() : '';
  if (!mensaje) throw new Error('El coach con IA no devolvió un mensaje válido.');
  return {
    mensaje,
    ...(typeof parsed.foco === 'string' && parsed.foco.trim() ? { foco: parsed.foco.trim() } : {}),
  };
}

// CAPA 1 · Datos — Coach con IA (OPCIONAL, multi-proveedor gratuito).
// Usa el proveedor elegido por el usuario (Groq, OpenRouter, Cerebras o Gemini)
// con su propia clave, que vive solo en el dispositivo. Esta capa solo REDACTA;
// el motor determinista (coachRules) decide los números. Solo envía datos
// AGREGADOS. Si no hay clave/red/cuota, la app usa el coach básico.
import { buildCoachPrompt, type CoachAIPayload } from '../domain/coach/coachPrompts';
import { callLLM, type AIProviderId } from './aiProviders';

export interface CoachMessage {
  mensaje: string;
  foco?: string;
}

/** Extrae el JSON aunque venga envuelto en ```json ... ``` (común en LLMs). */
function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1]! : text).trim();
}

/** Genera el mensaje cercano del coach con el proveedor de IA elegido. */
export async function generateCoachMessage(
  provider: AIProviderId,
  apiKey: string,
  payload: CoachAIPayload,
): Promise<CoachMessage> {
  const raw = await callLLM(provider, apiKey, buildCoachPrompt(payload), {
    json: true,
    temperature: 0.4,
  });

  let parsed: { mensaje?: unknown; foco?: unknown };
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return { mensaje: raw.trim() };
  }
  const mensaje = typeof parsed.mensaje === 'string' ? parsed.mensaje.trim() : '';
  if (!mensaje) return { mensaje: raw.trim() };
  return {
    mensaje,
    ...(typeof parsed.foco === 'string' && parsed.foco.trim() ? { foco: parsed.foco.trim() } : {}),
  };
}

// Edge Function (Deno) — Proxy del consejo del coach redactado por IA.
//
// El cliente envía el payload ANCLADO (agregados + recomendaciones con citas,
// construido por src/domain/coach/coachPrompt.ts). Esta función:
//   1. Verifica el JWT de Supabase Auth (solo usuarios con sesión).
//   2. Aplica cuota diaria por usuario (tabla coach_ai_usage, vía RPC).
//   3. Valida el shape del payload (esto NO es un LLM de propósito general).
//   4. Llama a Groq con la clave del DUEÑO (secreto del servidor, nunca en el cliente).
//   5. Devuelve el texto crudo; el CLIENTE lo valida con validateAdvice (dominio).
//
// Secretos necesarios (supabase secrets set):
//   GROQ_API_KEY  — clave de console.groq.com (el tier gratuito no entrena con datos).
// Opcional: GROQ_MODEL (por defecto llama-3.3-70b-versatile).
//
// La instrucción del redactor se controla AQUÍ (servidor), espejo de
// ADVICE_INSTRUCTION en src/domain/coach/coachPrompt.ts.
import { createClient } from 'npm:@supabase/supabase-js@2';

const DAILY_LIMIT = 10;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const INSTRUCTION = `Eres el redactor del coach de una app de entrenamiento de fuerza. Las decisiones YA están tomadas por un motor de reglas con citas científicas; tú solo redactas.
PROHIBIDO: inventar o modificar números (kilos, series, %, repeticiones, horas), añadir consejos o ejercicios nuevos, mencionar estudios/autores/años que no estén en el campo "fuente", dar consejo médico, usar emojis o exclamaciones.
OBLIGATORIO: usa únicamente cifras que aparezcan en el JSON; si citas una fuente, cópiala EXACTAMENTE como llega en "fuente"; trata la primera recomendación como la prioridad del día; español de tú, tono sobrio y directo; 60-90 palabras.
Responde SOLO con JSON válido: {"foco":"3-5 palabras","mensaje":"el consejo"}`;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Shape mínimo del payload anclado (rechaza cualquier otro uso del proxy). */
function isValidPayload(p: unknown): boolean {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  const veredicto = o.veredicto as Record<string, unknown> | undefined;
  const contexto = o.contexto as Record<string, unknown> | undefined;
  const pauta = o.pauta as Record<string, unknown> | undefined;
  const recs = o.recomendaciones;
  if (!veredicto || !contexto || !pauta || !Array.isArray(recs)) return false;
  if (typeof veredicto.titulo !== 'string' || veredicto.titulo.length > 80) return false;
  if (typeof o.objetivo !== 'string' || (o.objetivo as string).length > 20) return false;
  if (recs.length === 0 || recs.length > 6) return false;
  for (const r of recs) {
    const rec = r as Record<string, unknown>;
    if (typeof rec.titulo !== 'string' || rec.titulo.length > 120) return false;
    if (typeof rec.detalle !== 'string' || rec.detalle.length > 400) return false;
    if (rec.fuente !== undefined && (typeof rec.fuente !== 'string' || rec.fuente.length > 200)) {
      return false;
    }
  }
  // Cinturón extra: el payload serializado completo, acotado.
  return JSON.stringify(p).length <= 4000;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  // 1) Usuario autenticado (el JWT viaja en Authorization).
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json(401, { error: 'auth' });

  // 2) Cuota diaria por usuario (RPC security definer; ver migration-coach-ia.sql).
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: usage, error: usageError } = await admin.rpc('coach_ai_increment', {
    p_user_id: user.id,
  });
  if (usageError) return json(500, { error: 'quota-check' });
  if (typeof usage === 'number' && usage > DAILY_LIMIT) {
    return json(429, { error: 'quota', limit: DAILY_LIMIT });
  }

  // 3) Payload anclado y acotado.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'body' });
  }
  if (!isValidPayload(payload)) return json(400, { error: 'payload' });

  // 4) Groq con la clave del dueño.
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return json(503, { error: 'no-key' });
  const model = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INSTRUCTION },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!groqRes.ok) {
    return json(groqRes.status === 429 ? 429 : 502, { error: 'llm', status: groqRes.status });
  }
  const groqBody = await groqRes.json();
  const raw: unknown = groqBody?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) return json(502, { error: 'llm-empty' });

  // 5) El cliente valida con validateAdvice (dominio) antes de mostrar nada.
  return json(200, { raw });
});

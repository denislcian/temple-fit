// CAPA 1 · Datos — Perfil local del usuario.
// Identidad y datos corporales para los objetivos nutricionales y la firma
// de las publicaciones. Vive en localStorage: nada sale del dispositivo.
// Cuando llegue la fase Supabase (roadmap v2), este módulo será la
// implementación local detrás de la misma interfaz.
import type { BodyProfile } from '../domain/nutritionTargets';
import type { AIProviderId } from './aiProviders';

export interface UserProfile extends BodyProfile {
  /** Nombre para mostrar en la comunidad. */
  displayName: string;
}

const STORAGE_KEY = 'forjafit-profile';

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (
      typeof parsed.displayName !== 'string' ||
      typeof parsed.weightKg !== 'number' ||
      typeof parsed.heightCm !== 'number' ||
      typeof parsed.age !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Marca de que el usuario ya vio la bienvenida (no volver a mostrarla). */
const ONBOARDED_KEY = 'forjafit-onboarded';

export function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

/** Objetivo de peso: peso meta + ritmo deseado (kg/semana). Solo local. */
export interface WeightGoal {
  targetKg: number;
  weeklyRateKg: number;
}

const WEIGHT_GOAL_KEY = 'forjafit-weight-goal';

export function loadWeightGoal(): WeightGoal | null {
  try {
    const raw = localStorage.getItem(WEIGHT_GOAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeightGoal;
    if (typeof parsed.targetKg !== 'number' || typeof parsed.weeklyRateKg !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWeightGoal(goal: WeightGoal): void {
  localStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(goal));
}

/** Clave de API de Gemini para el escáner por foto (opcional, solo local). */
const GEMINI_KEY = 'forjafit-gemini-key';

export function loadGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY) ?? '';
}

export function saveGeminiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(GEMINI_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY);
  }
}

// ── Coach con IA: proveedor + claves (todo opcional, solo local) ────────────
const COACH_PROVIDER_KEY = 'forjafit-coach-provider';

export function loadCoachProvider(): AIProviderId {
  const v = localStorage.getItem(COACH_PROVIDER_KEY);
  if (v === 'ondevice' || v === 'groq' || v === 'openrouter' || v === 'cerebras' || v === 'gemini') {
    return v;
  }
  // Por defecto: IA integrada en el dispositivo (sin clave). El usuario puede
  // cambiar a una clave en la nube si prefiere no descargar el modelo.
  return 'ondevice';
}

export function saveCoachProvider(id: AIProviderId): void {
  localStorage.setItem(COACH_PROVIDER_KEY, id);
}

/** Clave de un proveedor. 'ondevice' no usa clave; Gemini reutiliza la del escáner. */
export function loadAIKey(provider: AIProviderId): string {
  if (provider === 'ondevice') return '';
  if (provider === 'gemini') return loadGeminiKey();
  return localStorage.getItem(`forjafit-ai-key-${provider}`) ?? '';
}

export function saveAIKey(provider: AIProviderId, key: string): void {
  if (provider === 'ondevice') return;
  if (provider === 'gemini') {
    saveGeminiKey(key);
    return;
  }
  const storageKey = `forjafit-ai-key-${provider}`;
  if (key.trim()) localStorage.setItem(storageKey, key.trim());
  else localStorage.removeItem(storageKey);
}

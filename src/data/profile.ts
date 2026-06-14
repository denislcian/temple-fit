// CAPA 1 · Datos — Perfil local del usuario.
// Identidad y datos corporales para los objetivos nutricionales y la firma
// de las publicaciones. Vive en localStorage: nada sale del dispositivo.
// Cuando llegue la fase Supabase (roadmap v2), este módulo será la
// implementación local detrás de la misma interfaz.
import type { BodyProfile } from '../domain/nutritionTargets';

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

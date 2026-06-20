// CAPA 3 · Interfaz — Borrador de entrenamiento en curso.
// El borrador vive en localStorage para sobrevivir a cierres de la app a mitad
// de sesión. Se extrae aquí (fuera de TrainView) para poder crearlo desde otras
// vistas — p. ej. "Repetir" una sesión del historial.
import type { Session, SetType } from '../data/models';

export const DRAFT_KEY = 'forjafit-draft';

export interface DraftSet {
  reps: string;
  weight: string;
  done: boolean;
  type?: SetType;
  rpe?: number;
}

export interface DraftEntry {
  exerciseId: string;
  sets: DraftSet[];
  note?: string;
}

export interface Draft {
  startedAt: string;
  routineId?: string;
  entries: DraftEntry[];
  /** Nota libre de toda la sesión (cómo te sentiste, contexto…). */
  notes?: string;
}

export const EMPTY_SET: DraftSet = { reps: '', weight: '', done: false };

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft | null): void {
  if (draft === null) {
    localStorage.removeItem(DRAFT_KEY);
  } else {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
}

export function hasActiveDraft(): boolean {
  return localStorage.getItem(DRAFT_KEY) !== null;
}

/** Número a cadena editable en español (coma decimal). */
function numToInput(value: number): string {
  return String(value).replace('.', ',');
}

/**
 * Construye un borrador nuevo a partir de una sesión pasada, para "repetirla":
 * copia ejercicios, repeticiones, pesos, tipo de serie y notas; reinicia el
 * estado "completada" (vas a volver a hacerla) y descarta el RPE (es de cada día).
 */
export function draftFromSession(session: Session, startedAtISO: string): Draft {
  return {
    startedAt: startedAtISO,
    ...(session.routineId ? { routineId: session.routineId } : {}),
    entries: session.entries.map((entry) => ({
      exerciseId: entry.exerciseId,
      ...(entry.note ? { note: entry.note } : {}),
      sets: entry.sets.map((s) => ({
        reps: String(s.reps),
        weight: numToInput(s.weightKg),
        done: false,
        ...(s.type ? { type: s.type } : {}),
      })),
    })),
  };
}

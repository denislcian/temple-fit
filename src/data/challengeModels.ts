// CAPA 1 · Datos — Retos de la comunidad (opt-in).
// Un reto es un objetivo con fecha (p. ej. "entrena 4 días esta semana").
// El PROGRESO de cada participante se calcula EN EL DISPOSITIVO a partir de sus
// sesiones locales; solo el número resultante sube a la nube al apuntarse.

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  /** Meta: nº de días entrenando dentro de la ventana del reto. */
  goalDays: number;
  /** Inicio y fin de la ventana (ISO). */
  startsAt: string;
  endsAt: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface ChallengeMember {
  challengeId: string;
  userId: string;
  name: string;
  /** Días entrenados en la ventana (progreso). Calculado on-device. */
  progress: number;
  joinedAt: string;
}

export interface NewChallenge {
  title: string;
  description?: string;
  goalDays: number;
  /** Duración en días (por defecto 7). */
  durationDays?: number;
  creatorId: string;
  creatorName: string;
}

// CAPA 2 · Dominio — "Hoy": qué toca entrenar y la frase del día.
// Puro y determinista: mismo día + mismos datos = misma sugerencia y misma
// frase (nada de aleatoriedad que cambie al re-renderizar).
import type { Routine, Session } from '../data/models';

export interface TodaySuggestion {
  kind: 'rutina' | 'entrenado' | 'sin-rutinas';
  routine?: Routine;
  /** Texto humano: por qué se sugiere esto. */
  reason: string;
}

/**
 * Sugerencia del día: rota por tus rutinas en orden, siguiendo a la última que
 * usaste. Si ya entrenaste hoy, te lo reconoce; si no tienes rutinas, te manda
 * al coach a pedir la primera.
 */
export function suggestToday(
  routines: Routine[],
  sessions: Session[],
  todayISO: string,
): TodaySuggestion {
  const today = todayISO.slice(0, 10);
  const trainedToday = sessions.some((s) => s.date.slice(0, 10) === today);
  if (trainedToday) {
    return {
      kind: 'entrenado',
      reason: 'Ya has entrenado hoy. Ahora toca la otra mitad del trabajo: comer y descansar.',
    };
  }
  if (routines.length === 0) {
    return {
      kind: 'sin-rutinas',
      reason: 'Aún no tienes rutinas. Pídele la primera al coach y te la monta al momento.',
    };
  }

  // Última sesión que partió de una rutina que sigue existiendo.
  const byId = new Map(routines.map((r, i) => [r.id, i]));
  const lastWithRoutine = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((s) => s.routineId && byId.has(s.routineId));

  if (!lastWithRoutine) {
    return {
      kind: 'rutina',
      routine: routines[0]!,
      reason: 'Estrena tu plan: empieza por la primera.',
    };
  }

  const lastIndex = byId.get(lastWithRoutine.routineId!)!;
  const next = routines[(lastIndex + 1) % routines.length]!;
  const daysAgo = Math.max(
    0,
    Math.round(
      (new Date(today).getTime() - new Date(lastWithRoutine.date.slice(0, 10)).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  const when = daysAgo === 0 ? 'hoy' : daysAgo === 1 ? 'ayer' : `hace ${daysAgo} días`;
  const lastName = routines[lastIndex]!.name;
  return {
    kind: 'rutina',
    routine: next,
    reason: `La última vez (${when}) hiciste ${lastName}.`,
  };
}

/** Frases del día: sobrias, propias, sin humo. Rotan de forma determinista. */
const LINES = [
  'La constancia le gana al talento cuando el talento no entrena.',
  'No hace falta querer: hace falta ir. Las ganas llegan calentando.',
  'El progreso no se nota en un día, pero se construye en uno.',
  'Serie a serie. Lo demás es ruido.',
  'Hoy compites contra el de la semana pasada, no contra nadie más.',
  'El descanso también entrena: recupera con la misma disciplina.',
  'Un entrenamiento mediocre gana a un entrenamiento saltado.',
  'La técnica primero. El peso llega solo.',
  'Lo difícil no es empezar: es volver. Y hoy has vuelto.',
  'Tu cuerpo registra cada sesión, aunque el espejo tarde en enseñarlo.',
  'Pequeños pesos bien movidos construyen grandes marcas.',
  'La disciplina es elegir lo que quieres MÁS sobre lo que quieres ahora.',
  'Nadie se arrepiente de haber entrenado.',
  'El plan perfecto es el que cumples.',
  'Cada repetición cuenta una historia: que no te la cuenten.',
  'Fuerte es el que sigue cuando la motivación se va.',
  'Entrena caro, descansa caro, come caro: tu cuerpo es la inversión.',
  'Hoy es un buen día para una buena serie.',
  'El músculo crece fuera del gimnasio; gánatelo dentro.',
  'No cuentes los días: haz que los días cuenten kilos.',
  'La báscula mide masa; el hierro mide voluntad.',
];

/** Frase motivadora del día (estable durante el día, cambia cada día). */
export function motivationalLine(todayISO: string): string {
  const d = new Date(todayISO.slice(0, 10));
  const dayNumber = Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
  return LINES[dayNumber % LINES.length]!;
}

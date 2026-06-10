// CAPA 2 · Dominio — Generador de planes de entrenamiento según objetivos.
// Algoritmo determinista basado en reglas de programación clásicas:
// selección de patrones de movimiento (empuje/tirón/rodilla/cadera/core)
// sobre el catálogo disponible según el material del usuario.
import type { Equipment, Exercise } from '../data/models';

export type Goal = 'fuerza' | 'hipertrofia' | 'definicion';
export type Level = 'principiante' | 'intermedio';
export type EquipmentProfile = 'gimnasio' | 'mancuernas' | 'casa';

export interface GeneratorOptions {
  goal: Goal;
  daysPerWeek: 2 | 3 | 4 | 5;
  equipment: EquipmentProfile;
  level: Level;
}

export interface GeneratedDay {
  name: string;
  exerciseIds: string[];
  /** Esquema de trabajo del día (series × reps y descanso). */
  notes: string;
}

export interface GeneratedPlan {
  title: string;
  days: GeneratedDay[];
  /** Explicación del plan y pauta de progresión, en lenguaje claro. */
  summary: string;
}

export const GOAL_LABELS: Record<Goal, string> = {
  fuerza: 'Fuerza',
  hipertrofia: 'Hipertrofia',
  definicion: 'Definición',
};

const EQUIPMENT_PROFILES: Record<EquipmentProfile, readonly Equipment[]> = {
  gimnasio: [
    'barra',
    'mancuernas',
    'máquina',
    'polea',
    'peso corporal',
    'kettlebell',
    'banda elástica',
    'otro',
  ],
  mancuernas: ['mancuernas', 'peso corporal', 'kettlebell', 'banda elástica', 'otro'],
  casa: ['peso corporal', 'banda elástica', 'otro'],
};

interface Scheme {
  sets: string;
  reps: string;
  rest: string;
  progression: string;
}

const SCHEMES: Record<Goal, Record<Level, Scheme>> = {
  fuerza: {
    principiante: {
      sets: '3',
      reps: '5',
      rest: '2-3 min',
      progression: 'Sube ~2,5 kg cuando completes todas las series con buena técnica.',
    },
    intermedio: {
      sets: '4',
      reps: '4-6',
      rest: '2-3 min',
      progression: 'Sube el peso cuando hagas 6 repeticiones en todas las series.',
    },
  },
  hipertrofia: {
    principiante: {
      sets: '3',
      reps: '8-12',
      rest: '60-90 s',
      progression: 'Cuando llegues a 12 repeticiones en todas las series, sube el peso ~5%.',
    },
    intermedio: {
      sets: '4',
      reps: '8-12',
      rest: '60-90 s',
      progression: 'Cuando llegues a 12 repeticiones en todas las series, sube el peso ~5%.',
    },
  },
  definicion: {
    principiante: {
      sets: '3',
      reps: '12-15',
      rest: '45-60 s',
      progression: 'Mantén los descansos cortos; añade 1-2 repeticiones por semana.',
    },
    intermedio: {
      sets: '3',
      reps: '12-20',
      rest: '45-60 s',
      progression: 'Mantén los descansos cortos; añade repeticiones antes que peso.',
    },
  },
};

// Patrones de movimiento: candidatos ordenados por prioridad.
// Para principiantes se priorizan variantes más fáciles de aprender.
type Pattern =
  | 'empujeHorizontal'
  | 'empujeVertical'
  | 'tironVertical'
  | 'tironHorizontal'
  | 'rodilla'
  | 'cadera'
  | 'femoral'
  | 'hombroLateral'
  | 'hombroPosterior'
  | 'biceps'
  | 'triceps'
  | 'pecho2'
  | 'gemelo'
  | 'core';

const PATTERNS: Record<Pattern, { intermedio: string[]; principiante: string[] }> = {
  empujeHorizontal: {
    intermedio: ['press-banca', 'press-mancuernas', 'press-pecho-maquina', 'flexiones'],
    principiante: ['press-pecho-maquina', 'press-mancuernas', 'press-banca', 'flexiones'],
  },
  empujeVertical: {
    intermedio: ['press-militar', 'press-hombro-mancuernas'],
    principiante: ['press-hombro-mancuernas', 'press-militar'],
  },
  tironVertical: {
    intermedio: ['dominadas', 'jalon-al-pecho'],
    principiante: ['jalon-al-pecho', 'dominadas'],
  },
  tironHorizontal: {
    intermedio: ['remo-barra', 'remo-polea-baja', 'remo-mancuerna', 'remo-renegado'],
    principiante: ['remo-polea-baja', 'remo-mancuerna', 'remo-barra', 'remo-renegado'],
  },
  rodilla: {
    intermedio: ['sentadilla', 'sentadilla-frontal', 'prensa-piernas', 'sentadilla-goblet', 'zancadas'],
    principiante: ['sentadilla-goblet', 'prensa-piernas', 'sentadilla', 'zancadas'],
  },
  cadera: {
    intermedio: ['peso-muerto', 'peso-muerto-rumano', 'hip-thrust', 'kettlebell-swing', 'puente-gluteo'],
    principiante: ['hip-thrust', 'peso-muerto-rumano', 'puente-gluteo', 'kettlebell-swing', 'peso-muerto'],
  },
  femoral: {
    intermedio: ['curl-femoral', 'peso-muerto-rumano', 'puente-gluteo'],
    principiante: ['curl-femoral', 'puente-gluteo', 'peso-muerto-rumano'],
  },
  hombroLateral: {
    intermedio: ['elevaciones-laterales', 'elevaciones-frontales'],
    principiante: ['elevaciones-laterales', 'elevaciones-frontales'],
  },
  hombroPosterior: {
    intermedio: ['face-pull', 'pajaros'],
    principiante: ['pajaros', 'face-pull'],
  },
  biceps: {
    intermedio: ['curl-barra', 'curl-mancuernas', 'curl-polea', 'curl-martillo', 'curl-scott'],
    principiante: ['curl-mancuernas', 'curl-polea', 'curl-barra', 'curl-martillo'],
  },
  triceps: {
    intermedio: ['extension-triceps-polea', 'press-frances', 'fondos-paralelas', 'press-cerrado', 'patada-triceps'],
    principiante: ['extension-triceps-polea', 'patada-triceps', 'press-frances', 'fondos-paralelas'],
  },
  pecho2: {
    intermedio: ['press-banca-inclinado', 'aperturas-mancuernas', 'cruce-poleas', 'flexiones'],
    principiante: ['aperturas-mancuernas', 'cruce-poleas', 'flexiones', 'press-banca-inclinado'],
  },
  gemelo: {
    intermedio: ['elevacion-gemelos'],
    principiante: ['elevacion-gemelos'],
  },
  core: {
    intermedio: ['rueda-abdominal', 'plancha', 'elevaciones-piernas', 'plancha-lateral', 'giro-ruso', 'crunch'],
    principiante: ['plancha', 'crunch', 'puente-gluteo', 'plancha-lateral', 'elevaciones-piernas'],
  },
};

// Estructura de cada día por tipo de sesión (patrones en orden).
const DAY_TEMPLATES: Record<string, Pattern[]> = {
  'Cuerpo completo A': ['rodilla', 'empujeHorizontal', 'tironHorizontal', 'cadera', 'core'],
  'Cuerpo completo B': ['cadera', 'empujeVertical', 'tironVertical', 'rodilla', 'core'],
  'Cuerpo completo C': ['rodilla', 'empujeHorizontal', 'tironVertical', 'hombroLateral', 'core'],
  Empuje: ['empujeHorizontal', 'empujeVertical', 'pecho2', 'hombroLateral', 'triceps'],
  Tirón: ['tironVertical', 'tironHorizontal', 'hombroPosterior', 'biceps', 'core'],
  Pierna: ['rodilla', 'cadera', 'femoral', 'gemelo', 'core'],
  'Torso A': ['empujeHorizontal', 'tironHorizontal', 'empujeVertical', 'biceps', 'triceps'],
  'Torso B': ['tironVertical', 'pecho2', 'hombroLateral', 'hombroPosterior', 'biceps'],
  'Pierna A': ['rodilla', 'cadera', 'femoral', 'gemelo', 'core'],
  'Pierna B': ['cadera', 'rodilla', 'femoral', 'gemelo', 'core'],
};

const SPLITS: Record<GeneratorOptions['daysPerWeek'], string[]> = {
  2: ['Cuerpo completo A', 'Cuerpo completo B'],
  3: ['Cuerpo completo A', 'Cuerpo completo B', 'Cuerpo completo C'],
  4: ['Torso A', 'Pierna A', 'Torso B', 'Pierna B'],
  5: ['Empuje', 'Tirón', 'Pierna', 'Torso A', 'Pierna B'],
};

/**
 * Genera un plan semanal de entrenamiento a partir del catálogo disponible.
 * Determinista: mismas opciones + mismo catálogo = mismo plan (testeable).
 */
export function generatePlan(options: GeneratorOptions, exercises: Exercise[]): GeneratedPlan {
  const allowed = new Set(EQUIPMENT_PROFILES[options.equipment]);
  const available = new Map(
    exercises.filter((e) => allowed.has(e.equipment)).map((e) => [e.id, e]),
  );
  const byGroup = new Map<string, Exercise[]>();
  for (const e of available.values()) {
    const list = byGroup.get(e.muscleGroup) ?? [];
    list.push(e);
    byGroup.set(e.muscleGroup, list);
  }

  const scheme = SCHEMES[options.goal][options.level];
  const maxExercises = options.level === 'principiante' ? 5 : 6;

  let previousDay = new Set<string>();
  const days: GeneratedDay[] = SPLITS[options.daysPerWeek].map((templateName, dayIndex) => {
    const patterns = DAY_TEMPLATES[templateName] ?? [];
    const used = new Set<string>();
    const exerciseIds: string[] = [];

    for (const pattern of patterns.slice(0, maxExercises)) {
      const candidates = PATTERNS[pattern][options.level];
      // Variedad entre días: se prefiere un candidato que no se usara en el
      // día anterior; si no hay alternativa con este material, se permite.
      let picked = candidates.find(
        (id) => available.has(id) && !used.has(id) && !previousDay.has(id),
      );
      picked ??= candidates.find((id) => available.has(id) && !used.has(id));
      if (!picked) {
        // Sin candidato directo con este material: cualquier ejercicio
        // disponible del grupo muscular más afín al patrón.
        const fallbackGroup = FALLBACK_GROUP[pattern];
        const pool = byGroup.get(fallbackGroup) ?? [];
        picked = (
          pool.find((e) => !used.has(e.id) && !previousDay.has(e.id)) ??
          pool.find((e) => !used.has(e.id))
        )?.id;
      }
      if (picked) {
        used.add(picked);
        exerciseIds.push(picked);
      }
    }

    previousDay = used;
    return {
      name: `Día ${dayIndex + 1} · ${templateName}`,
      exerciseIds,
      notes: `${scheme.sets} series × ${scheme.reps} repeticiones · descansa ${scheme.rest}`,
    };
  });

  const goalLabel = GOAL_LABELS[options.goal];
  const summary =
    `Plan de ${goalLabel.toLowerCase()} de ${options.daysPerWeek} días por semana ` +
    `(nivel ${options.level}, material: ${options.equipment}). ` +
    `Trabaja ${scheme.sets} series de ${scheme.reps} repeticiones por ejercicio, ` +
    `descansando ${scheme.rest} entre series. Progresión: ${scheme.progression}` +
    (options.goal === 'definicion'
      ? ' Combínalo con 2-3 sesiones suaves de cardio y un déficit calórico moderado.'
      : '');

  return { title: `${goalLabel} · ${options.daysPerWeek} días`, days, summary };
}

const FALLBACK_GROUP: Record<Pattern, string> = {
  empujeHorizontal: 'pecho',
  empujeVertical: 'hombros',
  tironVertical: 'espalda',
  tironHorizontal: 'espalda',
  rodilla: 'pierna',
  cadera: 'glúteo',
  femoral: 'pierna',
  hombroLateral: 'hombros',
  hombroPosterior: 'hombros',
  biceps: 'bíceps',
  triceps: 'tríceps',
  pecho2: 'pecho',
  gemelo: 'pierna',
  core: 'core',
};

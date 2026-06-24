// CAPA 2 · Dominio — Programas de entrenamiento conocidos como DATOS PROPIOS.
//
// Las rutinas (qué ejercicios, en qué orden, con qué esquema de series) son
// procedimientos funcionales no protegibles por copyright (US Copyright Office):
// se pueden codificar como datos. Aquí van con descripciones redactadas en
// español desde cero y CITANDO la metodología/autor original. NO se copia su
// texto. Los ejercicios referencian el catálogo propio de la app.
import type { Goal, Level } from '../routineGenerator';

export interface ProgramDay {
  nombre: string;
  /** ids del catálogo + esquema de trabajo. */
  ejercicios: Array<{ exerciseId: string; esquema: string }>;
}

export interface Program {
  id: string;
  nombre: string;
  /** Cita de la metodología original (no se copia su contenido). */
  metodologia: string;
  nivel: Level;
  objetivo: Goal;
  diasPorSemana: number;
  descripcion: string;
  progresion: string;
  dias: ProgramDay[];
}

export const PROGRAMS: Program[] = [
  {
    id: 'bbr',
    nombre: 'Rutina básica de principiante',
    metodologia: 'Inspirada en la Basic Beginner Routine de r/Fitness',
    nivel: 'principiante',
    objetivo: 'fuerza',
    diasPorSemana: 3,
    descripcion:
      'Cuerpo completo 3 días por semana con los básicos. Ideal para empezar: técnica y progresión lineal sobre pocos ejercicios.',
    progresion: 'Sube ~2,5 kg cada sesión que completes todas las series; si fallas 2 veces, baja 10% y vuelve a subir.',
    dias: [
      {
        nombre: 'Día A',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: '3×5' },
          { exerciseId: 'press-banca', esquema: '3×5' },
          { exerciseId: 'remo-barra', esquema: '3×5' },
        ],
      },
      {
        nombre: 'Día B',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: '3×5' },
          { exerciseId: 'press-militar', esquema: '3×5' },
          { exerciseId: 'peso-muerto', esquema: '1×5' },
        ],
      },
    ],
  },
  {
    id: 'sl5x5',
    nombre: 'Fuerza 5×5',
    metodologia: 'Inspirada en la metodología StrongLifts 5×5',
    nivel: 'principiante',
    objetivo: 'fuerza',
    diasPorSemana: 3,
    descripcion:
      'Dos sesiones que alternas (A/B) con 5 series de 5 en los grandes básicos. Progresión lineal muy simple y efectiva para fuerza inicial.',
    progresion: 'Sube 2,5 kg cada vez que completes 5×5. Peso muerto solo 1×5.',
    dias: [
      {
        nombre: 'Entreno A',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: '5×5' },
          { exerciseId: 'press-banca', esquema: '5×5' },
          { exerciseId: 'remo-barra', esquema: '5×5' },
        ],
      },
      {
        nombre: 'Entreno B',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: '5×5' },
          { exerciseId: 'press-militar', esquema: '5×5' },
          { exerciseId: 'peso-muerto', esquema: '1×5' },
        ],
      },
    ],
  },
  {
    id: 'ppl',
    nombre: 'Empuje / Tirón / Pierna',
    metodologia: 'Estructura clásica Push/Pull/Legs (PPL), de uso libre',
    nivel: 'intermedio',
    objetivo: 'hipertrofia',
    diasPorSemana: 6,
    descripcion:
      'Divide la semana en empuje (pecho/hombro/tríceps), tirón (espalda/bíceps) y pierna. Permite alto volumen por músculo con frecuencia 2x si lo haces 6 días.',
    progresion: 'Doble progresión: sube las reps dentro del rango (6-12) y, al llegar al techo en todas las series, sube la carga.',
    dias: [
      {
        nombre: 'Empuje',
        ejercicios: [
          { exerciseId: 'press-banca', esquema: '4×6-10' },
          { exerciseId: 'press-militar', esquema: '3×8-12' },
          { exerciseId: 'elevaciones-laterales', esquema: '3×12-15' },
          { exerciseId: 'extension-triceps-polea', esquema: '3×10-15' },
        ],
      },
      {
        nombre: 'Tirón',
        ejercicios: [
          { exerciseId: 'dominadas', esquema: '4×6-10' },
          { exerciseId: 'remo-barra', esquema: '4×8-12' },
          { exerciseId: 'face-pull', esquema: '3×12-15' },
          { exerciseId: 'curl-mancuernas', esquema: '3×10-15' },
        ],
      },
      {
        nombre: 'Pierna',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: '4×6-10' },
          { exerciseId: 'peso-muerto-rumano', esquema: '3×8-12' },
          { exerciseId: 'prensa-piernas', esquema: '3×10-15' },
          { exerciseId: 'elevacion-gemelos', esquema: '4×12-20' },
        ],
      },
    ],
  },
  {
    id: 'gzclp',
    nombre: 'GZCLP (progresión por niveles)',
    metodologia: 'Inspirada en el método GZCL de Cody Lefever (GZCLP)',
    nivel: 'intermedio',
    objetivo: 'fuerza',
    diasPorSemana: 4,
    descripcion:
      'Tres niveles por sesión: un básico pesado (T1), un secundario a más reps (T2) y accesorios (T3). Buena transición de principiante a intermedio.',
    progresion: 'T1 baja de 5×3 a 6×2 a 10×1 antes de subir peso; T2 progresa en series de 10; T3 acumula reps.',
    dias: [
      {
        nombre: 'Día 1',
        ejercicios: [
          { exerciseId: 'sentadilla', esquema: 'T1 5×3+' },
          { exerciseId: 'press-banca', esquema: 'T2 3×10' },
          { exerciseId: 'jalon-al-pecho', esquema: 'T3 3×15' },
        ],
      },
      {
        nombre: 'Día 2',
        ejercicios: [
          { exerciseId: 'press-militar', esquema: 'T1 5×3+' },
          { exerciseId: 'peso-muerto', esquema: 'T2 3×10' },
          { exerciseId: 'remo-mancuerna', esquema: 'T3 3×15' },
        ],
      },
    ],
  },
];

/** Sugiere el programa que mejor encaja con objetivo, nivel y días disponibles. */
export function suggestProgram(goal: Goal, level: Level, daysPerWeek: number): Program {
  const scored = PROGRAMS.map((p) => {
    let score = 0;
    if (p.objetivo === goal) score += 3;
    if (p.nivel === level) score += 2;
    score -= Math.abs(p.diasPorSemana - daysPerWeek);
    return { p, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]!.p;
}

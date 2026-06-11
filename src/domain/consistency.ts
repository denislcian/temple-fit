// CAPA 2 · Dominio — Constancia y logros.
// Rachas, calendario de entrenamiento y sistema de insignias. TODO se
// deriva de los datos reales (sesiones, récords, diario): no hay nada que
// almacenar ni que pueda desincronizarse.
import type { Session } from '../data/models';
import type { DiaryEntry, Post } from '../data/nutritionModels';
import { computeRecords } from './records';
import { totals } from './stats';
import { weekStartOf } from './volume';

export interface StreakInfo {
  /** Semanas seguidas entrenando (incluida la actual si ya entrenaste). */
  currentWeeks: number;
  bestWeeks: number;
}

/** Racha semanal: semanas consecutivas con al menos una sesión. */
export function weeklyStreak(sessions: Session[], todayISO: string): StreakInfo {
  if (sessions.length === 0) return { currentWeeks: 0, bestWeeks: 0 };

  const weeks = [...new Set(sessions.map((s) => weekStartOf(s.date)))].sort();

  // Mejor racha histórica.
  let best = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i++) {
    run = nextWeek(weeks[i - 1]!) === weeks[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }

  // Racha actual: cuenta hacia atrás desde esta semana (o la pasada, para
  // no romper la racha un lunes por la mañana sin haber entrenado aún).
  const thisWeek = weekStartOf(`${todayISO}T12:00:00.000Z`);
  const weekSet = new Set(weeks);
  let cursor = weekSet.has(thisWeek) ? thisWeek : previousWeek(thisWeek);
  let current = 0;
  while (weekSet.has(cursor)) {
    current++;
    cursor = previousWeek(cursor);
  }

  return { currentWeeks: current, bestWeeks: Math.max(best, current) };
}

function shiftWeek(weekStart: string, days: number): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  return date.toISOString().slice(0, 10);
}

const nextWeek = (w: string) => shiftWeek(w, 7);
const previousWeek = (w: string) => shiftWeek(w, -7);

export interface CalendarDay {
  date: string;
  sessions: number;
}

/** Días de las últimas `weeks` semanas con su número de sesiones
 *  (para el heatmap de constancia). Termina en la semana de `todayISO`. */
export function trainingCalendar(sessions: Session[], todayISO: string, weeks = 12): CalendarDay[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const day = s.date.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const lastMonday = weekStartOf(`${todayISO}T12:00:00.000Z`);
  const firstDay = shiftWeek(lastMonday, -7 * (weeks - 1));
  const days: CalendarDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = shiftWeek(firstDay, i);
    days.push({ date, sessions: counts.get(date) ?? 0 });
  }
  return days;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  /** Progreso legible cuando aún no se ha conseguido ("3 de 10"). */
  progress?: string;
}

export interface AchievementInput {
  sessions: Session[];
  diary: DiaryEntry[];
  posts: Post[];
  todayISO: string;
}

/** Insignias derivadas de los datos. Sin trampas: o lo has hecho o no. */
export function achievements(input: AchievementInput): Achievement[] {
  const { sessions, diary, posts, todayISO } = input;
  const t = totals(sessions);
  const records = computeRecords(sessions);
  const streak = weeklyStreak(sessions, todayISO);
  const diaryDays = new Set(diary.map((d) => d.date)).size;
  const ownPosts = posts.filter((p) => !p.isDemo).length;

  const tiered = (
    id: string,
    title: string,
    value: number,
    target: number,
    unit: string,
  ): Achievement => ({
    id,
    title,
    description: `${target.toLocaleString('es-ES')} ${unit}`,
    achieved: value >= target,
    ...(value < target
      ? { progress: `${Math.min(value, target).toLocaleString('es-ES')} de ${target.toLocaleString('es-ES')}` }
      : {}),
  });

  return [
    tiered('s1', 'Primer golpe de forja', t.sessions, 1, 'entrenamiento completado'),
    tiered('s10', 'Costumbre de hierro', t.sessions, 10, 'entrenamientos'),
    tiered('s50', 'Medio centenar', t.sessions, 50, 'entrenamientos'),
    tiered('s100', 'Forjado a fuego', t.sessions, 100, 'entrenamientos'),
    tiered('v10k', 'Diez toneladas', Math.round(t.volumeKg), 10_000, 'kg de volumen acumulado'),
    tiered('v100k', 'Cien toneladas', Math.round(t.volumeKg), 100_000, 'kg de volumen acumulado'),
    {
      id: 'pr1',
      title: 'Cazador de récords',
      description: 'Récord personal en 5 ejercicios distintos',
      achieved: records.size >= 5,
      ...(records.size < 5 ? { progress: `${records.size} de 5` } : {}),
    },
    tiered('w4', 'Un mes sin fallar', streak.bestWeeks, 4, 'semanas seguidas entrenando'),
    tiered('w12', 'Un trimestre de constancia', streak.bestWeeks, 12, 'semanas seguidas entrenando'),
    tiered('n7', 'Cocina de precisión', diaryDays, 7, 'días con el diario de nutrición'),
    tiered('n30', 'Nutrición bajo control', diaryDays, 30, 'días con el diario de nutrición'),
    tiered('c1', 'Voz en la comunidad', ownPosts, 1, 'publicación compartida'),
  ];
}

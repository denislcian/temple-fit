import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { achievements, trainingCalendar, weeklyStreak } from './consistency';

function session(date: string): Session {
  return {
    id: date,
    date: `${date}T10:00:00.000Z`,
    entries: [{ exerciseId: 'sentadilla', sets: [{ reps: 5, weightKg: 80, done: true }] }],
  };
}

// El 2026-06-10 es miércoles; su semana empieza el lunes 2026-06-08.
const TODAY = '2026-06-10';

describe('weeklyStreak', () => {
  it('cuenta semanas consecutivas con al menos una sesión', () => {
    const streak = weeklyStreak(
      [session('2026-06-09'), session('2026-06-01'), session('2026-05-26')],
      TODAY,
    );
    expect(streak.currentWeeks).toBe(3);
    expect(streak.bestWeeks).toBe(3);
  });

  it('no rompe la racha si esta semana aún no has entrenado', () => {
    const streak = weeklyStreak([session('2026-06-03'), session('2026-05-28')], TODAY);
    expect(streak.currentWeeks).toBe(2);
  });

  it('una semana en blanco corta la racha actual pero conserva la mejor', () => {
    const streak = weeklyStreak(
      [
        session('2026-06-09'), // esta semana
        // semana del 1 de junio en blanco
        session('2026-05-27'),
        session('2026-05-20'),
        session('2026-05-13'),
      ],
      TODAY,
    );
    expect(streak.currentWeeks).toBe(1);
    expect(streak.bestWeeks).toBe(3);
  });

  it('sin sesiones, todo a cero', () => {
    expect(weeklyStreak([], TODAY)).toEqual({ currentWeeks: 0, bestWeeks: 0 });
  });
});

describe('trainingCalendar', () => {
  it('devuelve semanas completas terminando en la semana actual', () => {
    const days = trainingCalendar([session('2026-06-09')], TODAY, 4);
    expect(days).toHaveLength(28);
    expect(days[0]?.date).toBe('2026-05-18'); // lunes de hace 3 semanas
    expect(days[days.length - 1]?.date).toBe('2026-06-14'); // domingo de esta semana
    expect(days.find((d) => d.date === '2026-06-09')?.sessions).toBe(1);
  });
});

describe('achievements', () => {
  it('concede la primera insignia con una sesión y muestra progreso del resto', () => {
    const result = achievements({
      sessions: [session('2026-06-09')],
      diary: [],
      posts: [],
      todayISO: TODAY,
    });
    const first = result.find((a) => a.id === 's1');
    expect(first?.achieved).toBe(true);
    const ten = result.find((a) => a.id === 's10');
    expect(ten?.achieved).toBe(false);
    expect(ten?.progress).toBe('1 de 10');
  });

  it('las publicaciones demo no cuentan para la insignia de comunidad', () => {
    const base = { sessions: [], diary: [], todayISO: TODAY };
    const withDemo = achievements({
      ...base,
      posts: [{ id: 'p', author: 'X', createdAt: '', text: '', kind: 'texto', likes: 0, likedByMe: false, comments: [], isDemo: true }],
    });
    expect(withDemo.find((a) => a.id === 'c1')?.achieved).toBe(false);

    const withOwn = achievements({
      ...base,
      posts: [{ id: 'p', author: 'Denis', createdAt: '', text: 'hola', kind: 'texto', likes: 0, likedByMe: false, comments: [] }],
    });
    expect(withOwn.find((a) => a.id === 'c1')?.achieved).toBe(true);
  });

  it('el volumen acumulado desbloquea las insignias de tonelaje', () => {
    const sessions: Session[] = Array.from({ length: 25 }, (_, i) =>
      session(`2026-0${1 + Math.floor(i / 9)}-${String((i % 9) + 1).padStart(2, '0')}`),
    ).map((s) => ({
      ...s,
      entries: [{ exerciseId: 'peso-muerto', sets: [{ reps: 10, weightKg: 50, done: true }] }],
    }));
    // 25 sesiones × 500 kg = 12.500 kg
    const result = achievements({ sessions, diary: [], posts: [], todayISO: TODAY });
    expect(result.find((a) => a.id === 'v10k')?.achieved).toBe(true);
    expect(result.find((a) => a.id === 'v100k')?.achieved).toBe(false);
  });
});

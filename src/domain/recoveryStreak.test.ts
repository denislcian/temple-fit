import { describe, expect, it } from 'vitest';
import { recoveryStreak } from './recoveryStreak';

const TODAY = '2026-06-24';

describe('recoveryStreak', () => {
  it('sin días → todo a cero', () => {
    expect(recoveryStreak([], TODAY)).toEqual({ current: 0, best: 0, total: 0 });
  });

  it('cuenta la racha actual terminando hoy', () => {
    const r = recoveryStreak(['2026-06-22', '2026-06-23', '2026-06-24'], TODAY);
    expect(r.current).toBe(3);
    expect(r.best).toBe(3);
    expect(r.total).toBe(3);
  });

  it('la racha sigue viva si el último día fue ayer', () => {
    expect(recoveryStreak(['2026-06-22', '2026-06-23'], TODAY).current).toBe(2);
  });

  it('la racha se rompe si el último día fue hace 2+ días', () => {
    expect(recoveryStreak(['2026-06-20', '2026-06-21'], TODAY).current).toBe(0);
  });

  it('ignora duplicados y acepta fechas con hora', () => {
    const r = recoveryStreak(['2026-06-24T22:00:00Z', '2026-06-24T08:00:00Z'], TODAY);
    expect(r.total).toBe(1);
    expect(r.current).toBe(1);
  });

  it('best recoge la racha más larga aunque no sea la actual', () => {
    const r = recoveryStreak(
      ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-23', '2026-06-24'],
      TODAY,
    );
    expect(r.best).toBe(4);
    expect(r.current).toBe(2);
  });
});

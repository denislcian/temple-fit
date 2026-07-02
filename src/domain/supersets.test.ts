import { describe, expect, it } from 'vitest';
import { cleanupSupersets, supersetLetters, toggleSupersetWithPrevious } from './supersets';

type E = { id: string; supersetGroup?: number };
const e = (id: string, supersetGroup?: number): E =>
  supersetGroup === undefined ? { id } : { id, supersetGroup };

describe('superseries: enlazar/desenlazar', () => {
  it('enlaza dos ejercicios sueltos creando un grupo nuevo', () => {
    const out = toggleSupersetWithPrevious([e('a'), e('b')], 1);
    expect(out[0]!.supersetGroup).toBeDefined();
    expect(out[0]!.supersetGroup).toBe(out[1]!.supersetGroup);
  });

  it('añade un tercero al grupo existente del anterior', () => {
    const out = toggleSupersetWithPrevious([e('a', 1), e('b', 1), e('c')], 2);
    expect(out.map((x) => x.supersetGroup)).toEqual([1, 1, 1]);
  });

  it('desenlaza si ya comparten grupo, y disuelve el grupo si queda solo uno', () => {
    const out = toggleSupersetWithPrevious([e('a', 1), e('b', 1)], 1);
    expect(out[0]!.supersetGroup).toBeUndefined();
    expect(out[1]!.supersetGroup).toBeUndefined();
  });

  it('desenlazar de un trío conserva el grupo de los otros dos', () => {
    const out = toggleSupersetWithPrevious([e('a', 1), e('b', 1), e('c', 1)], 2);
    expect(out.map((x) => x.supersetGroup)).toEqual([1, 1, undefined]);
  });

  it('con el primer ejercicio no hace nada (no hay anterior)', () => {
    const entries = [e('a'), e('b')];
    expect(toggleSupersetWithPrevious(entries, 0)).toBe(entries);
  });

  it('el grupo nuevo no colisiona con los existentes', () => {
    const out = toggleSupersetWithPrevious([e('a', 3), e('b', 3), e('c'), e('d')], 3);
    expect(out[2]!.supersetGroup).toBeDefined();
    expect(out[2]!.supersetGroup).not.toBe(3);
    expect(out[2]!.supersetGroup).toBe(out[3]!.supersetGroup);
  });
});

describe('superseries: limpieza y letras', () => {
  it('cleanupSupersets disuelve grupos con un solo miembro', () => {
    const out = cleanupSupersets([e('a', 1), e('b', 2), e('c', 2)]);
    expect(out.map((x) => x.supersetGroup)).toEqual([undefined, 2, 2]);
  });

  it('supersetLetters asigna A, B… por orden de aparición y null a los sueltos', () => {
    const letters = supersetLetters([e('a', 7), e('b', 7), e('c'), e('d', 2), e('e', 2)]);
    expect(letters).toEqual(['A', 'A', null, 'B', 'B']);
  });
});

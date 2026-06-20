import { beforeEach, describe, expect, it } from 'vitest';
import { loadFavorites, saveFavorites, sortByFavorite, toggleFavorite } from './favorites';

describe('favorites', () => {
  beforeEach(() => localStorage.clear());

  it('alterna un favorito de forma inmutable y persistente', () => {
    const empty = new Set<string>();
    const withA = toggleFavorite(empty, 'press-banca');
    expect(empty.has('press-banca')).toBe(false); // no muta el original
    expect(withA.has('press-banca')).toBe(true);
    expect(loadFavorites().has('press-banca')).toBe(true); // persistido

    const without = toggleFavorite(withA, 'press-banca');
    expect(without.has('press-banca')).toBe(false);
    expect(loadFavorites().has('press-banca')).toBe(false);
  });

  it('carga vacío y guarda/recupera el conjunto', () => {
    expect(loadFavorites().size).toBe(0);
    saveFavorites(new Set(['a', 'b']));
    expect([...loadFavorites()].sort()).toEqual(['a', 'b']);
  });

  it('ordena los favoritos primero preservando el resto', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const sorted = sortByFavorite(items, new Set(['c']));
    expect(sorted.map((i) => i.id)).toEqual(['c', 'a', 'b', 'd']);
  });
});

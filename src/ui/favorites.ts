// CAPA 3 · Interfaz — Ejercicios favoritos (preferencia local del dispositivo).
// Se guardan como una lista de ids en localStorage; no son datos sincronizables,
// solo una comodidad para encontrar antes tus movimientos habituales.
const KEY = 'forjafit-favorites';

export function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveFavorites(favorites: Set<string>): void {
  localStorage.setItem(KEY, JSON.stringify([...favorites]));
}

/** Devuelve un nuevo Set con el id alternado (inmutable, para React state). */
export function toggleFavorite(favorites: Set<string>, id: string): Set<string> {
  const next = new Set(favorites);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  saveFavorites(next);
  return next;
}

/** Ordena ejercicios poniendo los favoritos primero, preservando el resto. */
export function sortByFavorite<T extends { id: string }>(items: T[], favorites: Set<string>): T[] {
  return [...items].sort(
    (a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)),
  );
}

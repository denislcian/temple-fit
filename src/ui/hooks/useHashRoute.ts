// CAPA 3 · Interfaz — Mini-router por hash.
// Decisión de diseño (ver README): un router por hash de ~40 líneas evita el
// problema de los 404 en hosting estático (GitHub Pages), funciona con el
// botón "atrás" y permite enlaces profundos, sin añadir dependencias.
import { useCallback, useEffect, useState } from 'react';

export const ROUTES = [
  'entrenar',
  'nutricion',
  'social',
  'progreso',
  'historial',
  'rutinas',
  'ejercicios',
  'ajustes',
  'mas',
] as const;

export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, string> = {
  entrenar: 'Entrenar',
  nutricion: 'Nutrición',
  social: 'Comunidad',
  progreso: 'Progreso',
  historial: 'Historial',
  rutinas: 'Rutinas',
  ejercicios: 'Ejercicios',
  ajustes: 'Ajustes',
  mas: 'Más',
};

/** Pestañas principales (siempre visibles). */
export const PRIMARY_ROUTES: readonly Route[] = ['entrenar', 'nutricion', 'social', 'progreso'];
/** Solo en la cabecera de escritorio; en móvil viven dentro de "Más". */
export const SECONDARY_ROUTES: readonly Route[] = ['historial', 'rutinas', 'ejercicios', 'ajustes'];

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(raw) ? (raw as Route) : 'entrenar';
}

export function useHashRoute(): { route: Route; navigate: (to: Route) => void } {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((to: Route) => {
    window.location.hash = `/${to}`;
  }, []);

  return { route, navigate };
}

// CAPA 3 · Interfaz — Mini-router por hash.
// Decisión de diseño (ver README): un router por hash de ~40 líneas evita el
// problema de los 404 en hosting estático (GitHub Pages), funciona con el
// botón "atrás" y permite enlaces profundos, sin añadir dependencias.
import { useCallback, useEffect, useState } from 'react';

export const ROUTES = [
  'entrenar',
  'historial',
  'rutinas',
  'ejercicios',
  'progreso',
  'ajustes',
] as const;

export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, string> = {
  entrenar: 'Entrenar',
  historial: 'Historial',
  rutinas: 'Rutinas',
  ejercicios: 'Ejercicios',
  progreso: 'Progreso',
  ajustes: 'Ajustes',
};

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

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
  'coach',
  'historial',
  'rutinas',
  'ejercicios',
  'herramientas',
  'descanso',
  'recetas',
  'ajustes',
  'perfil',
  'mas',
] as const;

export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, string> = {
  entrenar: 'Entrenar',
  nutricion: 'Nutrición',
  social: 'Comunidad',
  progreso: 'Progreso',
  coach: 'Coach',
  historial: 'Historial',
  rutinas: 'Rutinas',
  ejercicios: 'Ejercicios',
  herramientas: 'Herramientas',
  descanso: 'Descanso',
  recetas: 'Recetas',
  ajustes: 'Ajustes',
  perfil: 'Perfil',
  mas: 'Más',
};

/** Pestañas principales (siempre visibles). */
export const PRIMARY_ROUTES: readonly Route[] = ['entrenar', 'nutricion', 'social', 'progreso'];
/** Solo en la cabecera de escritorio; en móvil viven dentro de "Más". */
export const SECONDARY_ROUTES: readonly Route[] = [
  'coach',
  'historial',
  'rutinas',
  'ejercicios',
  'herramientas',
  'descanso',
  'recetas',
  'ajustes',
];

/** Parsea el hash en ruta + parámetro opcional (p. ej. #/perfil/<id>). */
function parseHash(): { route: Route; param: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const slash = raw.indexOf('/');
  const first = slash === -1 ? raw : raw.slice(0, slash);
  const param = slash === -1 ? '' : decodeURIComponent(raw.slice(slash + 1));
  return {
    route: (ROUTES as readonly string[]).includes(first) ? (first as Route) : 'entrenar',
    param,
  };
}

export function useHashRoute(): {
  route: Route;
  param: string;
  navigate: (to: Route, param?: string) => void;
} {
  const [state, setState] = useState(parseHash);

  useEffect(() => {
    const onHashChange = () => setState(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((to: Route, param?: string) => {
    window.location.hash = param ? `/${to}/${encodeURIComponent(param)}` : `/${to}`;
  }, []);

  return { route: state.route, param: state.param, navigate };
}

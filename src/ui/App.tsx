// CAPA 3 · Interfaz — Armazón de la aplicación.
// Gestión de foco en SPA: al cambiar de vista, el foco se mueve al <h1>
// (tabindex=-1) y una región viva anuncia la navegación; sin esto, el cambio
// de ruta es silencioso para un lector de pantalla.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo-black/400.css';
import { requestPersistentStorage } from '../data/db';
import { ensureSeeded } from '../data/seed';
import { AnnouncerProvider, useAnnounce } from './components/Announcer';
import { ROUTE_LABELS, ROUTES, useHashRoute, type Route } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { ExercisesView } from './views/ExercisesView';
import { HistoryView } from './views/HistoryView';
import { RoutinesView } from './views/RoutinesView';
import { SettingsView } from './views/SettingsView';
import { TrainView } from './views/TrainView';

// Recharts solo se descarga si el usuario entra en Progreso (code splitting).
const ProgressView = lazy(() => import('./views/ProgressView'));

const ICONS: Record<Route, ReactNode> = {
  entrenar: (
    // Mancuerna
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" strokeLinecap="round" />
    </svg>
  ),
  historial: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  ),
  rutinas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 6h14M5 12h14M5 18h9" strokeLinecap="round" />
      <circle cx="3.2" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  ejercicios: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  ),
  progreso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 20V4M4 20h16" strokeLinecap="round" />
      <path d="m7 14 4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ajustes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" strokeLinecap="round" />
    </svg>
  ),
};

function AppShell() {
  const { route } = useHashRoute();
  const { theme, setTheme } = useTheme();
  const announce = useAnnounce();
  const [ready, setReady] = useState(false);
  const prevRoute = useRef<Route | null>(null);

  // Primer arranque: sembrar el catálogo y pedir almacenamiento persistente.
  useEffect(() => {
    ensureSeeded().then(() => {
      setReady(true);
      requestPersistentStorage();
    });
  }, []);

  // Gestión de foco al navegar (no en la carga inicial). Se compara con la
  // ruta anterior en lugar de usar un flag: así sobrevive al doble efecto
  // de StrictMode en desarrollo.
  useEffect(() => {
    if (prevRoute.current !== null && prevRoute.current !== route) {
      requestAnimationFrame(() => {
        document.getElementById('view-title')?.focus();
      });
      announce(`Navegado a ${ROUTE_LABELS[route]}`);
    }
    prevRoute.current = route;
  }, [route, announce]);

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>

      <header className="app-header">
        <a className="brand" href="#/entrenar">
          <span className="spark" aria-hidden="true" />
          Forja<em>Fit</em>
        </a>
        <nav className="main-nav" aria-label="Principal">
          <ul>
            {ROUTES.map((r) => (
              <li key={r}>
                <a href={`#/${r}`} aria-current={route === r ? 'page' : undefined}>
                  {ICONS[r]}
                  <span>{ROUTE_LABELS[r]}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="app-main" id="main">
        {!ready ? (
          <p className="muted" role="status">
            Preparando tu cuaderno de gimnasio…
          </p>
        ) : (
          <>
            {route === 'entrenar' && <TrainView />}
            {route === 'historial' && <HistoryView />}
            {route === 'rutinas' && <RoutinesView />}
            {route === 'ejercicios' && <ExercisesView />}
            {route === 'progreso' && (
              <Suspense
                fallback={
                  <p className="muted" role="status">
                    Cargando gráficas…
                  </p>
                }
              >
                <ProgressView />
              </Suspense>
            )}
            {route === 'ajustes' && <SettingsView theme={theme} setTheme={setTheme} />}
          </>
        )}
      </main>
    </>
  );
}

export function App() {
  return (
    <AnnouncerProvider>
      <AppShell />
    </AnnouncerProvider>
  );
}

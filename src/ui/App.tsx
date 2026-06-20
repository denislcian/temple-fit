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
import { hasOnboarded } from '../data/profile';
import { ensureFoodsSeeded } from '../data/repositories/nutritionRepo';
import { ensureSeeded } from '../data/seed';
import { AnnouncerProvider, useAnnounce } from './components/Announcer';
import { AuthProvider } from './components/AuthContext';
import { Onboarding } from './components/Onboarding';
import {
  PRIMARY_ROUTES,
  ROUTE_LABELS,
  SECONDARY_ROUTES,
  useHashRoute,
  type Route,
} from './hooks/useHashRoute';
import { useTheme, type Theme } from './hooks/useTheme';
import { ExercisesView } from './views/ExercisesView';
import { HistoryView } from './views/HistoryView';
import { MoreView } from './views/MoreView';
import { NutritionView } from './views/NutritionView';
import { RoutinesView } from './views/RoutinesView';
import { SettingsView } from './views/SettingsView';
import { SocialView } from './views/SocialView';
import { DRAFT_KEY, TrainView } from './views/TrainView';

// Recharts solo se descarga si el usuario entra en Progreso (code splitting).
const ProgressView = lazy(() => import('./views/ProgressView'));

const ICONS: Record<Route, ReactNode> = {
  entrenar: (
    // Mancuerna
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" strokeLinecap="round" />
    </svg>
  ),
  nutricion: (
    // Manzana
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 8c-1.5-2-4.5-2.5-6.5-.5S3 13 5 16.5 9.5 21 12 19.5c2.5 1.5 5-.5 7-3.5s1.5-7-.5-9S13.5 6 12 8Z" />
      <path d="M12 8c0-2 1-3.5 3-4.5" strokeLinecap="round" />
    </svg>
  ),
  social: (
    // Dos personas
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" strokeLinecap="round" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16 14.7c2.3.2 4 1.7 4.5 4.3" strokeLinecap="round" />
    </svg>
  ),
  mas: (
    // Puntos
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
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

// Agrupación de la barra lateral de escritorio (en móvil: 5 pestañas + Más).
const NAV_GROUPS: Array<{ label: string; routes: Route[] }> = [
  { label: 'Entrenamiento', routes: ['entrenar', 'rutinas', 'ejercicios', 'historial'] },
  { label: 'Seguimiento', routes: ['progreso', 'nutricion'] },
  { label: 'Comunidad', routes: ['social'] },
];

function Brand() {
  return (
    <a className="brand" href="#/entrenar">
      <span className="spark" aria-hidden="true" />
      <span>
        Temp<em>le</em>
      </span>
    </a>
  );
}

function NavLink({ to, route }: { to: Route; route: Route }) {
  return (
    <a href={`#/${to}`} aria-current={route === to ? 'page' : undefined}>
      {ICONS[to]}
      <span>{ROUTE_LABELS[to]}</span>
    </a>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={next === 'light' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}

function AppShell() {
  const { route } = useHashRoute();
  const { theme, setTheme } = useTheme();
  const announce = useAnnounce();
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !hasOnboarded());
  const [draftActive, setDraftActive] = useState(false);
  const prevRoute = useRef<Route | null>(null);

  // Hay un entrenamiento a medias guardado en localStorage. Se reevalúa al
  // navegar (basta: empezar/descartar/guardar ocurren dentro de "Entrenar").
  useEffect(() => {
    setDraftActive(!!localStorage.getItem(DRAFT_KEY));
  }, [route]);

  // Primer arranque: sembrar los catálogos y pedir almacenamiento persistente.
  useEffect(() => {
    Promise.all([ensureSeeded(), ensureFoodsSeeded()]).then(() => {
      setReady(true);
      requestPersistentStorage();
    });
  }, []);

  // Título de la pestaña del navegador acorde a la vista actual.
  useEffect(() => {
    document.title = `${ROUTE_LABELS[route]} — Temple`;
  }, [route]);

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
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>

      {/* Cabecera solo en móvil: marca + cambio de tema. */}
      <header className="app-header">
        <Brand />
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <nav className="main-nav" aria-label="Principal">
        {/* Móvil: 5 pestañas inferiores en la zona del pulgar. */}
        <ul className="nav-tabs">
          {PRIMARY_ROUTES.map((r) => (
            <li key={r}>
              <NavLink to={r} route={route} />
            </li>
          ))}
          <li>
            <a
              href="#/mas"
              aria-current={
                route === 'mas' || (SECONDARY_ROUTES as readonly string[]).includes(route)
                  ? 'page'
                  : undefined
              }
            >
              {ICONS.mas}
              <span>{ROUTE_LABELS.mas}</span>
            </a>
          </li>
        </ul>

        {/* Escritorio: barra lateral con secciones agrupadas. */}
        <div className="nav-sections">
          <div className="nav-brand">
            <Brand />
          </div>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="nav-kicker" aria-hidden="true">
                {group.label}
              </span>
              <ul aria-label={group.label}>
                {group.routes.map((r) => (
                  <li key={r}>
                    <NavLink to={r} route={route} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="nav-footer">
            <ul aria-label="Aplicación">
              <li>
                <NavLink to="ajustes" route={route} />
              </li>
            </ul>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </nav>

      <main className="app-main" id="main">
        {ready && draftActive && route !== 'entrenar' && (
          <a className="active-session" href="#/entrenar">
            <span className="dot" aria-hidden="true" />
            <span>
              Entrenamiento en curso · <strong>volver para continuar</strong>
            </span>
          </a>
        )}
        {!ready ? (
          <p className="muted" role="status">
            Preparando tu cuaderno de gimnasio…
          </p>
        ) : (
          // key={route}: cada vista se monta de nuevo al navegar, lo que dispara
          // una transición sutil de entrada (neutralizada en prefers-reduced-motion).
          <div className="app-view" key={route}>
            {route === 'entrenar' && <TrainView />}
            {route === 'nutricion' && <NutritionView />}
            {route === 'social' && <SocialView />}
            {route === 'mas' && <MoreView icons={ICONS} />}
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
          </div>
        )}
      </main>

      {ready && showWelcome && <Onboarding onDone={() => setShowWelcome(false)} />}
    </div>
  );
}

export function App() {
  return (
    <AnnouncerProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AnnouncerProvider>
  );
}

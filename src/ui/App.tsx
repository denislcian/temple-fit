// CAPA 3 · Interfaz — Armazón de la aplicación.
// Gestión de foco en SPA: al cambiar de vista, el foco se mueve al <h1>
// (tabindex=-1) y una región viva anuncia la navegación; sin esto, el cambio
// de ruta es silencioso para un lector de pantalla.
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo-black/400.css';
import { cloudSync } from '../data/cloudSync';
import { requestPersistentStorage } from '../data/db';
import { getAllSessions } from '../data/repositories/sessionRepo';
import { socialRepo } from '../data/repositories/socialRepo';
import { computeProfileStats } from '../domain/profileStats';
import { isSupabaseEnabled } from '../data/supabase';
import { ensureFoodsSeeded } from '../data/repositories/nutritionRepo';
import { ensureSeeded } from '../data/seed';
import { AnnouncerProvider, useAnnounce } from './components/Announcer';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { WelcomeHero } from './components/WelcomeHero';
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
import { ProfileView } from './views/ProfileView';
import { NotificationsView } from './views/NotificationsView';
import { CoachView } from './views/CoachView';
import { DescansoView } from './views/DescansoView';
import { RecipesView } from './views/RecipesView';
import { ToolsView } from './views/ToolsView';
import { TrainView } from './views/TrainView';
import { DRAFT_KEY } from './trainDraft';

// Recharts solo se descarga si el usuario entra en Progreso (code splitting).
const ProgressView = lazy(() => import('./views/ProgressView'));

// Iconografía dúotono propia: silueta a trazo + relleno suave con currentColor
// (tiñe con el color del enlace, así el icono activo se "rellena" de acento).
const ICON_SVG = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;
const FILL = { fill: 'currentColor', fillOpacity: 0.2, stroke: 'none' } as const;
const FILL_SOFT = { fill: 'currentColor', fillOpacity: 0.16, stroke: 'none' } as const;

const ICONS: Record<Route, ReactNode> = {
  entrenar: (
    // Mancuerna con discos rellenos.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <rect x="3.4" y="7.4" width="3.5" height="9.2" rx="1.3" {...FILL} />
      <rect x="17.1" y="7.4" width="3.5" height="9.2" rx="1.3" {...FILL} />
      <rect x="3.4" y="7.4" width="3.5" height="9.2" rx="1.3" />
      <rect x="17.1" y="7.4" width="3.5" height="9.2" rx="1.3" />
      <path d="M6.9 12h10.2" strokeWidth="2.4" />
    </svg>
  ),
  nutricion: (
    // Manzana rellena + hoja.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path
        d="M12 8c-1.5-2-4.5-2.5-6.5-.5S3 13 5 16.5 9.5 21 12 19.5c2.5 1.5 5-.5 7-3.5s1.5-7-.5-9S13.5 6 12 8Z"
        {...FILL}
      />
      <path d="M12 8c-1.5-2-4.5-2.5-6.5-.5S3 13 5 16.5 9.5 21 12 19.5c2.5 1.5 5-.5 7-3.5s1.5-7-.5-9S13.5 6 12 8Z" />
      <path d="M12 8c0-2 1-3.5 3-4.5" />
    </svg>
  ),
  social: (
    // Dos personas; la de delante rellena.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16 14.7c2.3.2 4 1.7 4.5 4.3" />
      <circle cx="9" cy="8" r="3.3" {...FILL} />
      <path d="M3.5 19.3c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5Z" {...FILL} />
      <circle cx="9" cy="8" r="3.3" />
      <path d="M3.5 19.3c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    </svg>
  ),
  mas: (
    // Rejilla de cuatro: distintiva para "Más".
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="2" {...FILL} />
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" {...FILL} />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  ),
  historial: (
    // Reloj con esfera tintada.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...FILL_SOFT} />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  rutinas: (
    // Lista con viñetas sólidas.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h7" strokeWidth="2" />
      <circle cx="4.4" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.4" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  ejercicios: (
    // Ficha de ejercicio.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" {...FILL_SOFT} />
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M8.5 4v16" />
      <path d="M12 9h5M12 13h5" strokeWidth="1.7" />
    </svg>
  ),
  herramientas: (
    // Calculadora con pantalla.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2.5" {...FILL_SOFT} />
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <rect x="8" y="6" width="8" height="2.6" rx="0.8" fill="currentColor" fillOpacity="0.45" stroke="none" />
      <path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" strokeWidth="2.3" />
    </svg>
  ),
  descanso: (
    // Luna rellena con destello.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" {...FILL} />
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      <path
        d="M17.4 3.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7Z"
        fill="currentColor"
        fillOpacity="0.55"
        stroke="none"
      />
    </svg>
  ),
  recetas: (
    // Plato relleno + tenedor.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <circle cx="10.5" cy="13" r="6" {...FILL} />
      <circle cx="10.5" cy="13" r="6" />
      <circle cx="10.5" cy="13" r="2.4" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <path d="M19.5 3v18M19.5 11c-1.3-.2-2-1.1-2-2.6V3M21.5 3v5.4c0 1.5-.7 2.4-2 2.6" strokeWidth="1.7" />
    </svg>
  ),
  progreso: (
    // Barras ascendentes (más distintivo que una línea).
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M4 4v16h16" />
      <rect x="7" y="12.5" width="3" height="7.5" rx="0.8" {...FILL} />
      <rect x="7" y="12.5" width="3" height="7.5" rx="0.8" />
      <rect x="11.5" y="9.5" width="3" height="10.5" rx="0.8" {...FILL} />
      <rect x="11.5" y="9.5" width="3" height="10.5" rx="0.8" />
      <rect x="16" y="6.5" width="3" height="13.5" rx="0.8" {...FILL} />
      <rect x="16" y="6.5" width="3" height="13.5" rx="0.8" />
    </svg>
  ),
  coach: (
    // Diana: objetivo y guía adaptativa.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <circle cx="12" cy="12" r="9" {...FILL_SOFT} />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  ajustes: (
    // Deslizadores: claro e inequívoco para "Ajustes".
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M4 7.5h8M17 7.5h3M4 16.5h3M12 16.5h8" strokeWidth="2" />
      <circle cx="15" cy="7.5" r="2.5" {...FILL} />
      <circle cx="15" cy="7.5" r="2.5" />
      <circle cx="9" cy="16.5" r="2.5" {...FILL} />
      <circle cx="9" cy="16.5" r="2.5" />
    </svg>
  ),
  perfil: (
    // Persona (no aparece en el nav; se llega tocando a alguien).
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" {...FILL} />
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6Z" {...FILL} />
      <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
    </svg>
  ),
  notificaciones: (
    // Campana.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5Z" {...FILL_SOFT} />
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
};

// Agrupación de la barra lateral de escritorio (en móvil: 5 pestañas + Más).
const NAV_GROUPS: Array<{ label: string; routes: Route[] }> = [
  { label: 'Entrenamiento', routes: ['entrenar', 'coach', 'rutinas', 'ejercicios', 'herramientas', 'historial'] },
  { label: 'Seguimiento', routes: ['progreso', 'nutricion', 'recetas'] },
  { label: 'Bienestar', routes: ['descanso'] },
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

function AppShell({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const { route, param } = useHashRoute();
  const announce = useAnnounce();
  const [ready, setReady] = useState(false);
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

  // Gestión de foco + transición + anuncio al navegar (no en la carga inicial).
  // Se compara con la ruta anterior en lugar de usar un flag: así sobrevive al
  // doble efecto de StrictMode en desarrollo.
  useEffect(() => {
    if (prevRoute.current !== null && prevRoute.current !== route) {
      requestAnimationFrame(() => {
        document.getElementById('view-title')?.focus();
        // Cada vista empieza arriba (no se hereda el scroll de la anterior).
        window.scrollTo({ top: 0 });
      });
      // En navegadores con View Transitions API (useHashRoute) el crossfade lo
      // hace el navegador. Como respaldo, en el resto animamos la entrada con la
      // Web Animations API. Ambos respetan prefers-reduced-motion.
      const hasViewTransitions = 'startViewTransition' in document;
      const view = document.querySelector('.app-view');
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!hasViewTransitions && view && !reduce && typeof view.animate === 'function') {
        view.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      }
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
          // La transición de entrada se dispara con la Web Animations API en el
          // efecto de navegación (arriba). Cada vista sigue montándose/desmontándose
          // por ruta (render condicional), igual que antes.
          <div className="app-view">
            {route === 'entrenar' && <TrainView />}
            {route === 'coach' && <CoachView />}
            {route === 'nutricion' && <NutritionView />}
            {route === 'social' && <SocialView />}
            {route === 'perfil' && <ProfileView userId={param} />}
            {route === 'notificaciones' && <NotificationsView />}
            {route === 'mas' && <MoreView icons={ICONS} />}
            {route === 'historial' && <HistoryView />}
            {route === 'rutinas' && <RoutinesView />}
            {route === 'ejercicios' && <ExercisesView />}
            {route === 'herramientas' && <ToolsView />}
            {route === 'descanso' && <DescansoView />}
            {route === 'recetas' && <RecipesView />}
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
    </div>
  );
}

// Puerta de acceso: pantalla completa con la presentación de la app y el
// registro/inicio de sesión. Solo aparece en modo nube (Supabase) cuando no hay
// sesión; al autenticarse, AuthContext actualiza la cuenta y se muestra la app.
function AuthGate({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="gate">
      <header className="gate__top">
        <Brand />
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>
      <div className="gate__body">
        <section className="gate__hero">
          <WelcomeHero />
        </section>
        <section className="gate__auth" aria-label="Acceso">
          <p className="gate__auth-kicker">Crea tu cuenta gratis o inicia sesión para empezar</p>
          <AuthScreen />
        </section>
      </div>
    </div>
  );
}

// Decide qué se muestra: cargando → app local → puerta (nube sin sesión) → app.
function Root() {
  const { account, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  // Al haber sesión: sincroniza los datos de la cuenta (sube lo local la 1ª vez,
  // baja lo de la nube) y publica el resumen de stats para tu perfil.
  const accountId = account?.id;
  useEffect(() => {
    if (!accountId) return;
    void (async () => {
      try {
        if (cloudSync) await cloudSync.syncNow(accountId);
        await socialRepo.publishStats(
          accountId,
          computeProfileStats(await getAllSessions(), new Date().toISOString().slice(0, 10)),
        );
      } catch {
        // Sync/stats son best-effort: nunca deben romper el arranque.
      }
    })();
  }, [accountId]);

  if (isSupabaseEnabled && loading) {
    return (
      <div className="gate gate--loading">
        <span className="spark" aria-hidden="true" />
        <p className="muted" role="status">
          Cargando…
        </p>
      </div>
    );
  }
  if (isSupabaseEnabled && !account) {
    return <AuthGate theme={theme} setTheme={setTheme} />;
  }
  return <AppShell theme={theme} setTheme={setTheme} />;
}

export function App() {
  return (
    <AnnouncerProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </AnnouncerProvider>
  );
}

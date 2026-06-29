// CAPA 3 · Interfaz — Armazón de la aplicación.
// Gestión de foco en SPA: al cambiar de vista, el foco se mueve al <h1>
// (tabindex=-1) y una región viva anuncia la navegación; sin esto, el cambio
// de ruta es silencioso para un lector de pantalla.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
import { ICONS } from './icons';
import { MoonIcon, SunIcon } from './components/icons';

// Recharts solo se descarga si el usuario entra en Progreso (code splitting).
const ProgressView = lazy(() => import('./views/ProgressView'));

// Iconos dúotono: definidos en ./icons (compartidos con la bienvenida).

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
      <svg className="brand-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 41 V31 H70 V41" />
          <path d="M50 31 V71" />
          <path d="M42 51 H58" />
          <path d="M44 71 H67 V61" />
        </g>
      </svg>
      <span>
        TM<em>PL</em>
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
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? SunIcon : MoonIcon}
      </span>
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
    document.title = `${ROUTE_LABELS[route]} — TMPL`;
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
          {/* Lista plana estilo Hevy: una sola columna de secciones, sin
              cabeceras de grupo, con el activo en píldora. */}
          <ul aria-label="Secciones">
            {NAV_GROUPS.flatMap((group) => group.routes).map((r) => (
              <li key={r}>
                <NavLink to={r} route={route} />
              </li>
            ))}
          </ul>
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

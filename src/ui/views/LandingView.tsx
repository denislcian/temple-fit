// CAPA 3 · Interfaz — Landing breve: qué es TMPL. Se llega tocando el logo de la
// cabecera. Reutiliza los iconos dúotono del menú para presentar cada sección.
import type { Route } from '../hooks/useHashRoute';
import { ICONS } from '../icons';

const FEATURES: Array<{ route: Route; title: string; desc: string }> = [
  {
    route: 'entrenar',
    title: 'Entrenamiento',
    desc: 'Registra series, pesos y RPE; descansos con alarma y récords automáticos.',
  },
  {
    route: 'nutricion',
    title: 'Nutrición',
    desc: 'Calorías y macros con datos reales (USDA) y objetivos respaldados por estudios.',
  },
  {
    route: 'coach',
    title: 'Coach',
    desc: 'Cruza tu fatiga, volumen y descanso y te dice qué hacer hoy. Sin descargas.',
  },
  {
    route: 'descanso',
    title: 'Descanso',
    desc: 'Seguimiento del sueño, sonidos, respiración guiada y alarma para recuperar.',
  },
  {
    route: 'social',
    title: 'Comunidad',
    desc: 'Comparte tus avances y sigue a otras personas, decidiendo quién ve cada cosa.',
  },
  {
    route: 'progreso',
    title: 'Progreso',
    desc: 'Volumen semanal, récords personales y tu 1RM estimado a lo largo del tiempo.',
  },
];

export function LandingView() {
  return (
    <div className="landing">
      <header className="landing__hero">
        <span className="landing__mark" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M30 41 V31 H70 V41" />
              <path d="M50 31 V71" />
              <path d="M42 51 H58" />
              <path d="M44 71 H67 V61" />
            </g>
          </svg>
        </span>
        <h1 id="view-title" tabIndex={-1} className="landing__title">
          TMPL
        </h1>
        <p className="landing__tagline">
          Tu plataforma de salud y entrenamiento. Todo en un sitio, contigo siempre.
        </p>
        <div className="landing__cta">
          <a className="btn btn--primary" href="#/entrenar">
            Empezar a entrenar
          </a>
        </div>
      </header>

      <p className="landing__lead">
        TMPL reúne lo que pagarías en varias apps —entrenamiento, nutrición, descanso y
        comunidad— en una sola: rápida, sin anuncios y con tus datos en tu dispositivo.
      </p>

      <div className="landing__grid">
        {FEATURES.map((f) => (
          <a key={f.route} className="landing__feature" href={`#/${f.route}`}>
            <span className="landing__feature-ico" aria-hidden="true">
              {ICONS[f.route]}
            </span>
            <span className="landing__feature-text">
              <strong>{f.title}</strong>
              <span className="muted">{f.desc}</span>
            </span>
          </a>
        ))}
      </div>

      <section className="card landing__values">
        <h2>Tus datos, tuyos</h2>
        <p className="muted">
          Funciona sin conexión, sin anuncios ni rastreadores, e instalable como app. Puedes
          exportar todo cuando quieras. La cuenta de comunidad es opcional: lo que registras es
          tuyo.
        </p>
        <div className="btn-row">
          <a className="btn" href="#/recetas">
            Ver recetas
          </a>
          <a className="btn btn--ghost" href="#/ajustes">
            Ajustes y datos
          </a>
        </div>
      </section>
    </div>
  );
}

// CAPA 3 · Interfaz — Hero de bienvenida.
// Presenta la app de un vistazo: emblema, propuesta de valor y los seis pilares
// de la plataforma. Lo usa la puerta de acceso (AuthGate). Puramente visual.
// Los pilares usan la MISMA iconografía dúotono que el menú (ver ../icons): así
// la bienvenida ya no luce "emoji genérico" y habla el lenguaje del producto.
import { ICONS } from '../icons';
import { type Route } from '../hooks/useHashRoute';

interface Pillar {
  route: Route;
  label: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  { route: 'entrenar', label: 'Entrena', desc: 'Rutinas y progresión' },
  { route: 'progreso', label: 'Progreso', desc: 'Peso, récords y gráficas' },
  { route: 'nutricion', label: 'Nutrición', desc: 'Calorías y macros, por foto' },
  { route: 'descanso', label: 'Descanso', desc: 'Sonidos, respiración y sueño' },
  { route: 'recetas', label: 'Recetas', desc: 'Saludables y filtrables' },
  { route: 'social', label: 'Comunidad', desc: 'Comparte y sigue a otros' },
];

export function WelcomeHero() {
  return (
    <div className="welcome">
      <span className="welcome__emblem" aria-hidden="true">
        {/* Llama "brasa": emblema de marca en el lenguaje SVG dúotono. */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M13 2.5c.5 2.9 3.6 4.3 3.6 7.9a4.6 4.6 0 0 1-9.2 0c0-1 .3-2 .9-2.8.3.9 1 1.4 1.8 1.5C9.4 6.5 11 4.2 13 2.5Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="none"
          />
          <path d="M13 2.5c.5 2.9 3.6 4.3 3.6 7.9a4.6 4.6 0 0 1-9.2 0c0-1 .3-2 .9-2.8.3.9 1 1.4 1.8 1.5C9.4 6.5 11 4.2 13 2.5Z" />
        </svg>
      </span>
      <h1 className="welcome__title">Bienvenido a Temple</h1>
      <p className="welcome__tagline">
        Tu plataforma de salud y entrenamiento. Todo en un sitio, contigo siempre.
      </p>

      <ul className="welcome__pillars">
        {PILLARS.map((p) => (
          <li key={p.route}>
            <span className="welcome__pillar-icon" aria-hidden="true">
              {ICONS[p.route]}
            </span>
            <span className="welcome__pillar-text">
              <span className="welcome__pillar-label">{p.label}</span>
              <span className="welcome__pillar-desc">{p.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="welcome__privacy">
        <svg
          className="welcome__privacy-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.3A3.75 3.75 0 0 1 17.5 18Z" fill="currentColor" fillOpacity="0.18" stroke="none" />
          <path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.3A3.75 3.75 0 0 1 17.5 18Z" />
        </svg>{' '}
        Tu cuenta guarda tu progreso y lo sincroniza en todos tus dispositivos. Comparte lo que
        quieras con la comunidad.
      </p>
    </div>
  );
}

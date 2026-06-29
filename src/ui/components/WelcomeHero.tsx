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
        {/* Chispa de marca (misma del logo): degradado brasa → ámbar. */}
        <span className="spark" />
      </span>
      <h1 className="welcome__title">Bienvenido a TMPL</h1>
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

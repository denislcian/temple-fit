// CAPA 3 · Interfaz — Bienvenida del primer arranque.
// Una sola pantalla que presenta la app: emblema, propuesta de valor y los seis
// pilares de la plataforma. Se muestra una vez (marca hasOnboarded). Accesible:
// usa el <dialog> nativo (focus trap + Escape) con su propio titular de nivel 2.
import { markOnboarded } from '../../data/profile';
import { AppDialog } from './AppDialog';

interface Pillar {
  icon: string;
  label: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  { icon: '🏋️', label: 'Entrena', desc: 'Rutinas y progresión' },
  { icon: '📈', label: 'Progreso', desc: 'Peso, récords y gráficas' },
  { icon: '🥗', label: 'Nutrición', desc: 'Calorías y macros, por foto' },
  { icon: '🌙', label: 'Descanso', desc: 'Sonidos, respiración y sueño' },
  { icon: '🍳', label: 'Recetas', desc: 'Saludables y filtrables' },
  { icon: '👥', label: 'Comunidad', desc: 'Comparte y sigue a otros' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  function finish() {
    markOnboarded();
    onDone();
  }

  return (
    <AppDialog open title="Bienvenido a Temple" onClose={finish} hideTitleHeading>
      <div className="welcome">
        <span className="welcome__emblem" aria-hidden="true">
          🔥
        </span>
        <h2 className="welcome__title">Bienvenido a Temple</h2>
        <p className="welcome__tagline">
          Tu plataforma de salud y entrenamiento. Todo en un sitio, contigo siempre.
        </p>

        <ul className="welcome__pillars">
          {PILLARS.map((p) => (
            <li key={p.label}>
              <span className="welcome__pillar-icon" aria-hidden="true">
                {p.icon}
              </span>
              <span className="welcome__pillar-text">
                <span className="welcome__pillar-label">{p.label}</span>
                <span className="welcome__pillar-desc">{p.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="welcome__privacy">
          <span aria-hidden="true">🔒</span> Tus entrenos, nutrición y sueño se guardan solo en tu
          dispositivo. La comunidad es opcional.
        </p>

        <button type="button" className="btn btn--primary welcome__cta" onClick={finish}>
          Empezar
        </button>
      </div>
    </AppDialog>
  );
}

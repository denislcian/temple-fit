// CAPA 3 · Interfaz — Hero de bienvenida.
// Presenta la app de un vistazo: emblema, propuesta de valor y los seis pilares
// de la plataforma. Lo usa la puerta de acceso (AuthGate). Puramente visual.

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

export function WelcomeHero() {
  return (
    <div className="welcome">
      <span className="welcome__emblem" aria-hidden="true">
        🔥
      </span>
      <h1 className="welcome__title">Bienvenido a Temple</h1>
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
        <span aria-hidden="true">☁️</span> Tu cuenta guarda tu progreso y lo sincroniza en todos tus
        dispositivos. Comparte lo que quieras con la comunidad.
      </p>
    </div>
  );
}

// CAPA 3 · Interfaz — Bienvenida del primer arranque.
// Tres pasos que presentan la app y su propuesta de valor. Se muestra una
// sola vez (marca hasOnboarded). Accesible: usa el <dialog> nativo (focus
// trap + Escape) y anuncia cada paso.
import { useState } from 'react';
import { markOnboarded } from '../../data/profile';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';

interface Slide {
  icon: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🔥',
    title: 'Bienvenido a Temple',
    body: 'Tu cuaderno de gimnasio: registra tus entrenamientos de fuerza, tu nutrición y tu progreso. Gratis, sin cuentas y funcionando sin conexión.',
  },
  {
    icon: '🛡️',
    title: 'Tus datos son tuyos',
    body: 'Todo se guarda solo en este dispositivo: nada de servidores ni rastreo. Puedes exportar e importar tus datos cuando quieras desde Ajustes.',
  },
  {
    icon: '💪',
    title: 'Todo en un sitio',
    body: 'Entrena con plantillas y progresión sugerida, cuenta calorías y macros (incluso por foto), sigue tu peso y tus récords, y comparte rutinas en la comunidad.',
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const announce = useAnnounce();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step]!;
  const isLast = step === SLIDES.length - 1;

  function finish() {
    markOnboarded();
    onDone();
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    const n = step + 1;
    setStep(n);
    announce(`${SLIDES[n]!.title}. Paso ${n + 1} de ${SLIDES.length}`);
  }

  return (
    <AppDialog open title={slide.title} onClose={finish}>
      <div className="onboarding">
        <span className="onboarding-icon" aria-hidden="true">
          {slide.icon}
        </span>
        <p>{slide.body}</p>

        <div className="onboarding-dots" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="btn-row" style={{ justifyContent: isLast ? 'center' : 'space-between' }}>
          {!isLast && (
            <button type="button" className="btn btn--ghost" onClick={finish}>
              Saltar
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={next}>
            {isLast ? 'Empezar a entrenar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </AppDialog>
  );
}

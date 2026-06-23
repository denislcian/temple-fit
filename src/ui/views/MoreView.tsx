// CAPA 3 · Interfaz — Vista "Más" (solo móvil): acceso a las secciones que
// no caben en la barra inferior de 5 pestañas.
import type { ReactNode } from 'react';
import { ROUTE_LABELS, SECONDARY_ROUTES } from '../hooks/useHashRoute';

const DESCRIPTIONS: Record<string, string> = {
  historial: 'Todas tus sesiones guardadas, sin límite temporal',
  rutinas: 'Tus plantillas y el generador de planes por objetivo',
  ejercicios: 'La biblioteca de movimientos en español',
  herramientas: 'Calculadoras de 1RM y de discos en la barra',
  descanso: 'Sonidos para dormir y respiración guiada',
  ajustes: 'Perfil, tema, copias de seguridad y ayuda',
};

export function MoreView({ icons }: { icons: Record<string, ReactNode> }) {
  return (
    <>
      <span className="kicker">Todo lo demás</span>
      <h1 id="view-title" tabIndex={-1}>
        Más
      </h1>
      <ul className="item-list">
        {SECONDARY_ROUTES.map((route) => (
          <li key={route}>
            <a className="more-link" href={`#/${route}`}>
              <span className="more-icon" aria-hidden="true">
                {icons[route]}
              </span>
              <span>
                <span className="title">{ROUTE_LABELS[route]}</span>
                <br />
                <span className="meta">{DESCRIPTIONS[route]}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

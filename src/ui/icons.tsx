// CAPA 3 · Interfaz — Iconografía dúotono propia (compartida).
// Silueta a trazo + relleno suave con currentColor (tiñe con el color del
// contexto). La usan el menú (App) y la bienvenida (WelcomeHero), así no se
// duplican definiciones y todo el producto habla el mismo lenguaje visual.
import { type ReactNode } from 'react';
import { type Route } from './hooks/useHashRoute';

const ICON_SVG = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;
const FILL = { fill: 'currentColor', fillOpacity: 0.2, stroke: 'none' } as const;
const FILL_SOFT = { fill: 'currentColor', fillOpacity: 0.16, stroke: 'none' } as const;

export const ICONS: Record<Route, ReactNode> = {
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
  inicio: (
    // Casa rellena: portada / landing.
    <svg viewBox="0 0 24 24" {...ICON_SVG} aria-hidden="true">
      <path d="M5 10.5 12 4l7 6.5V20H5Z" {...FILL_SOFT} />
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  ),
};

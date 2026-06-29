// CAPA 3 · Interfaz — Iconos de acción reutilizables para las botoneras de
// fila (Editar/Duplicar/Eliminar/Repetir…). Trazo de 2px, heredan currentColor.
import type { ReactNode } from 'react';

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {children}
  </svg>
);

export const EditIcon = svg(
  <>
    <path d="M12 20h9" strokeLinecap="round" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinejoin="round" strokeLinecap="round" />
  </>,
);

export const CopyIcon = svg(
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
  </>,
);

export const TrashIcon = svg(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
    <path d="M10 11v6M14 11v6" strokeLinecap="round" />
  </>,
);

export const RepeatIcon = svg(
  <>
    <path d="M21 12a9 9 0 1 1-3.4-7.05" strokeLinecap="round" />
    <path d="M21 4.5V9h-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const HowToIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11.5V16" strokeLinecap="round" />
    <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
  </>,
);

export const ProgressIcon = svg(
  <>
    <path d="M4 19V5M4 19h16" strokeLinecap="round" />
    <path d="m7 14 3.5-3.5 3 3L20 7" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const ChevronUpIcon = svg(
  <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
);

export const ChevronDownIcon = svg(
  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
);

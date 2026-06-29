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

export const HeartIcon = svg(
  <path
    d="M12 20s-7-4.35-9.4-8.5C1.2 8.7 2.6 5 6 5c2 0 3.3 1.2 4 2.3C10.7 6.2 12 5 14 5c3.4 0 4.8 3.7 3.4 6.5C19 15.65 12 20 12 20Z"
    strokeLinejoin="round"
  />,
);

export const CommentIcon = svg(
  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" strokeLinecap="round" strokeLinejoin="round" />,
);

export const BellIcon = svg(
  <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
  </>,
);

export const SunIcon = svg(
  <>
    <circle cx="12" cy="12" r="4.2" />
    <path
      d="M12 2.5v2M12 19.5v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2.5 12h2M19.5 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"
      strokeLinecap="round"
    />
  </>,
);

export const MoonIcon = svg(
  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" strokeLinecap="round" strokeLinejoin="round" />,
);

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

export const CheckIcon = svg(<path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />);

export const AlertIcon = svg(
  <>
    <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
    <path d="M12 10v4" strokeLinecap="round" />
    <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
  </>,
);

export const UserIcon = svg(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
  </>,
);

export const LockIcon = svg(
  <>
    <rect x="5" y="11" width="14" height="9.5" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
  </>,
);

export const AwardIcon = svg(
  <>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M9 13.5 7.5 21l4.5-2.6 4.5 2.6-1.5-7.5" strokeLinejoin="round" strokeLinecap="round" />
  </>,
);

export const TargetIcon = svg(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </>,
);

export const CameraIcon = svg(
  <>
    <path d="M4 8a2 2 0 0 1 2-2h2l1.3-2h5.4L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" strokeLinejoin="round" />
    <circle cx="12" cy="12.5" r="3.4" />
  </>,
);

export const MicIcon = svg(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" strokeLinecap="round" />
  </>,
);

export const DropletIcon = svg(
  <path d="M12 3.5s5.5 5.8 5.5 10A5.5 5.5 0 0 1 6.5 13.5c0-4.2 5.5-10 5.5-10Z" strokeLinejoin="round" />,
);

export const UtensilsIcon = svg(
  <>
    <path d="M6 3v6a2 2 0 0 0 2 2v10M8 3v6M16 3c-1.4 0-2.3 1.8-2.3 4.5S14.6 12 16 12v9" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const FlameIcon = svg(
  <path
    d="M12 22a7 7 0 0 0 7-7c0-3-2-5.4-3.6-7.4-.6 1.3-1.6 2-2.6 1.9.6-2.6-.6-5.2-3.3-7.5.2 3.6-3 5.2-4.5 8.2A7 7 0 0 0 12 22Z"
    strokeLinejoin="round"
  />,
);

export const MusicNoteIcon = svg(
  <>
    <path d="M9 17V5l10-2v12" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6.5" cy="17" r="2.5" />
    <circle cx="16.5" cy="15" r="2.5" />
  </>,
);

export const PlayIcon = svg(<path d="M7 4.8v14.4l12-7.2-12-7.2Z" strokeLinejoin="round" />);

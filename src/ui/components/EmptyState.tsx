// CAPA 3 · Interfaz — Estado vacío reutilizable.
// Sustituye los "no hay datos" en texto plano por un bloque guía con icono,
// mensaje y, opcionalmente, una acción. Más amable y orientador.
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  /** Acción opcional (un botón o enlace ya estilado). */
  action?: ReactNode;
}

export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {action && <div className="btn-row" style={{ justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

// CAPA 3 · Interfaz — Diálogo modal sobre <dialog> nativo.
// El elemento nativo aporta gratis: focus trap, cierre con Escape y backdrop.
// Al cerrar, el foco vuelve solo al elemento que lo abrió (comportamiento
// nativo del navegador), cumpliendo el patrón de foco de WCAG.
import { useEffect, useRef, type ReactNode } from 'react';

interface AppDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function AppDialog({ open, title, onClose, children }: AppDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={undefined} aria-label={title}>
      {open && (
        <>
          <h2>{title}</h2>
          {children}
        </>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AppDialog open={open} title={title} onClose={onCancel}>
      <p>{description}</p>
      <div className="btn-row">
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </AppDialog>
  );
}

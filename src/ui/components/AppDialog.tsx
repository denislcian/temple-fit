// CAPA 3 · Interfaz — Diálogo modal sobre <dialog> nativo.
// El elemento nativo aporta gratis: focus trap, cierre con Escape y backdrop.
// El retorno del foco al disparador lo gestionamos NOSOTROS: la restauración
// nativa de close() se pierde cuando React desmonta un diálogo abierto
// (montaje condicional), así que se captura el foco al abrir y se restaura
// tanto al cerrar como al desmontar.
import { useEffect, useRef, type ReactNode } from 'react';

interface AppDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Oculta el <h2> por defecto cuando el contenido aporta su propio titular.
   *  El nombre accesible del diálogo se mantiene vía aria-label. */
  hideTitleHeading?: boolean;
}

export function AppDialog({ open, title, onClose, children, hideTitleHeading }: AppDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const restoreFocus = () => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && document.contains(trigger)) {
      trigger.focus();
    }
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // showModal/close pueden no existir (jsdom en tests, navegadores muy
    // antiguos): se degrada a mostrar/ocultar el diálogo sin romper.
    if (open && !dialog.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      restoreFocus();
    }
  }, [open]);

  // Desmontaje con el diálogo abierto: el navegador no restaura el foco.
  useEffect(() => {
    return () => {
      restoreFocus();
    };
  }, []);

  return (
    <dialog ref={ref} onClose={onClose} aria-label={title}>
      {open && (
        <>
          {!hideTitleHeading && <h2>{title}</h2>}
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

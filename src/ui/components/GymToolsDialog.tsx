// CAPA 3 · Interfaz — Barra y calentamiento (durante el entrenamiento).
// Envuelve PlateCalculator en un diálogo modal. La lógica vive en gymTools.ts.
import { AppDialog } from './AppDialog';
import { PlateCalculator } from './PlateCalculator';

interface GymToolsDialogProps {
  open: boolean;
  initialWeight: string;
  exerciseName?: string | undefined;
  onClose: () => void;
}

export function GymToolsDialog({ open, initialWeight, exerciseName, onClose }: GymToolsDialogProps) {
  return (
    <AppDialog
      open={open}
      title={exerciseName ? `Barra y calentamiento · ${exerciseName}` : 'Barra y calentamiento'}
      onClose={onClose}
    >
      <PlateCalculator initialWeight={initialWeight} />

      <div className="btn-row" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </AppDialog>
  );
}

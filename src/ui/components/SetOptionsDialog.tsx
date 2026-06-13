// CAPA 3 · Interfaz — Opciones de una serie: tipo y RPE (estilo Hevy).
// Se abre desde el índice de la serie. El tipo "calentamiento" excluye la
// serie del volumen y de los récords (ver isWorkingSet).
import type { SetType } from '../../data/models';
import { AppDialog } from './AppDialog';

export const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Normal',
  calentamiento: 'Calentamiento',
  drop: 'Drop set',
  fallo: 'Al fallo',
};

/** Etiqueta corta que se muestra en el índice de la fila. */
export function setTypeBadge(type: SetType | undefined, index: number): string {
  switch (type) {
    case 'calentamiento':
      return 'C';
    case 'drop':
      return 'D';
    case 'fallo':
      return 'F';
    default:
      return String(index + 1);
  }
}

const RPE_VALUES = [6, 7, 8, 9, 10] as const;

interface SetOptionsDialogProps {
  open: boolean;
  setNumber: number;
  exerciseName: string;
  type: SetType;
  rpe: number | undefined;
  onChangeType: (type: SetType) => void;
  onChangeRpe: (rpe: number | undefined) => void;
  onClose: () => void;
}

export function SetOptionsDialog({
  open,
  setNumber,
  exerciseName,
  type,
  rpe,
  onChangeType,
  onChangeRpe,
  onClose,
}: SetOptionsDialogProps) {
  return (
    <AppDialog open={open} title={`Serie ${setNumber} · ${exerciseName}`} onClose={onClose}>
      <fieldset>
        <legend>Tipo de serie</legend>
        <div className="btn-row">
          {(Object.keys(SET_TYPE_LABELS) as SetType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`btn btn--small ${type === t ? 'btn--primary' : ''}`}
              aria-pressed={type === t}
              onClick={() => onChangeType(t)}
            >
              {SET_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {type === 'calentamiento' && (
          <p className="hint">Las series de calentamiento no cuentan para tu volumen ni tus récords.</p>
        )}
      </fieldset>

      <fieldset>
        <legend>Esfuerzo percibido (RPE)</legend>
        <p className="hint">Del 6 (fácil) al 10 (no podía hacer ni una repetición más). Opcional.</p>
        <div className="btn-row">
          <button
            type="button"
            className={`btn btn--small ${rpe === undefined ? 'btn--primary' : ''}`}
            aria-pressed={rpe === undefined}
            onClick={() => onChangeRpe(undefined)}
          >
            Sin marcar
          </button>
          {RPE_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              className={`btn btn--small ${rpe === v ? 'btn--primary' : ''}`}
              aria-pressed={rpe === v}
              onClick={() => onChangeRpe(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </AppDialog>
  );
}

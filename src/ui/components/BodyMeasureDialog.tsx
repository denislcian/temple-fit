// CAPA 3 · Interfaz — Registrar medidas corporales.
// El peso actualiza el perfil → los objetivos de macros se recalculan solos.
import { useState } from 'react';
import { addMeasurement } from '../../data/repositories/bodyRepo';
import { localDateISO, parseWeight } from '../utils/format';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';
import { TextField } from './Field';

interface BodyMeasureDialogProps {
  open: boolean;
  onSaved: () => Promise<void>;
  onClose: () => void;
}

const EMPTY = { weight: '', fat: '', waist: '', chest: '', arm: '', thigh: '' };

export function BodyMeasureDialog({ open, onSaved, onClose }: BodyMeasureDialogProps) {
  const announce = useAnnounce();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | undefined>();

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(undefined);
  };

  async function save() {
    const weightKg = parseWeight(form.weight);
    if (weightKg === null || weightKg <= 0) {
      setError('El peso es obligatorio, p. ej. 76,4');
      return;
    }
    const optional = (raw: string) => {
      const v = parseWeight(raw);
      return v !== null && v > 0 ? v : undefined;
    };
    const bodyFatPct = optional(form.fat);
    const waistCm = optional(form.waist);
    const chestCm = optional(form.chest);
    const armCm = optional(form.arm);
    const thighCm = optional(form.thigh);

    const { profileUpdated } = await addMeasurement({
      date: localDateISO(),
      weightKg,
      ...(bodyFatPct !== undefined ? { bodyFatPct } : {}),
      ...(waistCm !== undefined ? { waistCm } : {}),
      ...(chestCm !== undefined ? { chestCm } : {}),
      ...(armCm !== undefined ? { armCm } : {}),
      ...(thighCm !== undefined ? { thighCm } : {}),
    });

    setForm(EMPTY);
    announce(
      profileUpdated
        ? 'Medidas guardadas. Tu perfil y tus objetivos de macros se han actualizado con el nuevo peso.'
        : 'Medidas guardadas.',
    );
    await onSaved();
    onClose();
  }

  return (
    <AppDialog open={open} title="Registrar medidas de hoy" onClose={onClose}>
      <TextField label="Peso" suffix="kg" mode="decimal" value={form.weight} onChange={set('weight')} error={error} required />
      <TextField label="Grasa corporal — opcional" suffix="%" mode="decimal" value={form.fat} onChange={set('fat')} />
      <TextField label="Cintura — opcional" suffix="cm" mode="decimal" value={form.waist} onChange={set('waist')} />
      <TextField label="Pecho — opcional" suffix="cm" mode="decimal" value={form.chest} onChange={set('chest')} />
      <TextField label="Brazo — opcional" suffix="cm" mode="decimal" value={form.arm} onChange={set('arm')} />
      <TextField label="Muslo — opcional" suffix="cm" mode="decimal" value={form.thigh} onChange={set('thigh')} />
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={save}>
          Guardar medidas
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </AppDialog>
  );
}

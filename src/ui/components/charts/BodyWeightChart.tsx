// CAPA 3 · Interfaz — Evolución del peso corporal (Recharts, SVG accesible).
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BodyMeasurement } from '../../../data/bodyModels';
import { formatShortDate } from '../../utils/format';

export function BodyWeightChart({ data }: { data: BodyMeasurement[] }) {
  const points = data.map((m) => ({
    fecha: formatShortDate(`${m.date}T00:00:00.000Z`),
    peso: m.weightKg,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeOpacity={0.2} vertical={false} />
        <XAxis dataKey="fecha" stroke="currentColor" tickLine={false} />
        <YAxis stroke="currentColor" tickLine={false} width={48} domain={['auto', 'auto']} unit=" kg" />
        <Tooltip formatter={(value) => [`${Number(value).toLocaleString('es-ES')} kg`, 'Peso']} />
        <Line type="monotone" dataKey="peso" name="Peso corporal" stroke="var(--accent-2)" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

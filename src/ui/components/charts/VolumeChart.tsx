// CAPA 3 · Interfaz — Gráfica de volumen semanal (Recharts, SVG accesible).
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklyVolume } from '../../../domain/volume';
import { formatShortDate } from '../../utils/format';

export function VolumeChart({ data }: { data: WeeklyVolume[] }) {
  const points = data.map((d) => ({
    semana: formatShortDate(`${d.weekStart}T00:00:00.000Z`),
    volumen: Math.round(d.volumeKg),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={points} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeOpacity={0.2} vertical={false} />
        <XAxis dataKey="semana" stroke="currentColor" tickLine={false} />
        <YAxis stroke="currentColor" tickLine={false} width={48} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString('es-ES')} kg`, 'Volumen']}
          cursor={{ fillOpacity: 0.1 }}
        />
        <Bar dataKey="volumen" name="Volumen (kg)" fill="var(--accent)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

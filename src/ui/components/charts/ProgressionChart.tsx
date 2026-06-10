// CAPA 3 · Interfaz — Progresión de 1RM estimado de un ejercicio.
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProgressionPoint } from '../../../domain/stats';
import { formatShortDate } from '../../utils/format';

export function ProgressionChart({ data }: { data: ProgressionPoint[] }) {
  const points = data.map((p) => ({
    fecha: formatShortDate(`${p.date}T00:00:00.000Z`),
    rm: p.best1RM,
    peso: p.topWeightKg,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeOpacity={0.2} vertical={false} />
        <XAxis dataKey="fecha" stroke="currentColor" tickLine={false} />
        <YAxis
          stroke="currentColor"
          tickLine={false}
          width={48}
          domain={['auto', 'auto']}
          unit=" kg"
        />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString('es-ES')} kg`,
            name === 'rm' ? '1RM estimado' : 'Peso máximo',
          ]}
        />
        {/* Dos series diferenciadas por trazo además de por color (WCAG 1.4.1) */}
        <Line
          type="monotone"
          dataKey="rm"
          name="1RM estimado"
          stroke="var(--accent)"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="peso"
          name="Peso máximo"
          stroke="var(--accent-2)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

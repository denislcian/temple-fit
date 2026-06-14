// CAPA 3 · Interfaz — Mini-gráfica de tendencia (SVG propio, sin dependencias).
// Para mostrar una progresión compacta sin cargar Recharts. Decorativa: el
// dato real va siempre acompañado de texto/tabla accesible junto a ella.
interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Descripción para lector de pantalla (la gráfica es aria-hidden). */
  label: string;
}

export function Sparkline({ values, width = 240, height = 56, label }: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1]![0].toFixed(1)},${height - pad} L${pad},${height - pad} Z`;
  const last = points[points.length - 1]!;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <path d={area} className="sparkline-area" />
      <path d={line} className="sparkline-line" fill="none" />
      <circle cx={last[0]} cy={last[1]} r="3.5" className="sparkline-dot" />
    </svg>
  );
}

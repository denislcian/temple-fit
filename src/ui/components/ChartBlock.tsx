// CAPA 3 · Interfaz — Patrón accesible de gráficas en tres capas (GOV.UK/Deque):
// 1. Resumen textual del insight en el cuerpo de la página (tan informativo
//    como ver la gráfica: "¿podrías explicarla por teléfono?").
// 2. La gráfica en sí (SVG de Recharts con accessibilityLayer).
// 3. Toggle "Ver como tabla" con una tabla HTML real.
import { useId, useState, type ReactNode } from 'react';

interface ChartBlockProps {
  title: string;
  /** El mensaje principal de la gráfica, en una frase. */
  summary: string;
  /** Cabeceras y filas de la tabla alternativa. */
  tableHeaders: string[];
  tableRows: (string | number)[][];
  children: ReactNode;
}

export function ChartBlock({ title, summary, tableHeaders, tableRows, children }: ChartBlockProps) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <section className="chart-block" aria-label={title}>
      <h3>{title}</h3>
      <p className="chart-summary">{summary}</p>

      {!showTable && (
        <div className="chart-frame">{children}</div>
      )}

      {showTable && (
        <table className="table" id={tableId}>
          <caption className="visually-hidden">{title}</caption>
          <thead>
            <tr>
              {tableHeaders.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        type="button"
        className="btn btn--small btn--ghost"
        aria-expanded={showTable}
        aria-controls={showTable ? tableId : undefined}
        onClick={() => setShowTable((v) => !v)}
      >
        {showTable ? 'Ver como gráfica' : 'Ver como tabla'}
      </button>
    </section>
  );
}

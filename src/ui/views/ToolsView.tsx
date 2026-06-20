// CAPA 3 · Interfaz — Herramientas: calculadoras de gimnasio disponibles en
// cualquier momento (sin necesidad de un entrenamiento en curso).
import { OneRepMaxCalculator } from '../components/OneRepMaxCalculator';
import { PlateCalculator } from '../components/PlateCalculator';

export function ToolsView() {
  return (
    <>
      <span className="kicker">Calcula sin salir del gimnasio</span>
      <h1 id="view-title" tabIndex={-1}>
        Herramientas
      </h1>

      <section className="card" aria-labelledby="orm-heading">
        <h2 id="orm-heading">Calculadora de 1RM</h2>
        <p className="muted">
          Estima tu repetición máxima a partir de una serie y planifica tus pesos de trabajo por
          porcentaje.
        </p>
        <OneRepMaxCalculator />
      </section>

      <section className="card" aria-labelledby="plates-heading">
        <h2 id="plates-heading">Discos en la barra</h2>
        <p className="muted">
          Qué poner en cada lado para tu peso objetivo, con series de calentamiento sugeridas.
        </p>
        <PlateCalculator />
      </section>
    </>
  );
}

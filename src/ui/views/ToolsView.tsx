// CAPA 3 · Interfaz — Herramientas: calculadoras de entrenamiento y nutrición
// disponibles en cualquier momento (sin necesidad de un entrenamiento en curso).
import { NutritionCalculator } from '../components/NutritionCalculator';
import { OneRepMaxCalculator } from '../components/OneRepMaxCalculator';
import { PlateCalculator } from '../components/PlateCalculator';

export function ToolsView() {
  return (
    <>
      <span className="kicker">Calculadoras de entrenamiento y nutrición</span>
      <h1 id="view-title" tabIndex={-1}>
        Herramientas
      </h1>

      <section className="card" aria-labelledby="nutri-heading">
        <h2 id="nutri-heading">Calculadora nutricional</h2>
        <p className="muted">
          Tus calorías, proteína, agua, IMC, macros y % de grasa corporal a partir de tus datos.
          Cada cifra con su fuente científica, sin cajas negras.
        </p>
        <NutritionCalculator />
      </section>

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

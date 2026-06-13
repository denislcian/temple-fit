// CAPA 3 · Interfaz — Insignia Nutri-Score (A-E).
// Accesible: no solo color — la letra es el dato, y el aria-label lleva la
// explicación completa para lector de pantalla.
import { NUTRI_DESCRIPTIONS, type NutriScore } from '../../domain/nutriScore';

export function NutriBadge({ score, size = 'sm' }: { score: NutriScore; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={`nutri-badge nutri-${score.letter.toLowerCase()} nutri-${size}`}
      role="img"
      aria-label={`Nutri-Score ${score.letter}: ${NUTRI_DESCRIPTIONS[score.letter]}`}
    >
      <span aria-hidden="true">{score.letter}</span>
    </span>
  );
}

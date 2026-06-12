// CAPA 3 · Interfaz — Ilustración del músculo trabajado.
// Decorativa a propósito (alt=""): el grupo muscular ya está como texto en
// cada ficha, así que la imagen suma para quien ve sin duplicar información
// para el lector de pantalla. Los ejercicios personalizados no tienen imagen:
// onError la oculta sin dejar hueco roto.
import { useState } from 'react';

interface ExerciseImageProps {
  exerciseId: string;
  /** Lado en píxeles (la imagen es cuadrada). */
  size?: number;
}

export function ExerciseImage({ exerciseId, size = 56 }: ExerciseImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className="muscle-img"
      src={`./musculos/${exerciseId}.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

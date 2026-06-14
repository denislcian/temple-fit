// CAPA 3 · Interfaz — Avatar generado (iniciales + color por id).
// Sin subir imágenes: evita el coste y los riesgos de moderar fotos en el
// modo local. Decorativo (el nombre va siempre como texto al lado).
import { avatarHue, initials } from '../../data/authModels';

export function Avatar({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  const hue = avatarHue(id);
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `hsl(${hue} 45% 30%)`,
        color: `hsl(${hue} 70% 88%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

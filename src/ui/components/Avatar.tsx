// CAPA 3 · Interfaz — Avatar: foto de perfil si la hay, o iniciales + color por id.
import { avatarHue, initials } from '../../data/authModels';

export function Avatar({
  id,
  name,
  size = 40,
  photoUrl,
}: {
  id: string;
  name: string;
  size?: number;
  photoUrl?: string;
}) {
  if (photoUrl) {
    return (
      <img
        className="avatar avatar--photo"
        src={photoUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
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

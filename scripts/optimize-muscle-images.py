# Convierte los PNG originales de src/img (5 MB c/u, fuera del repo) en
# webp optimizadas de 512px en public/musculos/<id-del-catalogo>.webp.
# Uso: py scripts/optimize-muscle-images.py
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src' / 'img'
TARGET = ROOT / 'public' / 'musculos'
SIZE = 512
QUALITY = 80

# Nombres de archivo que no coinciden con el id del ejercicio en el catalogo.
RENAMES = {
    'aperturas_mancuerna': 'aperturas-mancuernas',
    'curl_mancuerna': 'curl-mancuernas',
    'press_mancuerna': 'press-mancuernas',
    'hip_trust': 'hip-thrust',
    'encongimientos': 'encogimientos',
}

# Ids del catalogo (src/data/catalog.ts) para validar cobertura.
CATALOG_IDS = {
    'press-banca', 'press-banca-inclinado', 'press-mancuernas', 'aperturas-mancuernas',
    'flexiones', 'cruce-poleas', 'press-pecho-maquina', 'dominadas', 'jalon-al-pecho',
    'remo-barra', 'remo-mancuerna', 'remo-polea-baja', 'pullover-mancuerna', 'encogimientos',
    'press-militar', 'press-hombro-mancuernas', 'elevaciones-laterales', 'elevaciones-frontales',
    'pajaros', 'face-pull', 'curl-barra', 'curl-mancuernas', 'curl-martillo', 'curl-polea',
    'curl-scott', 'press-frances', 'extension-triceps-polea', 'fondos-paralelas',
    'patada-triceps', 'press-cerrado', 'sentadilla', 'sentadilla-frontal', 'sentadilla-goblet',
    'prensa-piernas', 'zancadas', 'extension-cuadriceps', 'curl-femoral', 'peso-muerto-rumano',
    'elevacion-gemelos', 'hip-thrust', 'puente-gluteo', 'patada-gluteo-polea', 'plancha',
    'plancha-lateral', 'crunch', 'elevaciones-piernas', 'rueda-abdominal', 'giro-ruso',
    'peso-muerto', 'kettlebell-swing', 'burpees', 'remo-renegado',
}


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    done = set()
    total_bytes = 0

    for png in sorted(SOURCE.glob('*.png')):
        stem = png.stem
        exercise_id = RENAMES.get(stem, stem.replace('_', '-'))
        if exercise_id not in CATALOG_IDS:
            print(f'AVISO: {png.name} no corresponde a ningun ejercicio del catalogo')
            continue
        with Image.open(png) as img:
            img = img.convert('RGB')
            # Recorte cuadrado centrado por si la generacion no fue 1:1.
            side = min(img.size)
            left = (img.width - side) // 2
            top = (img.height - side) // 2
            img = img.crop((left, top, left + side, top + side))
            img = img.resize((SIZE, SIZE), Image.LANCZOS)
            out = TARGET / f'{exercise_id}.webp'
            img.save(out, 'WEBP', quality=QUALITY, method=6)
            total_bytes += out.stat().st_size
            done.add(exercise_id)

    missing = CATALOG_IDS - done
    print(f'{len(done)} webp generadas, {total_bytes / 1024:.0f} KB total')
    if missing:
        print(f'FALTAN: {sorted(missing)}')
    else:
        print('Cobertura completa: los 52 ejercicios del catalogo tienen imagen.')


if __name__ == '__main__':
    main()

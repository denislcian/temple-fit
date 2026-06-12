# Convierte los PNG de src/img (originales de IA, ~5 MB c/u, fuera del repo)
# en webp optimizadas de 512px en public/musculos/<id-del-catalogo>.webp.
#
#   Uso:        py scripts/optimize-muscle-images.py
#   Incremental: solo convierte PNG nuevos o modificados desde la ultima vez.
#
# Los ids validos se leen DIRECTAMENTE de src/data/catalog.ts: al anadir un
# ejercicio nuevo al catalogo no hay que tocar este script.
import pathlib
import re

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src' / 'img'
TARGET = ROOT / 'public' / 'musculos'
CATALOG = ROOT / 'src' / 'data' / 'catalog.ts'
SIZE = 512
QUALITY = 80

# Nombres de archivo que no coinciden con el id del ejercicio en el catalogo.
# Si nombras el PNG exactamente como el id (con guiones o guiones bajos),
# no hace falta anadir nada aqui.
RENAMES = {
    'aperturas_mancuerna': 'aperturas-mancuernas',
    'curl_mancuerna': 'curl-mancuernas',
    'press_mancuerna': 'press-mancuernas',
    'hip_trust': 'hip-thrust',
    'encongimientos': 'encogimientos',
}


def catalog_ids() -> set[str]:
    """Ids de ejercicio definidos en catalog.ts (primer argumento de ex('...'))."""
    text = CATALOG.read_text(encoding='utf-8')
    return set(re.findall(r"ex\(\s*'([a-z0-9-]+)'", text))


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    ids = catalog_ids()
    converted, skipped, unknown = [], [], []

    for png in sorted(SOURCE.glob('*.png')):
        exercise_id = RENAMES.get(png.stem, png.stem.replace('_', '-'))
        out = TARGET / f'{exercise_id}.webp'

        if exercise_id not in ids:
            # Se convierte igualmente (puede ser un ejercicio aun no anadido
            # al catalogo), pero se avisa para detectar errores de nombre.
            unknown.append(f'{png.name} -> {out.name}')

        if out.exists() and out.stat().st_mtime >= png.stat().st_mtime:
            skipped.append(exercise_id)
            continue

        with Image.open(png) as img:
            img = img.convert('RGB')
            # Recorte cuadrado centrado por si la generacion no fue 1:1.
            side = min(img.size)
            left = (img.width - side) // 2
            top = (img.height - side) // 2
            img = img.crop((left, top, left + side, top + side))
            img = img.resize((SIZE, SIZE), Image.LANCZOS)
            img.save(out, 'WEBP', quality=QUALITY, method=6)
        converted.append(exercise_id)

    existing = {p.stem for p in TARGET.glob('*.webp')}
    missing = sorted(ids - existing)
    total_kb = sum(p.stat().st_size for p in TARGET.glob('*.webp')) / 1024

    print(f'Convertidas: {len(converted)} | Al dia (sin cambios): {len(skipped)}')
    if converted:
        print('  ' + ', '.join(converted))
    if unknown:
        print('AVISO - nombres que no estan en el catalogo (revisa el nombre o anade el ejercicio):')
        for u in unknown:
            print(f'  {u}')
    if missing:
        print(f'EJERCICIOS DEL CATALOGO SIN IMAGEN ({len(missing)}): {", ".join(missing)}')
    else:
        print('Cobertura completa: todos los ejercicios del catalogo tienen imagen.')
    print(f'Set actual: {len(existing)} webp, {total_kb:.0f} KB')


if __name__ == '__main__':
    main()

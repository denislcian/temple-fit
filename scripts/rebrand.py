# Rebranding ForjaFit -> Temple (solo la marca visible, case-sensitive).
# Los slugs tecnicos en minuscula ('forjafit': nombre de la DB, claves de
# localStorage, campo schema del export, rutas) se conservan a proposito:
# renombrarlos destruiria los datos guardados de los usuarios.
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTS = {'.md', '.ts', '.tsx', '.html', '.py', '.css'}
SKIP_PARTS = {'node_modules', 'dist', '.git', '.claude', 'dev-dist', 'coverage'}

changed = []
for path in ROOT.rglob('*'):
    if not path.is_file() or path.suffix not in EXTS:
        continue
    if any(part in SKIP_PARTS for part in path.parts):
        continue
    if path.name == 'rebrand.py':
        continue
    text = path.read_text(encoding='utf-8')
    if 'ForjaFit' not in text:
        continue
    count = text.count('ForjaFit')
    path.write_text(text.replace('ForjaFit', 'Temple'), encoding='utf-8', newline='\n')
    changed.append((str(path.relative_to(ROOT)), count))

for rel, count in changed:
    print(f'{rel}: {count}')
print(f'Total: {sum(c for _, c in changed)} reemplazos en {len(changed)} archivos')

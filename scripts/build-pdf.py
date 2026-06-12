# Genera docs/INFORME_TECNICO.pdf a partir de docs/INFORME_TECNICO.md
# usando python-markdown + Chrome headless (--print-to-pdf).
# Uso: py scripts/build-pdf.py
import pathlib
import subprocess
import tempfile

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'docs' / 'INFORME_TECNICO.md'
TARGET = ROOT / 'docs' / 'INFORME_TECNICO.pdf'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

CSS = """
@page { size: A4; margin: 22mm 18mm; }
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.55; color: #1c1c1e;
  margin: 0;
}
.cover {
  page-break-after: always;
  display: flex; flex-direction: column; justify-content: center;
  height: 90vh; text-align: left;
}
.cover .spark { font-size: 28pt; color: #c2410c; }
.cover h1 { font-size: 30pt; margin: 0.2em 0; border: none; color: #14161a; }
.cover .subtitle { font-size: 14pt; color: #444; margin-bottom: 2em; }
.cover .meta { color: #666; font-size: 10.5pt; border-top: 3px solid #c2410c; padding-top: 1em; }
h1 { font-size: 17pt; color: #14161a; border-bottom: 3px solid #c2410c; padding-bottom: 4px; margin-top: 1.6em; page-break-after: avoid; }
h2 { font-size: 13.5pt; color: #14161a; margin-top: 1.5em; page-break-after: avoid; }
h3 { font-size: 11.5pt; color: #9a3412; margin-top: 1.2em; page-break-after: avoid; }
p, li { text-align: justify; }
a { color: #9a3412; text-decoration: none; }
code { background: #f4f1ea; padding: 1px 4px; border-radius: 3px; font-size: 9pt; font-family: Consolas, monospace; }
pre { background: #f4f1ea; padding: 10px; border-radius: 6px; font-size: 8.5pt; overflow-x: hidden; white-space: pre-wrap; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 9pt; page-break-inside: avoid; }
th { background: #14161a; color: #fff; text-align: left; padding: 6px 8px; }
td { border-bottom: 1px solid #d8d2c6; padding: 6px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #faf7f1; }
blockquote { border-left: 3px solid #c2410c; margin: 1em 0; padding: 0.2em 1em; color: #555; background: #faf7f1; }
hr { border: none; border-top: 1px solid #d8d2c6; margin: 1.6em 0; }
"""

COVER = """
<div class="cover">
  <div class="spark">&#10038;</div>
  <h1>Temple</h1>
  <p class="subtitle">Informe t&eacute;cnico &mdash; Registro de entrenamientos de fuerza<br>
  PWA local-first y accesible (WCAG 2.2 AA)</p>
  <p class="meta">
    <strong>Autor:</strong> Denis Lucian &middot; <strong>Fecha:</strong> 11 de junio de 2026 &middot;
    <strong>Versi&oacute;n:</strong> 1.1<br>
    Proyecto personal de portfolio &middot; Coste total: 0&nbsp;&euro; (herramientas 100% gratuitas)
  </p>
</div>
"""


def main() -> None:
    text = SOURCE.read_text(encoding='utf-8')
    # La cabecera del MD (título + tabla de metadatos) ya está en la portada.
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists'])
    html = (
        '<!doctype html><html lang="es"><head><meta charset="utf-8">'
        f'<title>Temple — Informe técnico</title><style>{CSS}</style></head>'
        f'<body>{COVER}{body}</body></html>'
    )

    with tempfile.TemporaryDirectory() as tmp:
        html_path = pathlib.Path(tmp) / 'informe.html'
        html_path.write_text(html, encoding='utf-8')
        subprocess.run(
            [
                CHROME,
                '--headless',
                '--disable-gpu',
                '--no-pdf-header-footer',
                f'--print-to-pdf={TARGET}',
                html_path.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
    print(f'PDF generado: {TARGET} ({TARGET.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()

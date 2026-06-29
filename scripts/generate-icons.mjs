// Genera los iconos PWA de TMPL desde el monograma T+L (vector, nítido a
// cualquier tamaño). Reemplaza al antiguo generate-icons.py (mancuerna).
// Uso: npm i -D sharp && node scripts/generate-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BG = '#14161a'; // gris hierro
const MARK = '#f97316'; // brasa

// Monograma T+L en trazo continuo con serifas (mismo diseño que el logo elegido).
function mark(color) {
  return (
    `<g fill="none" stroke="${color}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">` +
    '<path d="M30 41 V31 H70 V41"/>' +
    '<path d="M50 31 V71"/>' +
    '<path d="M42 51 H58"/>' +
    '<path d="M44 71 H67 V61"/>' +
    '</g>'
  );
}

function iconSVG(size, rounded, scale) {
  const rx = rounded ? 18 : 0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" rx="${rx}" fill="${BG}"/>` +
    `<g transform="translate(50 51) scale(${scale}) translate(-50 -51)">${mark(MARK)}</g>` +
    '</svg>'
  );
}

const targets = [
  { file: 'pwa-192.png', size: 192, rounded: true, scale: 1.5 },
  { file: 'pwa-512.png', size: 512, rounded: true, scale: 1.5 },
  { file: 'pwa-maskable-512.png', size: 512, rounded: false, scale: 1.3 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 1.42 },
  { file: 'favicon-64.png', size: 64, rounded: true, scale: 1.6 },
];

for (const t of targets) {
  const svg = iconSVG(t.size, t.rounded, t.scale);
  await sharp(Buffer.from(svg)).png().toFile(join(out, t.file));
  console.log('✓', t.file);
}
console.log('Iconos generados en /public. El favicon.ico lo hace scripts/favicon.py desde favicon-64.png.');

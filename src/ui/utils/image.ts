// CAPA 3 · Interfaz — Compresión de imágenes en el dispositivo (canvas).
// Las fotos de la comunidad se redimensionan y recomprimen a JPEG antes de
// guardarse como dataURL: nada se sube, y ocupan poco en IndexedDB.

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

/**
 * Redimensiona a `maxDim` px el lado mayor y recomprime a JPEG. Devuelve un
 * dataURL listo para guardar. Si algo falla, devuelve el original.
 */
export async function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<string> {
  try {
    const original = await readAsDataURL(file);
    const img = await loadImage(original);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return '';
  }
}

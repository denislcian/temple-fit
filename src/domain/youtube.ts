// CAPA 2 · Dominio — Vídeos de YouTube en recetas.
// Solo extraemos el id del vídeo; el embed (youtube-nocookie) se carga BAJO
// DEMANDA con un clic, para no contactar con terceros al abrir la app.

/** Id del vídeo si la URL es de YouTube (watch, youtu.be, shorts, embed). */
export function parseYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([\w-]{6,20})/i,
    /youtu\.be\/([\w-]{6,20})/i,
    /(?:youtube\.com|youtube-nocookie\.com)\/(?:shorts|embed)\/([\w-]{6,20})/i,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1]!;
  }
  return null;
}

/** URL de embed con la variante de privacidad (sin cookies hasta reproducir). */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

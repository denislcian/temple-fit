import { describe, expect, it } from 'vitest';
import { parseYouTubeId, youTubeEmbedUrl } from './youtube';

describe('vídeos de YouTube en recetas', () => {
  it('extrae el id de las formas habituales de URL', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rechaza URLs que no son de YouTube', () => {
    expect(parseYouTubeId('https://vimeo.com/12345')).toBeNull();
    expect(parseYouTubeId('no es una url')).toBeNull();
    expect(parseYouTubeId('')).toBeNull();
  });

  it('el embed usa la variante sin cookies', () => {
    expect(youTubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});

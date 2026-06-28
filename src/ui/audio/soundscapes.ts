// CAPA 3 · Interfaz — Reproductor de música para dormir. Pistas propias (MP3)
// servidas bajo demanda y cacheadas para offline; el volumen y el temporizador
// de apagado se controlan por la Web Audio API (un master con fundidos).
//
// El AudioContext se crea de forma perezosa al primer play (los navegadores
// exigen un gesto del usuario para arrancar audio) — así la vista se renderiza
// sin tocar audio (y los tests en jsdom no fallan).

export interface MusicTrack {
  id: string;
  label: string;
  file: string;
}

// Pistas reales de relajación (servidas bajo demanda y cacheadas para offline).
export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'celestial-drift', label: 'Celestial Drift', file: 'celestial-drift.mp3' },
  { id: 'soft-ocean-breeze', label: 'Soft Ocean Breeze', file: 'soft-ocean-breeze.mp3' },
  { id: 'soft-static', label: 'Soft Static', file: 'soft-static.mp3' },
  { id: 'softly-slowly', label: 'Softly, Slowly', file: 'softly-slowly.mp3' },
  { id: 'softly-the-night-unfolds', label: 'Softly, the Night Unfolds', file: 'softly-the-night-unfolds.mp3' },
];

/** URL de una pista respetando el base de despliegue (subruta de GitHub Pages). */
export function trackUrl(file: string): string {
  return `${import.meta.env.BASE_URL}music/${file}`;
}

/** Reproduce una vez un timbre de alarma suave (3 notas ascendentes). */
export function playAlarmChime(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  const ctx = new AudioContext();
  const notes = [523.25, 659.25, 783.99]; // do, mi, sol
  const t0 = ctx.currentTime + 0.02;
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = t0 + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
  setTimeout(() => void ctx.close(), 1200);
}

/**
 * Reproductor de música para dormir. Una sola instancia por vista; reproduce una
 * pista a la vez con fundidos suaves y un temporizador opcional de apagado. El
 * volumen pasa por un nodo master para poder bajarlo gradualmente.
 */
export class SoundscapePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private fadeTimer: ReturnType<typeof setTimeout> | undefined;
  private _volume = 0.6;
  current: string | null = null;

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window;
  }

  private ensureContext(): AudioContext | null {
    if (!this.isSupported) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private fadeMasterIn(ctx: AudioContext): void {
    if (!this.master) return;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this._volume, ctx.currentTime + 0.4);
  }

  private pauseTrack(): void {
    this.audioEl?.pause();
  }

  /** Reproduce (o cambia a) una pista de audio, con un breve fundido de entrada. */
  playTrack(id: string, url: string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    clearTimeout(this.fadeTimer);
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.loop = true;
      this.audioEl.preload = 'auto';
      // createMediaElementSource solo se puede llamar una vez por elemento.
      this.mediaNode = ctx.createMediaElementSource(this.audioEl);
      this.mediaNode.connect(this.master);
    }
    if (!this.audioEl.src.endsWith(url)) this.audioEl.src = url;
    void this.audioEl.play();
    this.current = id;
    this.fadeMasterIn(ctx);
  }

  /** Para con un fundido de salida suave. */
  stop(): void {
    clearTimeout(this.fadeTimer);
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => this.pauseTrack(), 420);
    this.current = null;
  }

  setVolume(v: number): void {
    this._volume = Math.min(1, Math.max(0, v));
    if (this.ctx && this.master) {
      this.master.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 0.1);
    }
  }

  get volume(): number {
    return this._volume;
  }

  /** Temporizador de apagado: baja el volumen a 0 a lo largo de `minutes`. */
  setSleepTimer(minutes: number, onDone: () => void): void {
    clearTimeout(this.fadeTimer);
    if (!this.ctx || !this.master || minutes <= 0) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this._volume, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + minutes * 60);
    this.fadeTimer = setTimeout(
      () => {
        this.stop();
        onDone();
      },
      minutes * 60 * 1000,
    );
  }

  cancelSleepTimer(): void {
    clearTimeout(this.fadeTimer);
    if (this.ctx && this.master) {
      this.master.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 0.2);
    }
  }

  /** Libera el contexto (al desmontar la vista). */
  dispose(): void {
    clearTimeout(this.fadeTimer);
    this.audioEl?.pause();
    this.audioEl = null;
    this.mediaNode = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}

// CAPA 3 · Interfaz — Paisajes sonoros procedurales con la Web Audio API.
// Cero ficheros de audio: el ruido se genera en el dispositivo, suena infinito
// y ocupa 0 KB. Encaja con el ADN local-first/offline/0€ de la app.
//
// El AudioContext se crea de forma perezosa al primer play (los navegadores
// exigen un gesto del usuario para arrancar audio) — así la vista se renderiza
// sin tocar audio (y los tests en jsdom no fallan).

export interface Soundscape {
  id: string;
  label: string;
  /** Icono Tabler-like (emoji) solo para la tarjeta. */
  hint: string;
  description: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: 'lluvia', label: 'Lluvia', hint: '🌧️', description: 'Lluvia constante y envolvente.' },
  { id: 'olas', label: 'Olas del mar', hint: '🌊', description: 'Vaivén lento de las olas.' },
  { id: 'marron', label: 'Ruido marrón', hint: '🟤', description: 'Grave y profundo, ideal para dormir.' },
  { id: 'rosa', label: 'Ruido rosa', hint: '🎚️', description: 'Equilibrado, enmascara ruidos.' },
  { id: 'viento', label: 'Viento', hint: '🍃', description: 'Brisa suave entre los árboles.' },
];

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

type NoiseType = 'white' | 'pink' | 'brown';

/** Genera 4 s de ruido en un buffer apto para reproducir en bucle. */
function makeNoiseBuffer(ctx: AudioContext, type: NoiseType): AudioBuffer {
  const seconds = 4;
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'pink') {
    // Filtro de Paul Kellet (aproximación de ruido rosa).
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    // Ruido marrón: integración del blanco (graves dominantes).
    let last = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

interface Voice {
  source: AudioBufferSourceNode;
  nodes: AudioNode[];
  lfo?: OscillatorNode;
}

/**
 * Reproductor de paisajes sonoros. Una sola instancia por vista; reproduce un
 * paisaje a la vez con fundidos suaves y un temporizador opcional de apagado.
 */
export class SoundscapePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voice: Voice | null = null;
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

  /** Reproduce una pista de audio (archivo) por el mismo master que los sonidos. */
  playTrack(id: string, url: string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    clearTimeout(this.fadeTimer);
    this.stopVoice(0.1);
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

  /** Arranca (o cambia a) un paisaje, con un breve fundido de entrada. */
  play(id: string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    clearTimeout(this.fadeTimer);
    this.pauseTrack();
    this.stopVoice(0.15);

    const voice = this.buildVoice(ctx, id);
    if (!voice) return;
    voice.source.start();
    this.voice = voice;
    this.current = id;

    // Fundido de entrada del master por si venía de silencio.
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this._volume, ctx.currentTime + 0.4);
  }

  private buildVoice(ctx: AudioContext, id: string): Voice | null {
    const source = ctx.createBufferSource();
    source.loop = true;
    const nodes: AudioNode[] = [];
    let lfo: OscillatorNode | undefined;
    let tail: AudioNode;

    if (id === 'lluvia') {
      source.buffer = makeNoiseBuffer(ctx, 'pink');
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 8000;
      source.connect(hp).connect(lp);
      nodes.push(hp, lp);
      tail = lp;
    } else if (id === 'olas') {
      source.buffer = makeNoiseBuffer(ctx, 'brown');
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      const swellGain = ctx.createGain();
      swellGain.gain.value = 0.6;
      // LFO lento que hace "respirar" el volumen como el vaivén del mar.
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(swellGain.gain);
      lfo.start();
      source.connect(lp).connect(swellGain);
      nodes.push(lp, swellGain, lfoGain);
      tail = swellGain;
    } else if (id === 'viento') {
      source.buffer = makeNoiseBuffer(ctx, 'pink');
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 500;
      bp.Q.value = 0.7;
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain).connect(bp.frequency);
      lfo.start();
      source.connect(bp);
      nodes.push(bp, lfoGain);
      tail = bp;
    } else if (id === 'rosa') {
      source.buffer = makeNoiseBuffer(ctx, 'pink');
      tail = source;
    } else if (id === 'marron') {
      source.buffer = makeNoiseBuffer(ctx, 'brown');
      tail = source;
    } else {
      return null;
    }

    tail.connect(this.master!);
    return { source, nodes, ...(lfo ? { lfo } : {}) };
  }

  private stopVoice(fade = 0.25): void {
    const v = this.voice;
    const ctx = this.ctx;
    if (!v || !ctx || !this.master) return;
    this.voice = null;
    this.current = null;
    try {
      v.source.stop(ctx.currentTime + fade + 0.05);
      v.lfo?.stop(ctx.currentTime + fade + 0.05);
    } catch {
      /* ya parado */
    }
    setTimeout(
      () => {
        try {
          v.source.disconnect();
          v.lfo?.disconnect();
          v.nodes.forEach((n) => n.disconnect());
        } catch {
          /* noop */
        }
      },
      (fade + 0.1) * 1000,
    );
  }

  /** Para con un fundido de salida suave. */
  stop(): void {
    clearTimeout(this.fadeTimer);
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    this.stopVoice(0.4);
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
    this.stopVoice(0);
    this.audioEl?.pause();
    this.audioEl = null;
    this.mediaNode = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}

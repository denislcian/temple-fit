// CAPA 3 · Interfaz — Seguimiento del sueño con el micrófono.
// El audio se analiza EN VIVO en el dispositivo (AnalyserNode). De los eventos
// más sonoros se guarda un clip corto (MediaRecorder) para poder OÍRLOS; el
// resto del audio nunca se almacena ni se sube. Privacidad por diseño.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoiseEvent, SleepSession } from '../../data/sleepModels';
import { classifyNoise } from '../../domain/sleepAnalysis';

type Phase = 'idle' | 'tracking' | 'error';

interface Detector {
  inEvent: boolean;
  startMs: number;
  peak: number;
  lowSum: number;
  lowCount: number;
  belowSince: number;
  baseline: number;
}

const TICK_MS = 120;
const HANGOVER_MS = 450;
const MIN_EVENT_MS = 300;
const MIN_PEAK = 16;
const DELTA = 14;
// Clips de los eventos más sonoros.
const CLIP_MS = 6000;
const MAX_CLIPS = 6;
const CLIP_ONSET_MIN = 30;

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return '';
}

export function useSleepTracker(onAlarm: () => void) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [events, setEvents] = useState<NoiseEvent[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startRef = useRef(0);
  const levelsRef = useRef<number[]>([]);
  const eventsRef = useRef<NoiseEvent[]>([]);
  const alarmRef = useRef<{ at: number; fired: boolean } | null>(null);
  const onAlarmRef = useRef(onAlarm);
  onAlarmRef.current = onAlarm;
  const det = useRef<Detector>({
    inEvent: false,
    startMs: 0,
    peak: 0,
    lowSum: 0,
    lowCount: 0,
    belowSince: 0,
    baseline: 8,
  });
  // Grabación de clips.
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pendingClips = useRef<Map<number, Blob>>(new Map());
  const clipBudget = useRef(0);

  const attachPending = useCallback(() => {
    let changed = false;
    for (const [atMs, blob] of pendingClips.current) {
      const ev = eventsRef.current.find((e) => e.atMs === atMs);
      if (ev) {
        ev.clip = blob;
        pendingClips.current.delete(atMs);
        changed = true;
      }
    }
    // Conserva solo los MAX_CLIPS más sonoros.
    const withClip = eventsRef.current.filter((e) => e.clip);
    if (withClip.length > MAX_CLIPS) {
      withClip
        .sort((a, b) => a.peak - b.peak)
        .slice(0, withClip.length - MAX_CLIPS)
        .forEach((e) => {
          delete e.clip;
        });
      changed = true;
    }
    if (changed) setEvents([...eventsRef.current]);
  }, []);

  const startClip = useCallback(
    (eventStartMs: number) => {
      const stream = streamRef.current;
      const mime = pickMime();
      if (!stream || !mime || recorderRef.current || clipBudget.current <= 0) return;
      try {
        const chunks: Blob[] = [];
        const rec = new MediaRecorder(stream, { mimeType: mime });
        rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        rec.onstop = () => {
          recorderRef.current = null;
          if (chunks.length) {
            pendingClips.current.set(eventStartMs, new Blob(chunks, { type: mime }));
            attachPending();
          }
        };
        recorderRef.current = rec;
        clipBudget.current -= 1;
        rec.start();
        setTimeout(() => rec.state !== 'inactive' && rec.stop(), CLIP_MS);
      } catch {
        recorderRef.current = null;
      }
    },
    [attachPending],
  );

  const cleanup = useCallback(() => {
    clearInterval(rafRef.current);
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch {
      /* noop */
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(
    async (alarmAtMs: number | null) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tu navegador no permite usar el micrófono.');
        setPhase('error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const bins = analyser.frequencyBinCount;
        const data = new Uint8Array(bins);
        const lowBins = Math.max(8, Math.floor(bins / 32));

        startRef.current = Date.now();
        levelsRef.current = [];
        eventsRef.current = [];
        pendingClips.current.clear();
        clipBudget.current = MAX_CLIPS * 2; // se graban algunos de más; se queda con los más fuertes
        det.current = {
          inEvent: false,
          startMs: 0,
          peak: 0,
          lowSum: 0,
          lowCount: 0,
          belowSince: 0,
          baseline: 8,
        };
        alarmRef.current = alarmAtMs ? { at: alarmAtMs, fired: false } : null;
        setEvents([]);
        setPhase('tracking');

        rafRef.current = setInterval(() => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          let low = 0;
          for (let i = 0; i < bins; i++) {
            sum += data[i]!;
            if (i < lowBins) low += data[i]!;
          }
          const lvl = Math.min(100, Math.round((sum / bins / 255) * 220));
          const lowRatio = sum > 0 ? low / sum : 0;
          setLevel(lvl);

          const now = Date.now();
          const elapsed = now - startRef.current;
          setElapsedMs(elapsed);
          const min = Math.floor(elapsed / 60000);
          levelsRef.current[min] = Math.max(levelsRef.current[min] ?? 0, lvl);

          const d = det.current;
          const threshold = Math.max(MIN_PEAK, d.baseline + DELTA);
          if (lvl >= threshold) {
            if (!d.inEvent) {
              d.inEvent = true;
              d.startMs = elapsed;
              d.peak = lvl;
              d.lowSum = lowRatio;
              d.lowCount = 1;
              if (lvl >= CLIP_ONSET_MIN) startClip(elapsed);
            } else {
              d.peak = Math.max(d.peak, lvl);
              d.lowSum += lowRatio;
              d.lowCount += 1;
            }
            d.belowSince = 0;
          } else if (d.inEvent) {
            if (d.belowSince === 0) d.belowSince = now;
            if (now - d.belowSince >= HANGOVER_MS) {
              const durationMs = elapsed - d.startMs - HANGOVER_MS;
              if (durationMs >= MIN_EVENT_MS && d.peak >= MIN_PEAK) {
                const ev: NoiseEvent = {
                  atMs: d.startMs,
                  durationMs,
                  peak: d.peak,
                  kind: classifyNoise(durationMs, d.lowSum / Math.max(1, d.lowCount)),
                };
                eventsRef.current.push(ev);
                attachPending();
                setEvents([...eventsRef.current]);
              }
              d.inEvent = false;
              d.peak = 0;
            }
          } else {
            d.baseline = d.baseline * 0.98 + lvl * 0.02;
          }

          const a = alarmRef.current;
          if (a && !a.fired && now >= a.at) {
            a.fired = true;
            onAlarmRef.current();
          }
        }, TICK_MS);
      } catch {
        setError('No se pudo acceder al micrófono. Concede el permiso para hacer seguimiento.');
        setPhase('error');
      }
    },
    [startClip, attachPending],
  );

  const stop = useCallback((): SleepSession | null => {
    if (phase !== 'tracking') {
      cleanup();
      setPhase('idle');
      return null;
    }
    cleanup();
    const endedAt = Date.now();
    const startedAt = startRef.current;
    const durationMin = Math.max(0, Math.round((endedAt - startedAt) / 60000));
    const evs = eventsRef.current;
    const snoreCount = evs.filter((e) => e.kind === 'ronquido').length;
    const session: SleepSession = {
      id: '',
      date: new Date(startedAt).toISOString().slice(0, 10),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationMin,
      levels: levelsRef.current.map((l) => l ?? 0),
      events: evs,
      snoreCount,
      noiseCount: evs.length - snoreCount,
    };
    setPhase('idle');
    setLevel(0);
    return session;
  }, [phase, cleanup]);

  return { phase, error, level, elapsedMs, events, start, stop };
}

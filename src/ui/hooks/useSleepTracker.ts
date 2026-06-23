// CAPA 3 · Interfaz — Seguimiento del sueño con el micrófono.
// El audio se analiza EN VIVO en el dispositivo (AnalyserNode) y NO se guarda ni
// se sube: solo quedan los eventos detectados (instante, duración, intensidad,
// tipo) y la curva de ruido por minuto. Privacidad por diseño.
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
const HANGOVER_MS = 450; // silencio para cerrar un evento
const MIN_EVENT_MS = 300;
const MIN_PEAK = 16;
const DELTA = 14; // por encima del ruido de fondo

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

  const cleanup = useCallback(() => {
    clearInterval(rafRef.current);
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
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        const bins = analyser.frequencyBinCount;
        const data = new Uint8Array(bins);
        const lowBins = Math.max(8, Math.floor(bins / 32)); // ~bajas frecuencias

        startRef.current = Date.now();
        levelsRef.current = [];
        eventsRef.current = [];
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
          const avg = sum / bins; // 0-255
          const lvl = Math.min(100, Math.round((avg / 255) * 220));
          const lowRatio = sum > 0 ? low / sum : 0;
          setLevel(lvl);

          const now = Date.now();
          const elapsed = now - startRef.current;
          setElapsedMs(elapsed);

          // Curva por minuto (máximo).
          const min = Math.floor(elapsed / 60000);
          levelsRef.current[min] = Math.max(levelsRef.current[min] ?? 0, lvl);

          // Detección de eventos.
          const d = det.current;
          const threshold = Math.max(MIN_PEAK, d.baseline + DELTA);
          if (lvl >= threshold) {
            if (!d.inEvent) {
              d.inEvent = true;
              d.startMs = elapsed;
              d.peak = lvl;
              d.lowSum = lowRatio;
              d.lowCount = 1;
            } else {
              d.peak = Math.max(d.peak, lvl);
              d.lowSum += lowRatio;
              d.lowCount += 1;
            }
            d.belowSince = 0;
          } else {
            if (d.inEvent) {
              if (d.belowSince === 0) d.belowSince = now;
              if (now - d.belowSince >= HANGOVER_MS) {
                const durationMs = elapsed - d.startMs - HANGOVER_MS;
                if (durationMs >= MIN_EVENT_MS && d.peak >= MIN_PEAK) {
                  const lowAvg = d.lowSum / Math.max(1, d.lowCount);
                  const ev: NoiseEvent = {
                    atMs: d.startMs,
                    durationMs,
                    peak: d.peak,
                    kind: classifyNoise(durationMs, lowAvg),
                  };
                  eventsRef.current.push(ev);
                  setEvents([...eventsRef.current]);
                }
                d.inEvent = false;
                d.peak = 0;
              }
            } else {
              // Actualiza el ruido de fondo solo en silencio.
              d.baseline = d.baseline * 0.98 + lvl * 0.02;
            }
          }

          // Alarma.
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
    [],
  );

  /** Detiene y devuelve la sesión construida (el llamador la guarda). */
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

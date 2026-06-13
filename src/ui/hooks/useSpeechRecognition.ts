// CAPA 3 · Interfaz — Reconocimiento de voz (Web Speech API, gratuito).
// Mejora progresiva: si el navegador no lo soporta, `supported` es false y
// la UI oculta el botón de voz. Usado para "describe lo que comiste" sin
// teclear (estilo Cal AI), pero sin coste ni dependencia externa.
import { useCallback, useEffect, useRef, useState } from 'react';

// Tipos mínimos de la Web Speech API (no están en lib.dom estándar).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(onTranscript: (text: string) => void): {
  supported: boolean;
  listening: boolean;
  toggle: () => void;
} {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = getCtor() !== null;

  // Mantener la última versión del callback sin recrear el reconocimiento.
  const callbackRef = useRef(onTranscript);
  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, i) =>
        event.results[i]?.[0]?.transcript ?? '',
      )
        .join(' ')
        .trim();
      if (transcript) callbackRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  return { supported, listening, toggle };
}

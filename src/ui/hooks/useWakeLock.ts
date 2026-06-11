// CAPA 3 · Interfaz — Pantalla siempre encendida durante el entrenamiento.
// En el gimnasio el móvil se bloquea entre series; la Wake Lock API lo evita
// mientras hay un entrenamiento en curso. Mejora progresiva: si el navegador
// no la soporta, no pasa nada.
import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

interface NavigatorWakeLock {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

export function useWakeLock(active: boolean): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const wakeLock = (navigator as NavigatorWakeLock).wakeLock;
    if (!active || !wakeLock) {
      setHeld(false);
      return;
    }

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        setHeld(true);
        sentinel.addEventListener('release', () => setHeld(false));
      } catch {
        // Denegado (ahorro de batería, etc.): la app sigue funcionando.
        setHeld(false);
      }
    };

    // El sistema libera el lock al cambiar de pestaña: se vuelve a pedir.
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
      setHeld(false);
    };
  }, [active]);

  return held;
}

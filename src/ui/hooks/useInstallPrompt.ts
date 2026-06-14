// CAPA 3 · Interfaz — Instalación de la PWA.
// Captura el evento beforeinstallprompt (Chrome/Edge/Android) para ofrecer un
// botón de instalación propio. En iOS Safari ese evento no existe: se detecta
// para mostrar las instrucciones manuales ("Compartir → Añadir a inicio").
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'instalable' | 'ios' | 'instalada' | 'no-disponible';

export function useInstallPrompt(): {
  state: InstallState;
  promptInstall: () => Promise<void>;
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // ¿Ya está instalada / abierta como app independiente?
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  let state: InstallState;
  if (installed || isStandalone) state = 'instalada';
  else if (deferred) state = 'instalable';
  else if (isIos) state = 'ios';
  else state = 'no-disponible';

  async function promptInstall(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return { state, promptInstall };
}

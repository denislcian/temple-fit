// CAPA 3 · Interfaz — Región viva para anunciar cambios a lectores de pantalla
// (cambios de vista, series guardadas, récords...). WCAG 4.1.3 Status Messages.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const AnnouncerContext = createContext<(message: string) => void>(() => {});

export function useAnnounce(): (message: string) => void {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback((text: string) => {
    // Vaciar y rellenar garantiza que el lector anuncie mensajes repetidos.
    setMessage('');
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setMessage(text), 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div aria-live="polite" role="status" className="visually-hidden">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

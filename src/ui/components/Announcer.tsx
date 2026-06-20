// CAPA 3 · Interfaz — Región viva para anunciar cambios a lectores de pantalla
// (cambios de vista, series guardadas, récords...). WCAG 4.1.3 Status Messages.
//
// Cola FIFO: si dos mensajes se emiten casi a la vez (p. ej. una confirmación
// de acción seguida del anuncio de navegación), se anuncian AMBOS en orden, en
// lugar de que el segundo pise al primero.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const AnnouncerContext = createContext<(message: string) => void>(() => {});

export function useAnnounce(): (message: string) => void {
  return useContext(AnnouncerContext);
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const queue = useRef<string[]>([]);
  const processing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const processNext = useCallback(() => {
    const next = queue.current.shift();
    if (next === undefined) {
      processing.current = false;
      return;
    }
    processing.current = true;
    // Vaciar y rellenar garantiza que el lector anuncie también mensajes
    // repetidos o consecutivos (un cambio de texto real en la región viva).
    setMessage('');
    timer.current = setTimeout(() => {
      setMessage(next);
      // Hueco antes del siguiente para que al lector le dé tiempo a leerlo.
      timer.current = setTimeout(processNext, 900);
    }, 60);
  }, []);

  const announce = useCallback(
    (text: string) => {
      queue.current.push(text);
      if (!processing.current) processNext();
    },
    [processNext],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div aria-live="polite" role="status" className="visually-hidden">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

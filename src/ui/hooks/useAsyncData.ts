// CAPA 3 · Interfaz — Carga de datos asíncronos desde los repositorios.
import { useCallback, useEffect, useState } from 'react';

export function useAsyncData<T>(load: () => Promise<T>): {
  data: T | undefined;
  reload: () => Promise<void>;
} {
  const [data, setData] = useState<T>();

  const reload = useCallback(async () => {
    setData(await load());
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    load().then((value) => {
      if (!cancelled) setData(value);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { data, reload };
}

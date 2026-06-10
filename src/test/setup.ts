// Configuración global de los tests (Vitest + jsdom).
import '@testing-library/jest-dom/vitest';
// IndexedDB simulada en memoria para testear los repositorios (Capa 1) sin navegador.
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sin globals de Vitest, la limpieza automática de Testing Library no se
// activa: la registramos explícitamente para aislar cada test.
afterEach(() => {
  cleanup();
});

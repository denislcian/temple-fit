// Configuración global de los tests (Vitest + jsdom).
import '@testing-library/jest-dom/vitest';
// IndexedDB simulada en memoria para testear los repositorios (Capa 1) sin navegador.
import 'fake-indexeddb/auto';

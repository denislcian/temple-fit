// CAPA 3 · Interfaz — Auditoría axe automática de TODAS las vistas.
// Complementa el test puntual de "Entrenar" (App.test.tsx): navega a cada ruta
// y comprueba que no hay violaciones detectables por axe. Es la red de
// seguridad del sello WCAG 2.2 AA cada vez que cambia la interfaz.
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { markOnboarded } from '../data/profile';
import { resetDb } from '../test/dbTestUtils';
import { App } from './App';

const VIEWS: Array<{ hash: string; heading: RegExp }> = [
  { hash: '#/entrenar', heading: /^entrenar$/i },
  { hash: '#/nutricion', heading: /^nutrición$/i },
  { hash: '#/social', heading: /^comunidad$/i },
  { hash: '#/progreso', heading: /^progreso$/i },
  { hash: '#/historial', heading: /^historial$/i },
  { hash: '#/rutinas', heading: /^rutinas$/i },
  { hash: '#/ejercicios', heading: /^ejercicios$/i },
  { hash: '#/herramientas', heading: /^herramientas$/i },
  { hash: '#/descanso', heading: /^descanso$/i },
  { hash: '#/ajustes', heading: /^ajustes$/i },
  { hash: '#/mas', heading: /^más$/i },
];

describe('Accesibilidad por vista (axe)', () => {
  beforeEach(async () => {
    await resetDb();
    localStorage.clear();
    // Se audita la app ya en uso, no la bienvenida del primer arranque.
    markOnboarded();
  });

  it.each(VIEWS)('la vista $hash no tiene violaciones axe', async ({ hash, heading }) => {
    window.location.hash = hash;
    const { container } = render(<App />);
    // findBy reintenta: cubre el sembrado de catálogos y la carga diferida de
    // Progreso (Suspense/lazy).
    await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 4000 });

    const results = await axe.run(container, {
      rules: {
        // El contraste no es medible en jsdom (sin motor de render); se audita
        // en navegador real con Lighthouse/axe DevTools.
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});

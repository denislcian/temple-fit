import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../test/dbTestUtils';
import { App } from './App';

describe('App', () => {
  beforeEach(async () => {
    await resetDb();
    window.location.hash = '';
    localStorage.clear();
  });

  it('muestra la vista Entrenar por defecto con el catálogo sembrado', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { level: 1, name: /entrenar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrenamiento libre/i })).toBeInTheDocument();
  });

  it('tiene navegación principal con las 6 vistas y skip link', async () => {
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: /entrenar/i });

    const nav = screen.getByRole('navigation', { name: /principal/i });
    expect(nav).toBeInTheDocument();
    for (const label of ['Entrenar', 'Historial', 'Rutinas', 'Ejercicios', 'Progreso', 'Ajustes']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad detectables por axe (vista Entrenar)', async () => {
    const { container } = render(<App />);
    await screen.findByRole('heading', { level: 1, name: /entrenar/i });

    const results = await axe.run(container, {
      rules: {
        // El contraste de color no es medible en jsdom (sin motor de render);
        // se audita en navegador real con Lighthouse/axe DevTools (Capa 4).
        'color-contrast': { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});

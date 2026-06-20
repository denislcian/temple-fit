// CAPA 3 · Interfaz — Pruebas del home de "Entrenar": panel resumen con
// historial y el indicador global de "entrenamiento en curso".
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { markOnboarded } from '../../data/profile';
import { addSession } from '../../data/repositories/sessionRepo';
import { resetDb } from '../../test/dbTestUtils';
import { App } from '../App';
import { DRAFT_KEY } from './TrainView';

describe('Home de Entrenar', () => {
  beforeEach(async () => {
    await resetDb();
    window.location.hash = '';
    localStorage.clear();
    markOnboarded();
  });

  it('sin historial muestra solo el arranque, sin panel ni última sesión', async () => {
    render(<App />);
    await screen.findByRole('heading', { level: 2, name: /empezar entrenamiento/i });
    expect(screen.queryByRole('heading', { name: /tu última sesión/i })).not.toBeInTheDocument();
  });

  it('con historial muestra el panel resumen y la última sesión', async () => {
    await addSession({
      date: '2026-06-15T10:00:00.000Z',
      entries: [{ exerciseId: 'press-banca', sets: [{ reps: 8, weightKg: 60, done: true }] }],
      durationMin: 45,
    });

    render(<App />);
    // La tarjeta de última sesión solo aparece cuando hay historial cargado.
    expect(await screen.findByRole('heading', { name: /tu última sesión/i })).toBeInTheDocument();
    // El panel resumen incluye la estadística de volumen de la semana.
    expect(screen.getByText(/kg movidos esta semana/i)).toBeInTheDocument();
  });

  it('al navegar fuera con un entrenamiento a medias muestra el indicador de sesión en curso', async () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ startedAt: '2026-06-20T10:00:00.000Z', entries: [] }),
    );
    window.location.hash = '#/nutricion';

    render(<App />);
    const banner = await screen.findByRole('link', { name: /entrenamiento en curso/i });
    expect(banner).toHaveAttribute('href', '#/entrenar');
  });

  it('en la propia vista Entrenar no se muestra el indicador (ya estás ahí)', async () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ startedAt: '2026-06-20T10:00:00.000Z', entries: [] }),
    );
    window.location.hash = '#/entrenar';

    render(<App />);
    await screen.findByRole('heading', { level: 1, name: /entrenar/i });
    expect(screen.queryByRole('link', { name: /entrenamiento en curso/i })).not.toBeInTheDocument();
  });
});

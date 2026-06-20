// CAPA 3 · Interfaz — Pruebas de la vista Historial: resumen de cabecera y
// agrupación de sesiones por mes.
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { markOnboarded } from '../../data/profile';
import { addSession } from '../../data/repositories/sessionRepo';
import { resetDb } from '../../test/dbTestUtils';
import { App } from '../App';

function makeSession(date: string, weightKg: number) {
  return {
    date,
    entries: [{ exerciseId: 'press-banca', sets: [{ reps: 8, weightKg, done: true }] }],
    durationMin: 40,
  };
}

describe('HistoryView', () => {
  beforeEach(async () => {
    await resetDb();
    window.location.hash = '#/historial';
    localStorage.clear();
    markOnboarded();
  });

  it('agrupa las sesiones por mes con subcabeceras', async () => {
    await addSession(makeSession('2026-06-15T10:00:00.000Z', 60));
    await addSession(makeSession('2026-05-03T10:00:00.000Z', 55));

    render(<App />);
    // Exacto: la fecha completa del h3 ("15 de junio de 2026") también contiene
    // "junio de 2026"; solo nos interesa la subcabecera de mes.
    expect(await screen.findByRole('heading', { name: /^junio de 2026$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^mayo de 2026$/i })).toBeInTheDocument();
  });

  it('muestra el resumen de cabecera con totales del historial', async () => {
    await addSession(makeSession('2026-06-15T10:00:00.000Z', 60));

    render(<App />);
    // El resumen depende de la carga async de sesiones: esperarlo.
    expect(await screen.findByText(/kg movidos en total/i)).toBeInTheDocument();
    // 1 sesión → etiqueta de la estadística en singular (no el rótulo de nav).
    expect(
      screen.getByText('entrenamiento en total', { selector: '.stat .label' }),
    ).toBeInTheDocument();
  });

  it('sin sesiones muestra el estado vacío con CTA a Entrenar', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /aún no hay historial/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /empezar a entrenar/i })).toBeInTheDocument();
  });

  it('"Repetir" precarga un borrador desde la sesión y lleva a Entrenar', async () => {
    await addSession({
      date: '2026-06-15T10:00:00.000Z',
      entries: [{ exerciseId: 'press-banca', sets: [{ reps: 8, weightKg: 60, done: true }] }],
      durationMin: 40,
    });

    render(<App />);
    const repeat = await screen.findByRole('button', { name: /repetir/i });
    fireEvent.click(repeat);

    // Se crea el borrador con los datos de la sesión y se navega a Entrenar.
    const draft = JSON.parse(localStorage.getItem('forjafit-draft') ?? '{}');
    expect(draft.entries).toHaveLength(1);
    expect(draft.entries[0].exerciseId).toBe('press-banca');
    expect(draft.entries[0].sets[0]).toMatchObject({ reps: '8', weight: '60', done: false });
    expect(window.location.hash).toBe('#/entrenar');
  });
});

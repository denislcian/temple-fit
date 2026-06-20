// CAPA 3 · Interfaz — Pruebas de la vista Herramientas (calculadoras).
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { markOnboarded } from '../../data/profile';
import { resetDb } from '../../test/dbTestUtils';
import { App } from '../App';

describe('ToolsView', () => {
  beforeEach(async () => {
    await resetDb();
    window.location.hash = '#/herramientas';
    localStorage.clear();
    markOnboarded();
  });

  it('calcula el 1RM estimado a partir de peso y repeticiones', async () => {
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: /herramientas/i });

    // 100 kg × 5 reps → media de Epley (116,7) y Brzycki (112,5) = 114,6 kg.
    fireEvent.change(screen.getByLabelText(/^Peso \(kg\)$/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/^Repeticiones$/i), { target: { value: '5' } });

    expect(screen.getByText(/1RM estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/114,6 kg/)).toBeInTheDocument();
  });

  it('no calcula con repeticiones fuera de rango (≥ 37)', async () => {
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: /herramientas/i });

    fireEvent.change(screen.getByLabelText(/^Peso \(kg\)$/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/^Repeticiones$/i), { target: { value: '40' } });

    expect(screen.queryByText(/1RM estimado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/para estimar tu máximo/i)).toBeInTheDocument();
  });
});

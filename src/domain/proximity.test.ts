import { describe, expect, it } from 'vitest';
import { haversineKm, isNearby, rankByProximity, sameCity } from './proximity';

describe('haversineKm', () => {
  it('da ~0 para el mismo punto', () => {
    expect(haversineKm({ lat: 40.4, lng: -3.7 }, { lat: 40.4, lng: -3.7 })).toBeLessThan(0.01);
  });

  it('Madrid–Barcelona ≈ 500 km', () => {
    const d = haversineKm({ lat: 40.42, lng: -3.7 }, { lat: 41.39, lng: 2.17 });
    expect(d).toBeGreaterThan(450);
    expect(d).toBeLessThan(550);
  });
});

describe('sameCity', () => {
  it('ignora mayúsculas y espacios', () => {
    expect(sameCity(' Madrid ', 'madrid')).toBe(true);
    expect(sameCity('Madrid', 'Barcelona')).toBe(false);
    expect(sameCity(undefined, 'Madrid')).toBe(false);
  });
});

describe('rankByProximity', () => {
  const viewer = { lat: 40.42, lng: -3.7, location: 'Madrid' };

  it('ordena por distancia cuando hay coordenadas', () => {
    const items = [
      { id: 'bcn', lat: 41.39, lng: 2.17 },
      { id: 'alcorcon', lat: 40.35, lng: -3.83 },
      { id: 'valencia', lat: 39.47, lng: -0.38 },
    ];
    expect(rankByProximity(items, viewer).map((x) => x.id)).toEqual(['alcorcon', 'valencia', 'bcn']);
  });

  it('usa la ciudad cuando no hay coordenadas, y es estable en empates', () => {
    const items = [
      { id: 'lejos', location: 'Sevilla' },
      { id: 'cerca', location: 'Madrid' },
      { id: 'sinDato', location: '' },
    ];
    expect(rankByProximity(items, { location: 'Madrid' }).map((x) => x.id)).toEqual([
      'cerca',
      'lejos',
      'sinDato',
    ]);
  });
});

describe('isNearby', () => {
  const viewer = { lat: 40.42, lng: -3.7 };
  it('cerca si <60 km, lejos si más', () => {
    expect(isNearby({ lat: 40.35, lng: -3.83 }, viewer)).toBe(true); // Alcorcón
    expect(isNearby({ lat: 41.39, lng: 2.17 }, viewer)).toBe(false); // Barcelona
  });
  it('misma ciudad cuenta como cerca sin coordenadas', () => {
    expect(isNearby({ location: 'Madrid' }, { location: 'Madrid' })).toBe(true);
  });
});

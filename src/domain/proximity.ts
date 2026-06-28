// CAPA 2 · Dominio — Cercanía entre cuentas para sugerir gente (puro, sin I/O).

export interface Located {
  lat?: number;
  lng?: number;
  location?: string;
}

const EARTH_R_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Distancia en km entre dos coordenadas (fórmula del haversine). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const normCity = (s: string): string => s.trim().toLowerCase();

export function sameCity(a?: string, b?: string): boolean {
  return !!a && !!b && normCity(a) === normCity(b);
}

/** Distancia aproximada (km) de un item al viewer, para ordenar y filtrar:
 *  - coordenadas si ambos las tienen;
 *  - si no, misma ciudad cuenta como "cerca";
 *  - en otro caso, infinito (al final). */
export function proximityScore(item: Located, viewer: Located): number {
  if (viewer.lat != null && viewer.lng != null && item.lat != null && item.lng != null) {
    return haversineKm({ lat: viewer.lat, lng: viewer.lng }, { lat: item.lat, lng: item.lng });
  }
  if (sameCity(viewer.location, item.location)) return 1;
  return Number.POSITIVE_INFINITY;
}

/** Ordena por cercanía al viewer. Estable: los empates conservan su orden. */
export function rankByProximity<T extends Located>(items: T[], viewer: Located): T[] {
  return items
    .map((item, i) => ({ item, i, score: proximityScore(item, viewer) }))
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .map((x) => x.item);
}

/** ¿Sé dónde está el viewer? (ciudad o coordenadas). */
export function hasLocation(viewer: Located): boolean {
  return !!viewer.location || (viewer.lat != null && viewer.lng != null);
}

const NEARBY_KM = 60;
export function isNearby(item: Located, viewer: Located): boolean {
  return proximityScore(item, viewer) <= NEARBY_KM;
}

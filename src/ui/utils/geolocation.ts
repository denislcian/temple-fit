// CAPA 3 · Interfaz — Ubicación del usuario (opt-in, aproximada).
// Pide permiso de geolocalización, redondea las coordenadas (~1 km) por
// privacidad y resuelve la ciudad con un servicio gratuito y sin clave
// (BigDataCloud, endpoint "-client" pensado para el navegador, con CORS).

export interface DetectedLocation {
  city: string;
  lat: number;
  lng: number;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu navegador no permite la geolocalización'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 600_000,
    });
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`,
    );
    if (!res.ok) return '';
    const d = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    return d.city || d.locality || d.principalSubdivision || d.countryName || '';
  } catch {
    return '';
  }
}

/** Mensaje claro según el motivo del fallo de geolocalización. */
function geoErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'code' in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) return 'Permiso de ubicación denegado. Puedes escribir tu ciudad a mano.';
    if (code === 2) return 'No se pudo obtener tu ubicación ahora mismo.';
    if (code === 3) return 'La ubicación tardó demasiado. Inténtalo de nuevo.';
  }
  return err instanceof Error ? err.message : 'No se pudo obtener tu ubicación';
}

export async function detectLocation(): Promise<DetectedLocation> {
  let pos: GeolocationPosition;
  try {
    pos = await getPosition();
  } catch (err) {
    throw new Error(geoErrorMessage(err));
  }
  // Redondeo a 2 decimales ≈ 1,1 km: nunca guardamos tu posición exacta.
  const lat = Math.round(pos.coords.latitude * 100) / 100;
  const lng = Math.round(pos.coords.longitude * 100) / 100;
  const city = await reverseGeocode(lat, lng);
  return { city, lat, lng };
}

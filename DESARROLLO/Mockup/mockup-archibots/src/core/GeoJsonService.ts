/**
 * GeoJsonService.ts — F4.3 · Servicio GeoJSON CDN + caché IndexedDB (Constitución §8)
 *
 * CONST §8: los GeoJSON se sirven desde Firebase Hosting/CDN.
 * - URL base: /geo-data/13_PRC_{Comuna}.json  (requiere H-F4.1: 540 archivos desplegados)
 * - Caché: IndexedDB (persiste entre sesiones), solo la comuna activa en memoria
 * - Fallback desarrollo: intenta cargar Ñuñoa si está disponible localmente
 */

const IDB_GEO_NAME    = 'archibots_geojson';
const IDB_GEO_VERSION = 1;
const GEO_STORE       = 'comunas';

// ── Mapeo de nombre de comuna → nombre de archivo ─────────────────────────────

function normalizeComuna(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // quitar tildes
    .replace(/\s+/g, '_')
    .toUpperCase();
}

/** Construye la URL CDN del GeoJSON para la comuna. Requiere H-F4.1. */
export function geoJsonUrl(codigoRegion: string, nombreComuna: string): string {
  return `/geo-data/${codigoRegion}_PRC_${normalizeComuna(nombreComuna)}.json`;
}

// ── IndexedDB para GeoJSON ────────────────────────────────────────────────────

function openGeoIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_GEO_NAME, IDB_GEO_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(GEO_STORE)) {
        db.createObjectStore(GEO_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function geoIDBGet(key: string): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const db = await openGeoIDB();
    return new Promise((resolve) => {
      const req = db.transaction(GEO_STORE, 'readonly').objectStore(GEO_STORE).get(key);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function geoIDBPut(key: string, data: GeoJSON.FeatureCollection): Promise<void> {
  try {
    const db = await openGeoIDB();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(GEO_STORE, 'readwrite').objectStore(GEO_STORE).put({ key, data, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* best-effort */ }
}

// ── Cache en memoria (solo comuna activa) ─────────────────────────────────────

let memCache: { key: string; data: GeoJSON.FeatureCollection } | null = null;

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Obtiene el GeoJSON de la comuna.
 * Orden de resolución: memoria → IndexedDB → CDN fetch
 */
export async function getGeoJsonComuna(
  codigoRegion: string,
  nombreComuna: string,
): Promise<GeoJSON.FeatureCollection | null> {
  const key = `${codigoRegion}_${normalizeComuna(nombreComuna)}`;

  // 1. Memoria (solo si es la misma comuna activa)
  if (memCache?.key === key) return memCache.data;

  // 2. IndexedDB
  const cached = await geoIDBGet(key);
  if (cached) {
    memCache = { key, data: cached };
    return cached;
  }

  // 3. CDN fetch (requiere H-F4.1)
  try {
    const url = geoJsonUrl(codigoRegion, nombreComuna);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`);
    const geojson: GeoJSON.FeatureCollection = await res.json();

    memCache = { key, data: geojson };
    await geoIDBPut(key, geojson); // guardar en IndexedDB
    return geojson;
  } catch (err) {
    console.warn('[GeoJsonService] No se pudo obtener el GeoJSON:', err);
    return null;
  }
}

/** Limpia la caché en memoria (ej. al cambiar de proyecto/comuna) */
export function clearGeoMemCache(): void {
  memCache = null;
}
